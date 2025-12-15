import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, userSchema } from '../middleware/validation.js';
import { logAudit } from '../services/auditLog.js';

import { generateShortId } from '../utils/idGenerator.js';

const router = express.Router();

const mapUserResponse = (row: any) => ({
    id: row.id,
    code: row.code,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    avatar: row.avatar,
    createdAt: row.created_at
});

// Get all users
router.get('/',
    authMiddleware,
    requirePermission('manage_users'),
    async (req: AuthRequest, res, next) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const countResult = await pool.query('SELECT COUNT(*) FROM users');
            const total = parseInt(countResult.rows[0].count);

            const result = await pool.query(
                `SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
                [limit, offset]
            );

            res.json({
                data: result.rows.map(mapUserResponse),
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

// Create user
router.post('/',
    authMiddleware,
    requirePermission('manage_users'),
    validate(userSchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { username, email, password, role, permissions } = req.body;

            // Check existing
            const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'Email already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const code = generateShortId();

            const result = await client.query(
                `INSERT INTO users (username, email, password_hash, role, permissions, code)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [username, email, hashedPassword, role, permissions || [], code]
            );

            const newUser = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'user',
                entityId: newUser.id,
                changes: mapUserResponse(newUser),
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.status(201).json(mapUserResponse(newUser));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Update user
router.put('/:id',
    authMiddleware,
    requirePermission('manage_users'),
    // Note: validation might need adjustment for updates (e.g. password optional)
    // For now simplistic approach
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { username, email, password, role, permissions } = req.body;
            let query = `UPDATE users SET username = $1, email = $2, role = $3, permissions = $4`;
            let params = [username, email, role, permissions];
            let paramIndex = 5;

            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                query += `, password_hash = $${paramIndex}`;
                params.push(hashedPassword);
                paramIndex++;
            }

            query += ` WHERE id = $${paramIndex} RETURNING *`;
            params.push(req.params.id);

            const result = await client.query(query, params);

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'User not found' });
            }

            const updatedUser = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'user',
                entityId: updatedUser.id,
                changes: mapUserResponse(updatedUser),
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json(mapUserResponse(updatedUser));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Delete user
router.delete('/:id',
    authMiddleware,
    requirePermission('manage_users'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                'DELETE FROM users WHERE id = $1 RETURNING id',
                [req.params.id]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'User not found' });
            }

            await logAudit(client, {
                userId: req.user!.id,
                action: 'DELETE',
                entityType: 'user',
                entityId: req.params.id,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
