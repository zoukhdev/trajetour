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

            const { orderId, amount, currency, exchangeRate, method, paymentDate } = req.body;

            // Calculate DZD amount (backend validation/calculation)
            // Ideally should match frontend, but good to have safeguard
            const amountDZD = currency === 'DZD' ? amount : amount * exchangeRate;

            const result = await client.query(
                `INSERT INTO payments (
                    order_id, amount, currency, amount_dzd, 
                    exchange_rate, method, payment_date, 
                    is_validated
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [
                    orderId,
                    amount,
                    currency,
                    amountDZD,
                    exchangeRate,
                    method,
                    paymentDate,
                    true // Auto-validated
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
                isValidated: row.is_validated
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

// Validate payment
router.patch('/:id/validate',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            const { isValidated } = req.body;

            const result = await client.query(
                `UPDATE payments
                 SET is_validated = $1
                 WHERE id = $2
                 RETURNING *`,
                [isValidated, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Payment not found" });
            }

            const updatedPayment = result.rows[0];

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
                isValidated: row.is_validated
            });

            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'payment',
                entityId: updatedPayment.id,
                changes: { isValidated },
                ipAddress: req.ip
            });

            res.json(mapPaymentResponse(updatedPayment));
        } catch (error) {
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
