import express, { Request } from 'express';
import { masterPool } from '../config/tenantPool.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, multiTenantAgencySchema } from '../middleware/validation.js';
import { upload, uploadToCloudinary } from '../utils/fileUpload.js';

const router = express.Router();

// ─── Background DB Provisioning ─────────────────────────────────────────────
// Provisions the Neon branch and creates the admin user for a given agency.
// Called after the main request has already responded (fire-and-forget).
async function provisionAgencyDatabase(
    agencyId: string,
    subdomain: string,
    ownerEmail: string,
    password: string,
    contactName: string
) {
    const NEON_API_KEY = process.env.NEON_API_KEY;
    const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;

    if (!NEON_API_KEY || !NEON_PROJECT_ID) {
        console.error('❌ Background provisioning: Neon env vars missing.');
        return;
    }

    console.log(`☁️ [BG] Auto-provisioning Neon branch for: ${subdomain}`);
    const axios = (await import('axios')).default;

    try {
        // 1. Create branch
        const createBranchRes = await axios.post(
            `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`,
            { branch: { name: `tenant_${subdomain}` }, endpoints: [{ type: 'read_write' }] },
            { headers: { 'Authorization': `Bearer ${NEON_API_KEY}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } }
        );

        const branchId = createBranchRes.data.branch.id;
        const endpointId = createBranchRes.data.endpoints[0].id;
        const endpointHost = createBranchRes.data.endpoints[0].host;
        console.log(`✅ [BG] Branch created: ${branchId}`);

        // 2. Determine correct role based on the master database connection
        const masterDbUrl = new URL(process.env.DATABASE_URL || '');
        const roleName = masterDbUrl.username || 'neondb_owner';

        // 3. Poll endpoint readiness (up to 90s)
        console.log(`⏳ [BG] Polling endpoint readiness for ${subdomain}...`);
        for (let i = 0; i < 30; i++) {
            try {
                const epRes = await axios.get(
                    `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/endpoints`,
                    { headers: { 'Authorization': `Bearer ${NEON_API_KEY}`, 'Accept': 'application/json' } }
                );
                const ep = epRes.data.endpoints?.find((e: any) => e.id === endpointId);
                if (ep && (ep.current_state === 'idle' || ep.current_state === 'active')) {
                    console.log(`✅ [BG] Endpoint ready (${ep.current_state})`);
                    break;
                }
                console.log(`⏳ [BG] Endpoint state: ${ep?.current_state || 'init'} (${i + 1}/30)`);
            } catch (_) {}
            await new Promise(r => setTimeout(r, 3000));
        }

        // 4. Reset password (retry on 423 lock)
        let passRes: any;
        for (let attempt = 0; attempt < 30; attempt++) {
            try {
                passRes = await axios.post(
                    `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branchId}/roles/${roleName}/reset_password`,
                    {},
                    { headers: { 'Authorization': `Bearer ${NEON_API_KEY}`, 'Accept': 'application/json' } }
                );
                break;
            } catch (err: any) {
                if (err.response?.status === 423) {
                    console.log(`⏳ [BG] Branch locked (423), retrying... (${attempt + 1}/30)`);
                    await new Promise(r => setTimeout(r, 3000));
                } else {
                    throw err;
                }
            }
        }

        if (!passRes) throw new Error('Branch remained locked after 30 attempts.');
        const rolePassword = passRes.data.role.password;
        const dbUrl = `postgres://${roleName}:${rolePassword}@${endpointHost}/neondb?sslmode=require`;

        // 5. Update agency record with DB URL and mark provisioned
        await masterPool.query(
            `UPDATE agencies SET db_url = $1, neon_branch_id = $2, db_provisioned_at = NOW() WHERE id = $3`,
            [dbUrl, branchId, agencyId]
        );
        console.log(`✅ [BG] db_url saved for ${subdomain}`);

        // 6. Wait for DB to be reachable, then insert admin user
        const { Pool } = await import('pg');
        const bcrypt = (await import('bcrypt')).default;
        let connected = false;

        for (let attempt = 0; attempt < 30; attempt++) {
            const tp = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
            try {
                await tp.query('SELECT 1');
                await tp.end();
                connected = true;
                console.log(`✅ [BG] Tenant DB reachable for ${subdomain}`);
                break;
            } catch (_) {
                await tp.end().catch(() => {});
                console.log(`⏳ [BG] Waiting for tenant DB... (${attempt + 1}/30)`);
                await new Promise(r => setTimeout(r, 5000));
            }
        }

        if (!connected) {
            console.error(`❌ [BG] Tenant DB not reachable for ${subdomain} after 150s`);
            return;
        }

        const finalPool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
        const hashedPassword = await bcrypt.hash(password || 'Password123!', 10);
        const permissions = JSON.stringify(['manage_users', 'manage_business', 'manage_financials', 'view_reports']);

        await finalPool.query(
            `INSERT INTO users (email, password_hash, username, role, permissions) 
             VALUES ($1, $2, $3, 'admin', $4::jsonb)
             ON CONFLICT (email) DO NOTHING`,
            [ownerEmail, hashedPassword, contactName || 'Admin', permissions]
        );
        await finalPool.end();

        console.log(`🎉 [BG] Agency ${subdomain} fully provisioned! Admin user created.`);
    } catch (err: any) {
        console.error(`❌ [BG] Provisioning failed for ${subdomain}:`, err.message);
    }
}

// ─── POST /register-agency ────────────────────────────────────────────────────
// Public registration. Creates agency in PENDING status, responds immediately,
// provisions Neon DB in background.
router.post('/register-agency',
    upload.single('paymentProof'),
    async (req: Request, res: express.Response, next: express.NextFunction): Promise<void> => {
        try {
            await multiTenantAgencySchema.parseAsync(req.body);
        } catch (error: any) {
            res.status(400).json({ error: 'Validation failed', details: error.errors || error });
            return;
        }
        
        const client = await masterPool.connect();
        try {
            await client.query('BEGIN');
            let { name, subdomain, ownerEmail, password, phone, address, contactName, plan, paymentMethod } = req.body;
            plan = plan || 'Basic';
            paymentMethod = paymentMethod || 'Espèces';
            subdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

            let paymentProofUrl = null;
            if (req.file) {
                const uploadResult = await uploadToCloudinary(req.file.buffer, 'trajetour_receipts');
                if (uploadResult && uploadResult.secure_url) {
                    paymentProofUrl = uploadResult.secure_url;
                }
            }

            // Check subdomain availability
            const existing = await client.query('SELECT id FROM agencies WHERE subdomain = $1', [subdomain]);
            if (existing.rows.length > 0) {
                const err = new Error('This agency name is already taken. Please choose another.');
                (err as any).statusCode = 400;
                throw err;
            }

            // Insert agency with PENDING status — DB provisioning happens in background
            const result = await client.query(
                `INSERT INTO agencies (name, subdomain, db_url, owner_email, plan, type, status, contact_name, phone, address, payment_method, payment_proof_url)
                 VALUES ($1, $2, '', $3, $4, 'Agence', 'PENDING', $5, $6, $7, $8, $9)
                 RETURNING *`,
                [name, subdomain, ownerEmail, plan, contactName, phone, address, paymentMethod, paymentProofUrl]
            );

            const newAgency = result.rows[0];
            await client.query('COMMIT');

            // Respond immediately
            res.status(201).json({
                message: 'Votre demande d\'inscription a été soumise avec succès. Elle est en cours d\'examen par notre équipe. Vous recevrez une confirmation sous 24h.',
                agency: {
                    id: newAgency.id,
                    name: newAgency.name,
                    subdomain: newAgency.subdomain,
                    status: 'PENDING',
                    plan: newAgency.plan
                }
            });

            // Provision database in background (after response sent)
            setImmediate(() => {
                provisionAgencyDatabase(newAgency.id, subdomain, ownerEmail, password, contactName)
                    .catch(err => console.error(`[BG] Uncaught provisioning error:`, err));
            });

        } catch (error: any) {
            await client.query('ROLLBACK');
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Ce sous-domaine est déjà pris.' });
            }
            if (error.statusCode) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            next(error);
        } finally {
            client.release();
        }
    }
);

// ─── GET /agencies ────────────────────────────────────────────────────────────
// List all registered agencies (master admin only)
router.get('/agencies',
    authMiddleware,
    requirePermission('manage_users'),
    async (req, res, next) => {
        try {
            const { status } = req.query;
            let query = 'SELECT id, name, subdomain, owner_email, contact_name, phone, address, plan, status, created_at, db_provisioned_at, payment_proof_url, neon_branch_id FROM agencies ORDER BY created_at DESC';
            const params: any[] = [];

            if (status && status !== 'ALL') {
                query = 'SELECT id, name, subdomain, owner_email, contact_name, phone, address, plan, status, created_at, db_provisioned_at, payment_proof_url, neon_branch_id FROM agencies WHERE status = $1 ORDER BY created_at DESC';
                params.push((status as string).toUpperCase());
            }

            const result = await masterPool.query(query, params);
            res.json(result.rows);
        } catch (error) {
            next(error);
        }
    }
);

// ─── PATCH /agencies/:id/status ───────────────────────────────────────────────
// Approve or reject an agency registration (master admin only)
router.patch('/agencies/:id/status',
    authMiddleware,
    requirePermission('manage_users'),
    async (req: Request, res, next) => {
        try {
            const { id } = req.params;
            const { status, rejection_reason } = req.body;

            if (!['ACTIVE', 'REJECTED', 'SUSPENDED', 'PENDING'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status. Must be ACTIVE, REJECTED, SUSPENDED, or PENDING.' });
            }

            const result = await masterPool.query(
                `UPDATE agencies 
                 SET status = $1, rejection_reason = $2, status_updated_at = NOW(), updated_at = NOW()
                 WHERE id = $3
                 RETURNING id, name, subdomain, status, plan, owner_email`,
                [status, rejection_reason || null, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Agency not found.' });
            }

            const agency = result.rows[0];

            // If approving, ensure the tenant pool cache is cleared so it re-reads the new status
            // (handled automatically by tenantPool's lowercase check)

            console.log(`✅ Agency ${agency.name} (${agency.subdomain}) status updated to ${status}`);

            res.json({
                message: `Agency "${agency.name}" has been ${status === 'ACTIVE' ? 'approved' : status.toLowerCase()}.`,
                agency
            });
        } catch (error) {
            next(error);
        }
    }
);

// ─── GET /agencies/:id ────────────────────────────────────────────────────────
// Get single agency details
router.get('/agencies/:id',
    authMiddleware,
    requirePermission('manage_users'),
    async (req: Request, res, next) => {
        try {
            const result = await masterPool.query(
                `SELECT id, name, subdomain, owner_email, contact_name, phone, address, plan, status, 
                        created_at, db_provisioned_at, status_updated_at, rejection_reason
                 FROM agencies WHERE id = $1`,
                [req.params.id]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Agency not found.' });
            res.json(result.rows[0]);
        } catch (error) {
            next(error);
        }
    }
);

// ─── GET /my-subscription ────────────────────────────────────────────────────
// Agency self-service: get own subscription info (no master permission needed)
router.get('/my-subscription',
    authMiddleware,
    async (req: Request, res, next) => {
        try {
            const authReq = req as AuthRequest;
            const tenantId = authReq.user?.tenantId;

            if (!tenantId) {
                return res.status(400).json({ error: 'No tenant context found.' });
            }

            const result = await masterPool.query(
                `SELECT id, name, subdomain, plan, status, owner_email,
                        created_at, db_provisioned_at, status_updated_at, rejection_reason, payment_proof_url
                 FROM agencies WHERE subdomain = $1`,
                [tenantId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Subscription not found.' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            next(error);
        }
    }
);

// ─── POST /my-subscription/payment-proof ─────────────────────────────────────
// Agency self-service: upload bank transfer proof
router.post('/my-subscription/payment-proof',
    authMiddleware,
    upload.single('proof'),
    async (req: Request, res, next) => {
        try {
            const authReq = req as AuthRequest;
            const tenantId = authReq.user?.tenantId;

            if (!tenantId) {
                return res.status(400).json({ error: 'No tenant context found.' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded.' });
            }

            // Upload the file to Cloudinary
            const uploadResult = await uploadToCloudinary(req.file.buffer, 'payment_proofs');
            const fileUrl = uploadResult.secure_url;

            await masterPool.query(
                `UPDATE agencies SET payment_proof_url = $1 WHERE subdomain = $2`,
                [fileUrl, tenantId]
            );

            res.json({ success: true, payment_proof_url: fileUrl });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
