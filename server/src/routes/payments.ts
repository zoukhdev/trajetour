import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, paymentSchema } from '../middleware/validation.js';
import { logAudit } from '../services/auditLog.js';
import { AppError } from '../middleware/errorHandler.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

async function sendPaymentReceiptEmail(client: any, orderId: string, payment: any) {
    if (!process.env.RESEND_API_KEY) return;
    try {
        const res = await client.query(`
            SELECT o.reference, c.full_name as client_name, u.email, 
                   (SELECT name FROM agencies WHERE id = o.agency_id) as agency_name
            FROM orders o
            JOIN clients c ON o.client_id = c.id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE o.id = $1
        `, [orderId]);
        const info = res.rows[0];
        if (info && info.email) {
            const agencyName = info.agency_name || 'Votre Agence de Voyage';
            await resend.emails.send({
                from: `${agencyName} <hello@trajetour.com>`,
                to: [info.email],
                subject: `🧾 Reçu de paiement - Réservation ${info.reference}`,
                html: `
                    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h2 style="color: #10B981; margin-bottom: 5px;">Paiement Enregistré</h2>
                            <p style="color: #64748b; font-size: 14px; margin-top: 0;">Référence: <strong>${info.reference}</strong></p>
                        </div>
                        <p>Bonjour <strong>${info.client_name}</strong>,</p>
                        <p>Nous vous confirmons l'enregistrement de votre paiement de <strong>${parseFloat(payment.amount_dzd).toFixed(2)} DZD</strong> pour votre réservation avec <strong>${agencyName}</strong>.</p>
                        
                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">Détails du paiement</h3>
                            <table style="width: 100%; font-size: 14px;">
                                <tr>
                                    <td style="padding: 4px 0; color: #475569;">Montant :</td>
                                    <td style="padding: 4px 0; text-align: right; font-weight: bold;">${parseFloat(payment.amount_dzd).toFixed(2)} DZD</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; color: #475569;">Méthode :</td>
                                    <td style="padding: 4px 0; text-align: right;">${payment.method}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; color: #475569;">Date :</td>
                                    <td style="padding: 4px 0; text-align: right;">${new Date(payment.payment_date).toLocaleDateString('fr-FR')}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <p style="font-size: 14px; color: #475569; line-height: 1.5;">Vous pouvez suivre l'état de votre réservation en vous connectant à votre espace client.</p>
                        
                        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                            <p style="font-size: 13px; color: #94a3b8;">Ce message est généré automatiquement par <a href="https://trajetour.com" style="color: #2563EB; text-decoration: none;">Trajetour</a> pour <strong>${agencyName}</strong>.</p>
                        </div>
                    </div>
                `
            });
            console.log(`✅ Payment receipt email sent to ${info.email}`);
        }
    } catch (err) {
        console.error('Failed to send payment receipt email:', err);
    }
}

const router = express.Router();

