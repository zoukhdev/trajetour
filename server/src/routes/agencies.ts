import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, agencySchema } from '../middleware/validation.js';
import { logAudit } from '../services/auditLog.js';

const router = express.Router();

// Helper to map DB columns (snake_case) to API model (camelCase)
const mapAgencyResponse = (row: any) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    email: row.email,
    phone: row.phone,
    address: row.address,
    subscription: row.subscription,
    creditStart: parseFloat(row.credit_start),
    currentCredit: parseFloat(row.current_credit),
    createdAt: row.created_at
});

// Get all agencies with pagination
router.get('/',
    authMiddleware,
    requirePermission('manage_business'),
    async (req: AuthRequest, res, next) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.search as string || '';
            const offset = (page - 1) * limit;

            let query = 'SELECT COUNT(*) FROM agencies';
            let params: any[] = [];

            if (search) {
                query += ' WHERE name ILIKE $1 OR email ILIKE $1';
                params = [`%${search}%`];
            }

            const countResult = await pool.query(query, params);
            const total = parseInt(countResult.rows[0].count);

            query = search
                ? 'SELECT * FROM agencies WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3'
                : 'SELECT * FROM agencies ORDER BY created_at DESC LIMIT $1 OFFSET $2';

            params = search ? [`%${search}%`, limit, offset] : [limit, offset];

            const result = await pool.query(query, params);

            res.json({
                data: result.rows.map(mapAgencyResponse),
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

// Get single agency
router.get('/:id',
    authMiddleware,
    requirePermission('manage_business'),
    async (req, res, next) => {
        try {
            const result = await pool.query(
                'SELECT * FROM agencies WHERE id = $1',
                [req.params.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Agency not found' });
            }

            res.json(mapAgencyResponse(result.rows[0]));
        } catch (error) {
            next(error);
        }
    }
);

// Create agency
router.post('/',
    authMiddleware,
    requirePermission('manage_business'),
    validate(agencySchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { name, type, email, phone, address, subscription, creditStart, currentCredit } = req.body;

            const result = await client.query(
                `INSERT INTO agencies (
                    name, type, email, phone, address, 
                    subscription, credit_start, current_credit
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [
                    name, type, email || null, phone || null, address || null,
                    subscription || 'Standard', creditStart || 0, currentCredit || 0
                ]
            );

            const newAgency = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'agency',
                entityId: newAgency.id,
                changes: newAgency,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.status(201).json(mapAgencyResponse(newAgency));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Update agency
router.put('/:id',
    authMiddleware,
    requirePermission('manage_business'),
    validate(agencySchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { name, type, email, phone, address, subscription, creditStart, currentCredit } = req.body;

            const result = await client.query(
                `UPDATE agencies 
                 SET name = $1, type = $2, email = $3, 
                     phone = $4, address = $5, subscription = $6,
                     credit_start = $7, current_credit = $8
                 WHERE id = $9
                 RETURNING *`,
                [
                    name, type, email || null, phone || null, address || null,
                    subscription || null, creditStart, currentCredit, req.params.id
                ]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Agency not found' });
            }

            const updatedAgency = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'agency',
                entityId: updatedAgency.id,
                changes: updatedAgency,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json(mapAgencyResponse(updatedAgency));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Delete agency
router.delete('/:id',
    authMiddleware,
    requirePermission('manage_business'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                'DELETE FROM agencies WHERE id = $1 RETURNING id',
                [req.params.id]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Agency not found' });
            }

            await logAudit(client, {
                userId: req.user!.id,
                action: 'DELETE',
                entityType: 'agency',
                entityId: req.params.id,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json({ message: 'Agency deleted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
