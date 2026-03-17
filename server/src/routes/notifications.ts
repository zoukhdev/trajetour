import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /notifications - Get user notifications
router.get('/', async (req, res, next) => {
    try {
        const userId = req.user!.id;
        const { page = 1, limit = 20, unread_only = 'false' } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        let whereClause = 'WHERE user_id = $1';
        const params: any[] = [userId];

        if (unread_only === 'true') {
            whereClause += ' AND is_read = FALSE';
        }

        // Get notifications
        const result = await pool.query(
            `SELECT 
                id,
                title,
                message,
                type,
                category,
                related_order_id,
                related_payment_id,
                is_read,
                created_at,
                read_at
             FROM notifications
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, Number(limit), offset]
        );

        // Get total count
        const countResult = await pool.query(
            `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
            params
        );

        const total = parseInt(countResult.rows[0].total);

        res.json({
            notifications: result.rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /notifications/unread-count - Get unread notifications count
router.get('/unread-count', async (req, res, next) => {
    try {
        const userId = req.user!.id;

        const result = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
            [userId]
        );

        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        next(error);
    }
});

// PATCH /notifications/:id/read - Mark notification as read
router.patch('/:id/read', async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const result = await pool.query(
            `UPDATE notifications 
             SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// POST /notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', async (req, res, next) => {
    try {
        const userId = req.user!.id;

        await pool.query(
            `UPDATE notifications 
             SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND is_read = FALSE`,
            [userId]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
});

// DELETE /notifications/:id - Delete a notification
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const result = await pool.query(
            'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        next(error);
    }
});

// DELETE /notifications - Clear all read notifications
router.delete('/', async (req, res, next) => {
    try {
        const userId = req.user!.id;

        await pool.query(
            'DELETE FROM notifications WHERE user_id = $1 AND is_read = TRUE',
            [userId]
        );

        res.json({ message: 'Read notifications cleared' });
    } catch (error) {
        next(error);
    }
});

export default router;
