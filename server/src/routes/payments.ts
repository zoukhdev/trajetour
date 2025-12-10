import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, paymentSchema } from '../middleware/validation.js';
import { logAudit } from '../services/auditLog.js';

const router = express.Router();

// Create payment
router.post('/',
    authMiddleware,
    requirePermission('manage_financials'),
    validate(paymentSchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { orderId, amount, currency, exchangeRate, method, paymentDate, accountId } = req.body;

            // Calculate DZD amount (backend validation/calculation)
            const amountDZD = currency === 'DZD' ? amount : amount * exchangeRate;

            const result = await client.query(
                `INSERT INTO payments (
                    order_id, amount, currency, amount_dzd, 
                    exchange_rate, method, payment_date, 
                    is_validated, account_id
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [
                    orderId,
                    amount,
                    currency,
                    amountDZD,
                    exchangeRate,
                    method,
                    paymentDate,
                    false, // Default to FALSE (requires validation)
                    accountId || null
                ]
            );

            const newPayment = result.rows[0];

            // Helper to map snake_case to camelCase
            const mapPaymentResponse = (row: any) => ({
                id: row.id,
                orderId: row.order_id,
                amount: row.amount,
                currency: row.currency,
                amountDZD: row.amount_dzd,
                exchangeRateUsed: row.exchange_rate,
                method: row.method,
                paymentDate: row.payment_date,
                isValidated: row.is_validated,
                accountId: row.account_id
            });

            await logAudit(client, {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'payment',
                entityId: newPayment.id,
                changes: newPayment,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.status(201).json(mapPaymentResponse(newPayment));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Validate payment (and trigger Transaction)
router.patch('/:id/validate',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { id } = req.params;
            const { isValidated } = req.body;

            // 1. Get Payment
            const payRes = await client.query('SELECT * FROM payments WHERE id = $1', [id]);
            if (payRes.rows.length === 0) throw new Error('Payment not found');
            const payment = payRes.rows[0];

            if (payment.is_validated === isValidated) {
                // No change
                await client.query('ROLLBACK');
                return res.json({ message: 'No change' });
            }

            // 2. Update Payment
            const result = await client.query(
                `UPDATE payments
                 SET is_validated = $1
                 WHERE id = $2
                 RETURNING *`,
                [isValidated, id]
            );
            const updatedPayment = result.rows[0];

            // 3. If Validated: Create Transaction & Update Order Status
            if (isValidated) {
                // Create Transaction if account exists
                if (payment.account_id) {
                    await client.query(
                        `INSERT INTO transactions (
                             type, amount, currency, amount_dzd, 
                             source, reference_id, description, 
                             transaction_date, account_id, payment_id
                         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                         ON CONFLICT DO NOTHING`,
                        [
                            'IN',
                            payment.amount,
                            payment.currency,
                            payment.amount_dzd,
                            'Order',
                            payment.order_id,
                            `Paiement Validé (Ref: ${payment.order_id.substr(0, 6)})`,
                            new Date(),
                            payment.account_id,
                            id
                        ]
                    );
                }
            } else {
                // If Invalidated (FALSE): Remove associated transaction
                await client.query('DELETE FROM transactions WHERE payment_id = $1', [id]);
            }

            // Update Order Status Logic
            // Calculate total paid (validated only)
            const paidRes = await client.query(
                `SELECT SUM(amount_dzd) as total_paid FROM payments WHERE order_id = $1 AND is_validated = true`,
                [payment.order_id]
            );
            const totalPaid = parseFloat(paidRes.rows[0].total_paid || '0');

            const orderRes = await client.query('SELECT total_amount FROM orders WHERE id = $1', [payment.order_id]);
            const orderTotal = parseFloat(orderRes.rows[0].total_amount);

            let newStatus = 'Partiel';
            if (totalPaid >= orderTotal - 5) newStatus = 'Payé'; // Tolerance
            if (totalPaid === 0) newStatus = 'Non payé';

            await client.query('UPDATE orders SET status = $1 WHERE id = $2', [newStatus, payment.order_id]);

            // Log Audit
            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'payment',
                entityId: updatedPayment.id,
                changes: { isValidated },
                ipAddress: req.ip
            });

            await client.query('COMMIT');

            // Helper to map snake_case to camelCase
            const mapPaymentResponse = (row: any) => ({
                id: row.id,
                orderId: row.order_id,
                amount: row.amount,
                currency: row.currency,
                amountDZD: row.amount_dzd,
                exchangeRateUsed: row.exchange_rate,
                method: row.method,
                paymentDate: row.payment_date,
                isValidated: row.is_validated,
                accountId: row.account_id
            });

            res.json(mapPaymentResponse(updatedPayment));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Update Payment (PUT) for fixing errors (Request 2)
router.put('/:id',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { id } = req.params;
            const { amount, currency, exchangeRate, method, accountId } = req.body;

            const amountDZD = currency === 'DZD' ? amount : amount * exchangeRate;

            const result = await client.query(
                `UPDATE payments
                 SET amount = $1, currency = $2, exchange_rate = $3, 
                     amount_dzd = $4, method = $5, account_id = $6
                 WHERE id = $7
                 RETURNING *`,
                [amount, currency, exchangeRate, amountDZD, method, accountId || null, id]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: "Payment not found" });
            }

            const updatedPayment = result.rows[0];

            // Auto-invalidate when modified
            await client.query('UPDATE payments SET is_validated = false WHERE id = $1', [id]);
            updatedPayment.is_validated = false;

            // Remove any existing transaction since we invalidated it (and details changed)
            await client.query('DELETE FROM transactions WHERE payment_id = $1', [id]);

            // Update Order Status (since payment might have been valid before)
            // Recalculate totals
            const paidRes = await client.query(
                `SELECT SUM(amount_dzd) as total_paid FROM payments WHERE order_id = $1 AND is_validated = true`,
                [updatedPayment.order_id]
            );
            const totalPaid = parseFloat(paidRes.rows[0].total_paid || '0');
            const orderRes = await client.query('SELECT total_amount FROM orders WHERE id = $1', [updatedPayment.order_id]);
            const orderTotal = parseFloat(orderRes.rows[0].total_amount);

            let newStatus = 'Partiel';
            if (totalPaid >= orderTotal - 5) newStatus = 'Payé';
            if (totalPaid === 0) newStatus = 'Non payé';

            await client.query('UPDATE orders SET status = $1 WHERE id = $2', [newStatus, updatedPayment.order_id]);

            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'payment',
                entityId: updatedPayment.id,
                changes: req.body,
                ipAddress: req.ip
            });

            await client.query('COMMIT');

            // Helper to map snake_case to camelCase
            const mapPaymentResponse = (row: any) => ({
                id: row.id,
                orderId: row.order_id,
                amount: row.amount,
                currency: row.currency,
                amountDZD: row.amount_dzd,
                exchangeRateUsed: row.exchange_rate,
                method: row.method,
                paymentDate: row.payment_date,
                isValidated: row.is_validated,
                accountId: row.account_id
            });

            res.json(mapPaymentResponse(updatedPayment));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
