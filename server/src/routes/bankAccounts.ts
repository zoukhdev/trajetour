import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../services/auditLog.js';
import { generateShortId } from '../utils/idGenerator.js';

const router = express.Router();

const mapAccountResponse = (row: any) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    balance: parseFloat(row.balance),
    currency: row.currency,
    accountNumber: row.account_number,
    isDefault: row.is_default,
    icon: row.icon,
    createdAt: row.created_at
});

// Get all accounts
router.get('/',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req: AuthRequest, res, next) => {
        try {
            const result = await pool.query('SELECT * FROM bank_accounts ORDER BY is_default DESC, name ASC');

            // If no accounts exist, seed them (Self-Healing)
            if (result.rows.length === 0) {
                const defaultAccounts = [
                    { name: 'Caisse Principale', type: 'Caisse', balance: 0, currency: 'DZD', is_default: true, icon: 'Wallet' },
                    { name: 'Compte CPA', type: 'Bank', balance: 0, currency: 'DZD', account_number: '00400123456789', icon: 'CreditCard' },
                    { name: 'Compte BADR', type: 'Bank', balance: 0, currency: 'DZD', account_number: '00300987654321', icon: 'Landmark' },
                    { name: 'Caisse Euro', type: 'Caisse', balance: 0, currency: 'EUR', icon: 'Euro' },
                    { name: 'Caisse Dollar', type: 'Caisse', balance: 0, currency: 'USD', icon: 'DollarSign' },
                    { name: 'Baridimob', type: 'Bank', balance: 0, currency: 'DZD', account_number: '00799999000000', icon: 'Smartphone' },
                ];

                const seeded = [];
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    for (const acc of defaultAccounts) {
                        const r = await client.query(
                            `INSERT INTO bank_accounts (name, type, balance, currency, is_default, icon, account_number)
                             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                            [acc.name, acc.type, acc.balance, acc.currency, acc.is_default || false, acc.icon, acc.account_number || null]
                        );
                        seeded.push(r.rows[0]);
                    }
                    await client.query('COMMIT');
                    return res.json(seeded.map(mapAccountResponse));
                } catch (e) {
                    await client.query('ROLLBACK');
                    throw e;
                } finally {
                    client.release();
                }
            }

            res.json(result.rows.map(mapAccountResponse));
        } catch (error) {
            next(error);
        }
    }
);

// Create account
router.post('/',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { name, type, balance, currency, accountNumber, isDefault, icon } = req.body;
            const code = generateShortId();

            const result = await client.query(
                `INSERT INTO bank_accounts (name, type, balance, currency, account_number, is_default, icon, code)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [name, type, balance || 0, currency || 'DZD', accountNumber, isDefault || false, icon, code]
            );

            const newAccount = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'bank_account',
                entityId: newAccount.id,
                changes: mapAccountResponse(newAccount),
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.status(201).json(mapAccountResponse(newAccount));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Update account
router.put('/:id',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { name, type, currency, accountNumber, isDefault, icon } = req.body;
            // Note: Balance usually updated via Transactions, not direct PUT, but allowing for edits if needed

            const result = await client.query(
                `UPDATE bank_accounts 
                 SET name = $1, type = $2, currency = $3, account_number = $4, is_default = $5, icon = $6
                 WHERE id = $7
                 RETURNING *`,
                [name, type, currency, accountNumber, isDefault, icon, req.params.id]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Account not found' });
            }

            const updated = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'bank_account',
                entityId: updated.id,
                changes: mapAccountResponse(updated),
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json(mapAccountResponse(updated));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Delete account
router.delete('/:id',
    authMiddleware,
    requirePermission('manage_financials'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Check dependencies (transactions/payments)
            // For now simple delete, relies on DB constraints
            await client.query('DELETE FROM bank_accounts WHERE id = $1', [req.params.id]);

            await logAudit(client, {
                userId: req.user!.id,
                action: 'DELETE',
                entityType: 'bank_account',
                entityId: req.params.id,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json({ message: 'Deleted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
