import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
// Note: Validation schema for transactions needs to be added to validation.ts or handled here
import { logAudit } from '../services/auditLog.js';

const router = express.Router();

const mapTransactionResponse = (row: any) => ({
    id: row.id,
    type: row.type,
    amount: parseFloat(row.amount),
    amountDZD: parseFloat(row.amount_dzd),
    currency: row.currency,
    source: row.source,
    referenceId: row.reference_id,
    description: row.description,
    date: row.transaction_date,
    accountId: row.account_id,
    createdAt: row.created_at
});

// Get all transactions
router.get('/',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req: AuthRequest, res, next) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const accountId = req.query.accountId as string;
            const offset = (page - 1) * limit;

            let query = 'SELECT COUNT(*) FROM transactions';
            let params: any[] = [];

            if (accountId) {
                query += ' WHERE account_id = $1';
                params = [accountId];
            }

            const countResult = await pool.query(query, params);
            const total = parseInt(countResult.rows[0].count);

            query = accountId
                ? 'SELECT * FROM transactions WHERE account_id = $1 ORDER BY transaction_date DESC LIMIT $2 OFFSET $3'
                : 'SELECT * FROM transactions ORDER BY transaction_date DESC LIMIT $1 OFFSET $2';

            params = accountId ? [accountId, limit, offset] : [limit, offset];

            const result = await pool.query(query, params);

            res.json({
                data: result.rows.map(mapTransactionResponse),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// Create transaction (Manual entry)
router.post('/',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { type, amount, amountDZD, currency, source, referenceId, description, date, accountId } = req.body;

            // Update Account Balance
            if (accountId) {
                const balanceChange = type === 'IN' ? amount : -amount;
                await client.query(
                    `UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2`,
                    [balanceChange, accountId]
                );
            }

            const result = await client.query(
                `INSERT INTO transactions (
                    type, amount, amount_dzd, currency, source, 
                    reference_id, description, transaction_date, account_id, created_by
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING *`,
                [
                    type, amount, amountDZD || amount, currency, source || 'Manual',
                    referenceId || null, description, date, accountId || null, req.user!.id
                ]
            );

            const newTransaction = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'transaction',
                entityId: newTransaction.id,
                changes: mapTransactionResponse(newTransaction),
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.status(201).json(mapTransactionResponse(newTransaction));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Delete transaction (Void)
router.delete('/:id',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get transaction to revert balance
            const transResult = await client.query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
            if (transResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Transaction not found' });
            }
            const transaction = transResult.rows[0];

            // Revert Account Balance
            if (transaction.account_id) {
                // If it was IN, we subtract. If OUT, we add back.
                const revertAmount = transaction.type === 'IN' ? -parseFloat(transaction.amount) : parseFloat(transaction.amount);
                await client.query(
                    `UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2`,
                    [revertAmount, transaction.account_id]
                );
            }

            await client.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);

            await logAudit(client, {
                userId: req.user!.id,
                action: 'DELETE',
                entityType: 'transaction',
                entityId: req.params.id,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json({ message: 'Transaction deleted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
