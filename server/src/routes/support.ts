import express from 'express';
import { masterPool } from '../config/tenantPool.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware as express.RequestHandler);

// Helper: is this user an agency user (not the platform admin)?
// We use agencyId presence — not role — because agency owners can have role='admin' in their tenant DB
const isAgencyUser = (agencyId: string | null | undefined) => !!agencyId;

// GET /api/support/tickets
router.get('/tickets', async (req: AuthRequest, res) => {
    try {
        const { agencyId: rawAgencyId } = req.user!;
        const agencyId = rawAgencyId === 'null' ? null : rawAgencyId;
        const viewerIsAgency = isAgencyUser(agencyId);

        // Count unread messages per ticket (messages sent by the OTHER side, not yet read)
        // agency view: unread = messages where is_master_staff = true (from admin) and is_read = false
        // admin view:  unread = messages where is_master_staff = false (from agency) and is_read = false
        let query = `
            SELECT t.*, t.subject AS title, a.subdomain as agency_name,
                   (SELECT COUNT(*) FROM support_messages m 
                    WHERE m.ticket_id = t.id AND m.is_read = false 
                    AND m.is_master_staff = $1) as unread_count
            FROM support_tickets t
            LEFT JOIN agencies a ON t.agency_id = a.id
        `;
        // if viewerIsAgency: count messages FROM admin (is_master_staff=true) that are unread
        // if platform admin: count messages FROM agency (is_master_staff=false) that are unread
        let params: any[] = [viewerIsAgency ? true : false];

        if (viewerIsAgency) {
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
        // DB column is 'subject', not 'title'
        const { title, subject, message, content } = req.body;
        const ticketSubject = subject || title;
        const msgContent = content || message;

        const { agencyId: rawAgencyId, id: userId } = req.user!;
        const agencyId = rawAgencyId === 'null' ? null : rawAgencyId;
        const viewerIsAgency = isAgencyUser(agencyId);

        if (!ticketSubject) return res.status(400).json({ error: 'Subject (title) is required' });
        if (!msgContent) return res.status(400).json({ error: 'Message is required' });

        // Agency user → use their own agencyId
        // Platform admin → must provide agencyId in body
        let targetAgencyId: string | null = null;
        if (viewerIsAgency) {
            targetAgencyId = agencyId!;
        } else {
            targetAgencyId = req.body.agencyId || null;
            if (!targetAgencyId) {
                return res.status(400).json({ error: 'Agency ID requis pour admin' });
            }
        }

        const client = await masterPool.connect();
        try {
            await client.query('BEGIN');

            const ticketResult = await client.query(
                `INSERT INTO support_tickets (agency_id, subject, status) VALUES ($1, $2, 'open') RETURNING *`,
                [targetAgencyId, ticketSubject]
            );
            const ticket = ticketResult.rows[0];

            // is_master_staff = false for agency messages, true for platform admin messages
            await client.query(
                `INSERT INTO support_messages (ticket_id, sender_id, is_master_staff, message, is_read, role) VALUES ($1, $2, $3, $4, false, $5)`,
                [ticket.id, userId, !viewerIsAgency, msgContent, viewerIsAgency ? 'agency' : 'admin']
            );

            await client.query('COMMIT');
            res.status(201).json(ticket);
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err: any) {
        console.error('Error creating ticket', err);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

// GET /api/support/tickets/:id
router.get('/tickets/:id', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { agencyId: rawAgencyId } = req.user!;
        const agencyId = rawAgencyId === 'null' ? null : rawAgencyId;
        const viewerIsAgency = isAgencyUser(agencyId);

        const ticketResult = await masterPool.query(
            `SELECT t.*, a.subdomain as agency_name FROM support_tickets t LEFT JOIN agencies a ON t.agency_id = a.id WHERE t.id = $1`, [id]
        );
        const ticket = ticketResult.rows[0];
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        if (viewerIsAgency && ticket.agency_id !== agencyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Mark messages from the OTHER side as read
        // Agency viewing: mark admin messages (is_master_staff=true) as read
        // Admin viewing:  mark agency messages (is_master_staff=false) as read
        await masterPool.query(
            `UPDATE support_messages SET is_read = true WHERE ticket_id = $1 AND is_master_staff = $2 AND is_read = false`,
            [id, viewerIsAgency ? true : false]
        );

        const msgsResult = await masterPool.query(
            `SELECT m.*, m.message AS content,
                    CASE 
                        WHEN m.is_master_staff = true THEN 'Support Trajetour'
                        ELSE COALESCE(a.subdomain, 'Agence')
                    END as sender_name
             FROM support_messages m
             LEFT JOIN support_tickets t2 ON m.ticket_id = t2.id
             LEFT JOIN agencies a ON t2.agency_id = a.id
             WHERE m.ticket_id = $1 ORDER BY m.created_at ASC`, [id]
        );

        res.json({ ticket: { ...ticketResult.rows[0], title: ticketResult.rows[0].subject }, messages: msgsResult.rows });
    } catch (err: any) {
        console.error('Error fetching ticket messages', err);
        res.status(500).json({ error: 'Failed to fetch ticket details' });
    }
});

// POST /api/support/tickets/:id/messages
router.post('/tickets/:id/messages', async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { content, message } = req.body;
        const msgContent = content || message;
        const { agencyId: rawAgencyId, id: userId, email } = req.user!;
        const agencyId = rawAgencyId === 'null' ? null : rawAgencyId;
        const viewerIsAgency = isAgencyUser(agencyId);

        if (!msgContent) return res.status(400).json({ error: 'Message content is required' });

        const ticketResult = await masterPool.query(`SELECT * FROM support_tickets WHERE id = $1`, [id]);
        const ticket = ticketResult.rows[0];
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        if (viewerIsAgency && ticket.agency_id !== agencyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const msgResult = await masterPool.query(
            `INSERT INTO support_messages (ticket_id, sender_id, is_master_staff, message, is_read, role) VALUES ($1, $2, $3, $4, false, $5) RETURNING *`,
            [id, userId, !viewerIsAgency, msgContent, viewerIsAgency ? 'agency' : 'admin']
        );

        await masterPool.query(`UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);

        const msg = msgResult.rows[0];
        msg.sender_name = viewerIsAgency ? (agencyId || 'Agence') : 'Support Trajetour';
        msg.content = msg.message; // alias for frontend compatibility

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
        const { status } = req.body;
        const { agencyId: rawAgencyId } = req.user!;
        const agencyId = rawAgencyId === 'null' ? null : rawAgencyId;
        const viewerIsAgency = isAgencyUser(agencyId);

        const ticketResult = await masterPool.query(`SELECT * FROM support_tickets WHERE id = $1`, [id]);
        const ticket = ticketResult.rows[0];
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        if (viewerIsAgency && ticket.agency_id !== agencyId) {
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
        const { agencyId: rawAgencyId } = req.user!;
        const agencyId = rawAgencyId === 'null' ? null : rawAgencyId;
        const viewerIsAgency = isAgencyUser(agencyId);

        // Agency views: count unread messages FROM admin (is_master_staff = true)
        // Platform admin: count unread messages FROM agencies (is_master_staff = false)
        let query = `
            SELECT COUNT(*)
            FROM support_messages m
            JOIN support_tickets t ON m.ticket_id = t.id
            WHERE m.is_read = false AND m.is_master_staff = $1
        `;
        let params: any[] = [viewerIsAgency ? true : false];

        if (viewerIsAgency) {
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
