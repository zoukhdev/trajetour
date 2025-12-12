import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, expenseSchema } from '../middleware/validation.js';
import { logAudit } from '../services/auditLog.js';

const router = express.Router();

// Helper to map DB columns (snake_case) to API model (camelCase)
const mapExpenseResponse = (row: any) => ({
    id: row.id,
    designation: row.designation,
    category: row.category,
    amount: parseFloat(row.amount),
    currency: row.currency,
    exchangeRate: parseFloat(row.exchange_rate),
    expenseDate: row.expense_date,
    accountId: row.account_id,
    createdAt: row.created_at,
    createdBy: row.created_by
});

// Get all expenses with pagination
router.get('/',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req: AuthRequest, res, next) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.search as string || '';
            const offset = (page - 1) * limit;

            let query = 'SELECT COUNT(*) FROM expenses';
            let params: any[] = [];

            if (search) {
                query += ' WHERE designation ILIKE $1';
                params = [`%${search}%`];
            }

            const countResult = await pool.query(query, params);
            const total = parseInt(countResult.rows[0].count);

            query = search
                ? 'SELECT * FROM expenses WHERE designation ILIKE $1 ORDER BY expense_date DESC LIMIT $2 OFFSET $3'
                : 'SELECT * FROM expenses ORDER BY expense_date DESC LIMIT $1 OFFSET $2';

            params = search ? [`%${search}%`, limit, offset] : [limit, offset];

            const result = await pool.query(query, params);

            res.json({
                data: result.rows.map(mapExpenseResponse),
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

// Get single expense
router.get('/:id',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req, res, next) => {
        try {
            const result = await pool.query(
                'SELECT * FROM expenses WHERE id = $1',
                [req.params.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Expense not found' });
            }

            res.json(mapExpenseResponse(result.rows[0]));
        } catch (error) {
            next(error);
        }
    }
);

// Create expense
router.post('/',
    authMiddleware,
    requirePermission('manage_financials'),
    validate(expenseSchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { designation, category, amount, currency, exchangeRate, expenseDate, accountId } = req.body;

            const result = await client.query(
                `INSERT INTO expenses (
                    designation, category, amount, currency, 
                    exchange_rate, expense_date, account_id, created_by
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [
                    designation, category, amount, currency,
                    exchangeRate, expenseDate, accountId || null, req.user!.id
                ]
            );

            const newExpense = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'expense',
                entityId: newExpense.id,
                changes: newExpense,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.status(201).json(mapExpenseResponse(newExpense));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Update expense
router.put('/:id',
    authMiddleware,
    requirePermission('manage_financials'),
    validate(expenseSchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { designation, category, amount, currency, exchangeRate, expenseDate, accountId } = req.body;

            const result = await client.query(
                `UPDATE expenses 
                 SET designation = $1, category = $2, amount = $3, 
                     currency = $4, exchange_rate = $5, expense_date = $6, 
                     account_id = $7
                 WHERE id = $8
                 RETURNING *`,
                [
                    designation, category, amount, currency,
                    exchangeRate, expenseDate, accountId || null, req.params.id
                ]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Expense not found' });
            }

            const updatedExpense = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'expense',
                entityId: updatedExpense.id,
                changes: updatedExpense,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json(mapExpenseResponse(updatedExpense));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Delete expense
router.delete('/:id',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                'DELETE FROM expenses WHERE id = $1 RETURNING id',
                [req.params.id]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Expense not found' });
            }

            await logAudit(client, {
                userId: req.user!.id,
                action: 'DELETE',
                entityType: 'expense',
                entityId: req.params.id,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json({ message: 'Expense deleted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