// Get all payments (Admin/Agent)
router.get('/',
    authMiddleware,
    requirePermission('view_financials'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            const { page = 1, limit = 50, status, method, startDate, endDate, clientName } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            let query = `
                SELECT p.*, 
                       o.id as order_ref,
                       c.full_name as client_name,
                       c.type as client_type,
                       u.username as validated_by_name
                FROM payments p
                JOIN orders o ON p.order_id = o.id
                JOIN clients c ON o.client_id = c.id
                LEFT JOIN users u ON p.validated_by = u.id
                WHERE 1=1
            `;
            const params: any[] = [];
            let paramIndex = 1;

            // Permission Filter
            if (req.user?.agencyId) {
                query += ` AND o.agency_id = $${paramIndex}`;
                params.push(req.user.agencyId);
                paramIndex++;
            }

            // Status Filter (pending/validated/rejected)
            if (status !== undefined) {
                if (status === 'pending') {
                    query += ` AND p.is_validated IS NULL`;
                } else if (status === 'validated') {
                    query += ` AND p.is_validated = true`;
                } else if (status === 'rejected') {
                    query += ` AND p.is_validated = false`;
                }
            }

            if (method) {
                query += ` AND p.method = $${paramIndex}`;
                params.push(method);
                paramIndex++;
            }

            if (startDate) {
                query += ` AND p.payment_date >= $${paramIndex}`;
                params.push(startDate);
                paramIndex++;
            }

            if (endDate) {
                query += ` AND p.payment_date <= $${paramIndex}`;
                params.push(endDate);
                paramIndex++;
            }

            if (clientName) {
                query += ` AND c.full_name ILIKE $${paramIndex}`;
                params.push(`%${clientName}%`);
                paramIndex++;
            }

            // Count total
            const countQuery = `SELECT COUNT(*) FROM (${query}) as count_table`;
            const countResult = await client.query(countQuery, params);
            const total = parseInt(countResult.rows[0].count);

            // Add sorting and pagination
            query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await client.query(query, params);

            // Map response
            const payments = result.rows.map(row => ({
                id: row.id,
                orderId: row.order_id,
                amount: row.amount,
                currency: row.currency,
                amountDZD: row.amount_dzd,
                exchangeRateUsed: row.exchange_rate,
                method: row.method,
                paymentDate: row.payment_date,
                isValidated: row.is_validated,
                accountId: row.account_id,
                receiptUrl: row.receipt_url,
                clientName: row.client_name,
                clientType: row.client_type,
                validatedBy: row.validated_by,
                validatedByName: row.validated_by_name,
                validatedAt: row.validated_at,
                createdAt: row.created_at
            }));

            res.json({
                data: payments,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            next(error);
        } finally {
            client.release();
        }
    }
);

// Create payment
router.post('/',
    authMiddleware,
    (req: AuthRequest, res, next) => {
        if (req.user?.role === 'admin' || req.user?.role === 'agent' || req.user?.permissions.includes('manage_financials')) {
            next();
        } else {
            res.status(403).json({ error: 'Insufficient permissions' });
        }
    },
    validate(paymentSchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { orderId, amount, currency, exchangeRate, method, paymentDate, accountId } = req.body;

            // Calculate DZD amount (backend validation/calculation)
            const amountDZD = currency === 'DZD' ? amount : amount * exchangeRate;

            // SECURITY FIX: Validate payment amount against order balance
            // Get order total
            const orderRes = await client.query(
                'SELECT total_amount_dzd FROM orders WHERE id = $1',
                [orderId]
            );

            if (orderRes.rows.length === 0) {
                throw new AppError(404, 'Order not found');
            }

            const orderTotal = parseFloat(orderRes.rows[0].total_amount_dzd);

            // Get already paid amount (validated payments only)
            const paidRes = await client.query(
                `SELECT COALESCE(SUM(amount_dzd), 0) as total_paid 
                 FROM payments 
                 WHERE order_id = $1 AND is_validated = true`,
                [orderId]
            );

            const alreadyPaid = parseFloat(paidRes.rows[0].total_paid);
            const remainingBalance = orderTotal - alreadyPaid;

            // Validate payment doesn't exceed remaining balance (with 1 DZD tolerance)
            if (amountDZD > remainingBalance + 1) {
                throw new AppError(400,
                    `Payment exceeds remaining balance. Order total: ${orderTotal.toFixed(2)} DZD, Already paid: ${alreadyPaid.toFixed(2)} DZD, Remaining: ${remainingBalance.toFixed(2)} DZD, Attempted: ${amountDZD.toFixed(2)} DZD`
                );
            }

            console.log(`✅ Payment validation passed: ${amountDZD.toFixed(2)} DZD (Remaining balance: ${remainingBalance.toFixed(2)} DZD)`);

            // Sanitize accountId
            const sanitizedAccountId = (accountId && accountId.trim() !== '') ? accountId : null;

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
                    null, // Default to NULL (Pending) requires validation
                    sanitizedAccountId
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

            // Send Payment Receipt Email async
            sendPaymentReceiptEmail(client, orderId, newPayment);

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

            // SECURITY FIX: IDOR Protection - Check payment ownership via order
            const orderCheck = await client.query(
                'SELECT created_by, agency_id FROM orders WHERE id = $1',
                [payment.order_id]
            );

            if (orderCheck.rows.length === 0) {
                throw new AppError(404, 'Associated order not found');
            }

            const order = orderCheck.rows[0];

            // Non-admins can only validate payments for their own orders
            if (req.user?.role !== 'admin') {
                if (order.created_by !== req.user?.id &&
                    order.agency_id !== req.user?.agencyId) {
                    console.log(`🚫 IDOR attempt blocked: User ${req.user?.id} tried to validate payment for order created by ${order.created_by}`);
                    throw new AppError(403,
                        'Unauthorized to validate this payment'
                    );
                }
            }

            if (payment.is_validated === isValidated) {
                // No change
                await client.query('ROLLBACK');
                return res.json({ message: 'No change' });
            }

            // 2. Update Payment with Audit Trail
            const result = await client.query(
                `UPDATE payments
                 SET is_validated = $1, validated_by = $2, validated_at = $3
                 WHERE id = $4
                 RETURNING *`,
                [isValidated, req.user!.id, new Date(), id]
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
    (req: AuthRequest, res, next) => {
        if (req.user?.role === 'admin' || req.user?.role === 'agent' || req.user?.permissions.includes('manage_financials')) {
            next();
        } else {
            res.status(403).json({ error: 'Insufficient permissions' });
        }
    },
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

            // Auto-invalidate when modified (Set to Pending)
            await client.query('UPDATE payments SET is_validated = NULL WHERE id = $1', [id]);
            updatedPayment.is_validated = null;

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

// Upload Receipt (Client/Agent)
router.post('/:orderId/upload-receipt',
    authMiddleware,
    // Add file upload middleware
    async (req, res, next) => {
        try {
            const { upload } = await import('../utils/fileUpload.js');
            const uploadMiddleware = upload.single('receipt');
            uploadMiddleware(req, res, (err) => {
                if (err) return next(new AppError(400, 'File upload failed: ' + err.message));
                next();
            });
        } catch (e) {
            next(e);
        }
    },
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { orderId } = req.params;
            const { method } = req.body; // 'CCP' or 'Baridimob'

            if (!req.file) {
                throw new AppError(400, 'No receipt file provided');
            }

            // check order ownership
            const orderRes = await client.query('SELECT client_id, total_amount FROM orders WHERE id = $1', [orderId]);
            if (orderRes.rows.length === 0) throw new AppError(404, 'Order not found');
            const order = orderRes.rows[0];

            if (req.user?.role === 'client' && order.client_id !== req.user.clientId) {
                throw new AppError(403, 'Unauthorized');
            }

            // Upload to Cloudinary
            const { uploadToCloudinary } = await import('../utils/fileUpload.js');
            const uploadResult = await uploadToCloudinary(req.file.buffer, 'trajetour/receipts');

            // Create Payment Record (Pending)
            // We assume full amount or partial? Usually receipts are for full or specific amount. 
            // For now, let's assume the user inputs amount or we take remaining?
            // BETTER: User should inputs amount in the modal. IF not, defaults to full?
            // Let's rely on body.amount if present, else 0 (needs admin verify).

            const amount = req.body.amount || 0;

            const result = await client.query(
                `INSERT INTO payments (
                    order_id, amount, currency, amount_dzd, 
                    method, payment_date, receipt_url, is_validated
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [
                    orderId,
                    amount,
                    'DZD',
                    amount, // amount_dzd
                    method || 'CCP',
                    new Date(),
                    uploadResult.secure_url,
                    null // Pending
                ]
            );

            const newPayment = result.rows[0];

            // Update Order Status to 'En attente'
            await client.query(
                `UPDATE orders SET status = 'En attente' WHERE id = $1 AND status != 'Payé'`,
                [orderId]
            );

            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPLOAD_RECEIPT',
                entityType: 'payment',
                entityId: newPayment.id,
                changes: { url: uploadResult.secure_url },
                ipAddress: req.ip
            });

            await client.query('COMMIT');

            res.status(201).json({
                message: 'Receipt uploaded successfully',
                paymentId: newPayment.id,
                url: newPayment.receipt_url,
                status: 'Pending Verification'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
