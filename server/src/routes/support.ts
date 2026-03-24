import express from 'express';
import { masterPool } from '../config/tenantPool.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware as express.RequestHandler);

// GET /api/support/tickets
router.get('/tickets', async (req: AuthRequest, res) => {
    try {
        const { role, agencyId: rawAgencyId, id: userId } = req.user!;
        let query = `
            SELECT t.*, a.subdomain as agency_name,
                   (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id = t.id AND m.is_read = false AND m.role != $1) as unread_count
            FROM support_tickets t
            LEFT JOIN agencies a ON t.agency_id = a.id
        `;
        let params: any[] = [role === 'admin' ? 'admin' : 'agency'];
        
        // Ensure agencyId is valid for agency users. For admin, agencyId might be undefined.
        const agencyId = rawAgencyId === 'null' ? null : rawAgencyId;

        if (role !== 'admin') {
            if (!agencyId) {
                return res.status(403).json({ error: 'Agency ID missing for non-admin user' });
            }
            query += ` WHERE t.agency_id = $2 ORDER BY t.updated_at DESC`;
            params.push(agencyId);
        } else {
            query += ` ORDER BY t.updated_at DESC`;
        }

        const result = await masterPool.query(query, params);
        res.json(result.rows);
    } catch (err: any) {
        console.error('Error fetching tickets', err);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// POST /api/support/tickets
router.post('/tickets', async (req: AuthRequest, res) => {
    try {
        const { title, message } = req.body;
        const { role, agencyId: rawAgencyId, id: userId, email } = req.user!;
        
        const agencyId = rawAgencyId === 'null' ? null : rawAgencyId;

        // For agency users: always use their own agencyId
        // For admin: must supply agencyId in body (targeting a specific agency)
        let targetAgencyId: string | null = null;
        if (role !== 'admin') {
            if (!agencyId) return res.status(403).json({ error: 'Agency ID manquant' });
            targetAgencyId = agencyId;
        } else {
            targetAgencyId = req.body.agencyId || null;
            if (!targetAgencyId) return res.status(400).json({ error: 'Agency ID requis pour admin' });
        }

        await masterPool.query('BEGIN');
        const ticketResult = await masterPool.query(
            `INSERT INTO support_tickets (agency_id, title, status) VALUES ($1, $2, 'open') RETURNING *`,
            [targetAgencyId, title]
        );
        const ticket = ticketResult.rows[0];

        await masterPool.query(
            `INSERT INTO support_messages (ticket_id, sender_id, role, content) VALUES ($1, $2, $3, $4)`,
            [ticket.id, userId, role === 'admin' ? 'admin' : 'agency', message]
        );

        await masterPool.query('COMMIT');
        res.status(201).json(ticket);
    } catch (err: any) {
        await masterPool.query('ROLLBACK');
        console.error('Error creating ticket', err);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

// GET /api/support/tickets/:id
router.get('/tickets/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { role, agencyId: rawAgencyId, id: userId } = req.user!;
        const agencyId = rawAgencyId === 'null' ? null : rawAgencyId;

        const ticketResult = await masterPool.query(
            `SELECT t.*, a.subdomain as agency_name FROM support_tickets t LEFT JOIN agencies a ON t.agency_id = a.id WHERE t.id = $1`, [id]
        );
        const ticket = ticketResult.rows[0];
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        if (role !== 'admin' && ticket.agency_id !== agencyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Mark unread messages as read
        const targetRole = role === 'admin' ? 'admin' : 'agency';
        await masterPool.query(
            `UPDATE support_messages SET is_read = true WHERE ticket_id = $1 AND role != $2 AND is_read = false`,
            [id, targetRole]
        );

        const msgsResult = await masterPool.query(
            `SELECT m.*,
                    CASE 
                        WHEN m.role = 'admin' THEN 'Support Trajetour'
                        ELSE COALESCE(a.subdomain, 'Agence')
                    END as sender_name
             FROM support_messages m
             LEFT JOIN support_tickets t2 ON m.ticket_id = t2.id
             LEFT JOIN agencies a ON t2.agency_id = a.id
             WHERE m.ticket_id = $1 ORDER BY m.created_at ASC`, [id]
        );

        res.json({ ticket, messages: msgsResult.rows });
    } catch (err: any) {
        console.error('Error fetching ticket messages', err);
        res.status(500).json({ error: 'Failed to fetch ticket details' });
    }
});

// POST /api/support/tickets/:id/messages
router.post('/tickets/:id/messages', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const { role, agencyId: rawAgencyId, id: userId } = req.user!;
        const agencyId = rawAgencyId === 'null' ? null : rawAgencyId;

        const ticketResult = await masterPool.query(`SELECT * FROM support_tickets WHERE id = $1`, [id]);
        const ticket = ticketResult.rows[0];
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        if (role !== 'admin' && ticket.agency_id !== agencyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const msgResult = await masterPool.query(
            `INSERT INTO support_messages (ticket_id, sender_id, role, content) VALUES ($1, $2, $3, $4) RETURNING *`,
            [id, userId, role === 'admin' ? 'admin' : 'agency', content]
        );
        
        await masterPool.query(`UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);

        // Add sender info to payload
        const msg = msgResult.rows[0];
        msg.sender_name = req.user?.email;

        res.status(201).json(msg);
    } catch (err: any) {
        console.error('Error adding message', err);
        res.status(500).json({ error: 'Failed to add message' });
    }
});

// PATCH /api/support/tickets/:id/status
router.patch('/tickets/:id/status', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // e.g., 'closed', 'resolved', 'open'
        const { role, agencyId: rawAgencyId } = req.user!;
        const agencyId = rawAgencyId === 'null' ? null : rawAgencyId;

        const ticketResult = await masterPool.query(`SELECT * FROM support_tickets WHERE id = $1`, [id]);
        const ticket = ticketResult.rows[0];
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        if (role !== 'admin' && ticket.agency_id !== agencyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await masterPool.query(
            `UPDATE support_tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [status, id]
        );

        res.json({ success: true });
    } catch (err: any) {
        console.error('Error updating status', err);
        res.status(500).json({ error: 'Failed to update ticket status' });
    }
});

// GET /api/support/unread-count
router.get('/unread-count', async (req: AuthRequest, res) => {
    try {
        const { role, agencyId: rawAgencyId } = req.user!;
        const agencyId = rawAgencyId === 'null' ? null : rawAgencyId;
        const targetRole = role === 'admin' ? 'admin' : 'agency';
        
        let query = `
            SELECT COUNT(*)
            FROM support_messages m
            JOIN support_tickets t ON m.ticket_id = t.id
            WHERE m.is_read = false AND m.role != $1
        `;
        let params: any[] = [targetRole];

        if (role !== 'admin') {
            if (!agencyId) return res.json({ count: 0 });
            query += ` AND t.agency_id = $2`;
            params.push(agencyId);
        }

        const result = await masterPool.query(query, params);
        res.json({ count: parseInt(result.rows[0].count, 10) });
    } catch (err: any) {
        console.error('Error fetching unread count', err);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

export default router;
