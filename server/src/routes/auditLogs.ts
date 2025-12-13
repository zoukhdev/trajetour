import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/audit-logs
 * @desc    Get paginated audit logs with filtering
 * @access  Admin Only
 */
router.get('/',
    authMiddleware,
    requirePermission('manage_users'), // Restrict to admin/managers
    async (req: AuthRequest, res) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const { userId, action, entityType, startDate, endDate } = req.query;

            // Build Query
            let query = `
                SELECT a.*, u.username, u.role
                FROM audit_logs a
                LEFT JOIN users u ON a.user_id = u.id
                WHERE 1=1
            `;
            const params: any[] = [];
            let paramIndex = 1;

            if (userId) {
                query += ` AND a.user_id = $${paramIndex}`;
                params.push(userId);
                paramIndex++;
            }

            if (action) {
                query += ` AND a.action = $${paramIndex}`;
                params.push(action);
                paramIndex++;
            }

            if (entityType) {
                query += ` AND a.entity_type = $${paramIndex}`;
                params.push(entityType);
                paramIndex++;
            }

            if (startDate) {
                query += ` AND a.created_at >= $${paramIndex}`;
                params.push(startDate);
                paramIndex++;
            }

            if (endDate) {
                query += ` AND a.created_at <= $${paramIndex}`;
                params.push(endDate);
                paramIndex++;
            }

            // Count total for pagination
            const countRes = await pool.query(
                `SELECT COUNT(*) FROM (${query}) as sub`,
                params
            );
            const total = parseInt(countRes.rows[0].count);

            // Add sorting and pagination
            query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);

            res.json({
                data: result.rows,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching audit logs:', error);
            res.status(500).json({ message: 'Server error fetching logs' });
        }
    }
);

export default router;
