import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, clientSchema } from '../middleware/validation.js';
import { logAudit } from '../services/auditLog.js';

const router = express.Router();

// Helper to map DB columns (snake_case) to API model (camelCase)
const mapClientResponse = (row: any) => ({
    id: row.id,
    fullName: row.full_name,
    mobileNumber: row.mobile_number,
    type: row.type,
    passportNumber: row.passport_number,
    passportExpiry: row.passport_expiry,
    createdAt: row.created_at
});

// Get all clients with pagination
router.get('/',
    authMiddleware,
    requirePermission('manage_business'),
    async (req: AuthRequest, res, next) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.search as string || '';
            const offset = (page - 1) * limit;

            let query = 'SELECT COUNT(*) FROM clients WHERE 1=1';
            const params: any[] = [];
            let paramIndex = 1;

            if (search) {
                query += ` AND (full_name ILIKE $${paramIndex} OR mobile_number ILIKE $${paramIndex})`;
                params.push(`%${search}%`);
                paramIndex++;
            }

            const resolvedAgencyId = req.user?.agencyId || (req as any).tenantAgencyId;
            if (resolvedAgencyId) {
                query += ` AND agency_id = $${paramIndex}`;
                params.push(resolvedAgencyId);
                paramIndex++;
            }

            const countResult = await pool.query(query, params);
            const total = parseInt(countResult.rows[0].count);

            query = 'SELECT * FROM clients WHERE 1=1';
            const fetchParams: any[] = [];
            let fetchParamIndex = 1;

            if (search) {
                query += ` AND (full_name ILIKE $${fetchParamIndex} OR mobile_number ILIKE $${fetchParamIndex})`;
                fetchParams.push(`%${search}%`);
                fetchParamIndex++;
            }

            const resolvedAgencyIdFetch = req.user?.agencyId || (req as any).tenantAgencyId;
            if (resolvedAgencyIdFetch) {
                query += ` AND agency_id = $${fetchParamIndex}`;
                fetchParams.push(resolvedAgencyIdFetch);
                fetchParamIndex++;
            }

            query += ` ORDER BY created_at DESC LIMIT $${fetchParamIndex} OFFSET $${fetchParamIndex + 1}`;
            fetchParams.push(limit, offset);

            const result = await pool.query(query, fetchParams);

            res.json({
                data: result.rows.map(mapClientResponse),
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

// Get single client
router.get('/:id',
    authMiddleware,
    requirePermission('manage_business'),
    async (req, res, next) => {
        try {
            const result = await pool.query(
                'SELECT * FROM clients WHERE id = $1',
                [req.params.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Client not found' });
            }

            res.json(mapClientResponse(result.rows[0]));
        } catch (error) {
            next(error);
        }
    }
);

// Create client
router.post('/',
    authMiddleware,
    requirePermission('manage_business'),
    validate(clientSchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { fullName, mobileNumber, type, passportNumber, passportExpiry } = req.body;
            const agencyId = req.user?.agencyId;

            const result = await client.query(
                `INSERT INTO clients (full_name, mobile_number, type, passport_number, passport_expiry, agency_id)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [fullName, mobileNumber, type, passportNumber || null, passportExpiry || null, agencyId || null]
            );

            const newClient = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'client',
                entityId: newClient.id,
                changes: newClient,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.status(201).json(mapClientResponse(newClient));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Update client
router.put('/:id',
    authMiddleware,
    requirePermission('manage_business'),
    validate(clientSchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { fullName, mobileNumber, type, passportNumber, passportExpiry } = req.body;

            const result = await client.query(
                `UPDATE clients 
                 SET full_name = $1, mobile_number = $2, type = $3, 
                     passport_number = $4, passport_expiry = $5
                 WHERE id = $6
                 RETURNING *`,
                [fullName, mobileNumber, type, passportNumber || null, passportExpiry || null, req.params.id]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Client not found' });
            }

            const updatedClient = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'client',
                entityId: updatedClient.id,
                changes: updatedClient,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json(mapClientResponse(updatedClient));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Delete client
router.delete('/:id',
    authMiddleware,
    requirePermission('manage_business'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                'DELETE FROM clients WHERE id = $1 RETURNING id',
                [req.params.id]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Client not found' });
            }

            await logAudit(client, {
                userId: req.user!.id,
                action: 'DELETE',
                entityType: 'client',
                entityId: req.params.id,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json({ message: 'Client deleted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
