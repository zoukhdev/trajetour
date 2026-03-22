import express from 'express';
import { defaultPool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../services/auditLog.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const debugLog = (msg: string) => {
    try {
        const logPath = 'd:\\WRtour\\subscriptions_debug.log';
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {
        // ignore
    }
};


// Agency requests Upgrade (requires manage_business or admin framing layout)
router.post('/upgrade',
    authMiddleware,
    requirePermission('manage_business'),
    async (req: AuthRequest, res, next) => {
        debugLog('🔍 /upgrade endpoint hit');
        const client = await defaultPool.connect();
        try {
            await client.query('BEGIN');
            const { requestedPlan, notes } = req.body;
            const agencyId = req.user!.agencyId || (req as any).tenantAgencyId;

            debugLog(`   Agency ID: ${agencyId}`);
            if (!agencyId) {
                debugLog('   ❌ Agency context required 401');
                return res.status(401).json({ error: 'Agency Context required' });
            }

            const currentRes = await client.query('SELECT subscription FROM agencies WHERE id = $1', [agencyId]);
            const currentPlan = currentRes.rows[0]?.subscription || 'Standard';
            debugLog(`   Current Plan: ${currentPlan}, Requested: ${requestedPlan}`);


            const result = await client.query(
                `INSERT INTO agency_approvals (agency_id, type, current_value, requested_value, status, notes)
                 VALUES ($1, 'UPGRADE_PLAN', $2, $3, 'PENDING', $4)
                 RETURNING *`,
                [agencyId, currentPlan, requestedPlan, notes]
            );
            debugLog(`   ✅ Inserted Request ID: ${result.rows[0]?.id}`);

            await logAudit(client, {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'approval_request',
                entityId: result.rows[0].id,
                changes: result.rows[0],
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            debugLog('   ✅ Transaction Committed');
            res.status(201).json({ message: 'Upgrade request submitted successfully!', data: result.rows[0] });
        } catch (error: any) {
            await client.query('ROLLBACK');
            debugLog(`   ❌ Error during /upgrade: ${error.message} - ${error.stack}`);
            next(error);
        } finally {
            client.release();
        }

    }
);

// Master Dashboard: View requests
router.get('/requests',
    authMiddleware,
    async (req: AuthRequest, res, next) => {
        try {
            debugLog('🔍 /requests endpoint hit');
            if (req.user!.agencyId) {
                debugLog('   ❌ Unauthorized: Master Dashboard only');
                return res.status(403).json({ error: 'Unauthorized: Master Dashboard only' });
            }

            const result = await defaultPool.query(`
                SELECT aa.*, a.name as agency_name 
                FROM agency_approvals aa
                JOIN agencies a ON aa.agency_id = a.id
                ORDER BY aa.created_at DESC
            `);
            debugLog(`   ✅ Requests found: ${result.rows.length}`);
            res.json(result.rows);

        } catch (error) {
            next(error);
        }
    }
);

// Master Dashboard: Approve / Reject Custom Approval requests
router.put('/requests/:id',
    authMiddleware,
    async (req: AuthRequest, res, next) => {
        const client = await defaultPool.connect();
        try {
            if (req.user!.agencyId) return res.status(403).json({ error: 'Unauthorized: Master Dashboard only' });

            await client.query('BEGIN');
            const { status, notes } = req.body; // 'APPROVED' or 'REJECTED'

            const approvalRes = await client.query('SELECT * FROM agency_approvals WHERE id = $1', [req.params.id]);
            if (approvalRes.rows.length === 0) return res.status(404).json({ error: 'Request not found' });

            const approval = approvalRes.rows[0];

            if (status === 'APPROVED' && approval.type === 'UPGRADE_PLAN') {
                // Perform the Actual Plan Upgrade
                await client.query('UPDATE agencies SET subscription = $1 WHERE id = $2', [approval.requested_value, approval.agency_id]);
            }

            const result = await client.query(
                `UPDATE agency_approvals SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
                [status, notes || approval.notes, req.params.id]
            );

            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'approval_request',
                entityId: req.params.id,
                changes: { status, notes },
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json({ message: `Request successfully ${status.toLowerCase()}!`, data: result.rows[0] });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
