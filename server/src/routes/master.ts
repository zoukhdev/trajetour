import express, { Request } from 'express';
import { masterPool } from '../config/tenantPool.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, multiTenantAgencySchema } from '../middleware/validation.js';
import { upload, uploadToCloudinary } from '../utils/fileUpload.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

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
        const dbUrl = `postgres://${roleName}:${encodeURIComponent(rolePassword)}@${endpointHost}/neondb?sslmode=require`;

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

        const FinalUsername = contactName ? `${contactName.replace(/\s+/g, '_')}_${subdomain}` : `admin_${subdomain}`;

        await finalPool.query(
            `INSERT INTO users (email, password_hash, username, role, permissions) 
             VALUES ($1, $2, $3, 'admin', $4::jsonb)
             ON CONFLICT (email) DO UPDATE SET 
                password_hash = EXCLUDED.password_hash,
                role = 'admin',
                permissions = EXCLUDED.permissions`,
            [ownerEmail, hashedPassword, FinalUsername, permissions]
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
        // Clean up subdomain before validation to prevent regex failure on capitalization/spaces
        if (req.body.subdomain) {
            req.body.subdomain = req.body.subdomain.toLowerCase()
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        }

        try {
            await multiTenantAgencySchema.parseAsync(req.body);
        } catch (error: any) {
            console.error('❌ multiTenantAgencySchema Validation Failed:', JSON.stringify(error.errors || error, null, 2));
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
                `INSERT INTO agencies (name, subdomain, db_url, owner_email, plan, subscription, type, status, contact_name, phone, address, payment_method, payment_proof_url)
                 VALUES ($1, $2, '', $3, $4, $4, 'Agence', 'PENDING', $5, $6, $7, $8, $9)
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

            // ─── Fire-and-forget: Send registration confirmation email ───
            if (process.env.RESEND_API_KEY) {
                const loginUrl = `https://${subdomain}.trajetour.com/login`;
                resend.emails.send({
                    from: 'Trajetour <hello@trajetour.com>',
                    to: [ownerEmail],
                    subject: '📋 Votre demande d\'inscription Trajetour est bien reçue',
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                        <body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:40px 20px;">
                                <tr><td align="center">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;">
                                        <tr><td align="center" style="padding-bottom:24px;">
                                            <span style="font-size:28px;font-weight:800;color:#2563EB;">Trajetour</span>
                                        </td></tr>
                                    </table>
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
                                        <tr><td style="padding:40px;">
                                            <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#0F172A;">Demande reçue, ${contactName} ! 📋</h1>
                                            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#475569;">
                                                Merci pour votre demande d'inscription de l'agence <strong>${name}</strong>. Notre équipe va examiner votre dossier sous <strong>24h ouvrables</strong>.
                                            </p>
                                            <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#475569;">
                                                Vous recevrez un email de confirmation dès que votre compte sera activé.
                                            </p>

                                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#EFF6FF;border-radius:10px;border:1px solid #BFDBFE;margin-bottom:24px;">
                                                <tr><td style="padding:20px;">
                                                    <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#1E40AF;">Votre lien de connexion unique</p>
                                                    <a href="${loginUrl}" style="font-size:14px;font-weight:600;color:#2563EB;word-break:break-all;">${loginUrl}</a>
                                                    <p style="margin:8px 0 0 0;font-size:12px;color:#3B82F6;">📌 Sauvegardez ce lien dans vos favoris</p>
                                                </td></tr>
                                            </table>

                                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FFFBEB;border-radius:10px;border:1px solid #FDE68A;margin-bottom:24px;">
                                                <tr><td style="padding:20px;">
                                                    <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#92400E;">📤 Preuve de paiement manquante ?</p>
                                                    <p style="margin:0;font-size:13px;color:#92400E;line-height:1.5;">
                                                        Si votre reçu de paiement n'a pas été joint lors de l'inscription, connectez-vous via le lien ci-dessus et téléchargez-le depuis votre tableau de bord. Cela facilitera la validation de votre dossier.
                                                    </p>
                                                </td></tr>
                                            </table>

                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr><td align="center">
                                                    <a href="${loginUrl}" style="display:inline-block;background-color:#2563EB;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                                                        Accéder à mon espace
                                                    </a>
                                                </td></tr>
                                            </table>
                                        </td></tr>
                                    </table>
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;">
                                        <tr><td align="center" style="padding-top:24px;">
                                            <p style="margin:0;font-size:13px;color:#94A3B8;">© ${new Date().getFullYear()} Trajetour. Tous droits réservés.</p>
                                        </td></tr>
                                    </table>
                                </td></tr>
                            </table>
                        </body></html>
                    `
                }).then(r => console.log(`✉️ Registration email sent to ${ownerEmail} (ID: ${r.data?.id})`)
                ).catch(err => console.error(`❌ Registration email error:`, err));
            }

        } catch (error: any) {
            await client.query('ROLLBACK');
            if (error.code === '23505') {
                if (error.detail && error.detail.includes('owner_email')) {
                    res.status(400).json({ error: 'Cette adresse e-mail est déjà utilisée.' });
                } else {
                    res.status(400).json({ error: 'Ce sous-domaine est déjà pris.' });
                }
                return;
            }
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
                return;
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

            // ─── Fire-and-forget: Send Email using Resend if APPROVED ───
            if (status === 'ACTIVE' && process.env.RESEND_API_KEY) {
                const loginUrl = `https://${agency.subdomain}.trajetour.com/login`;
                
                resend.emails.send({
                    from: 'Trajetour <hello@trajetour.com>', 
                    to: [agency.owner_email],
                    subject: '🎉 Votre agence Trajetour est activée !',
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        </head>
                        <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 20px;">
                                <tr>
                                    <td align="center">
                                        <!-- Logo / Header -->
                                        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
                                            <tr>
                                                <td align="center" style="padding-bottom: 24px;">
                                                    <span style="font-size: 28px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px;">Trajetour</span>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Main Card -->
                                        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #E2E8F0;">
                                            <tr>
                                                <td style="padding: 40px;">
                                                    <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #0F172A; line-height: 1.3;">Bienvenue sur Trajetour, ${agency.name} ! 🎉</h1>
                                                    
                                                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #475569;">
                                                        Nous avons l'immense plaisir de vous annoncer que votre agence a été <strong>approuvée et activée avec succès</strong>. Notre équipe a bien validé votre demande et votre base de données privée et sécurisée est maintenant prête.
                                                    </p>
                                                    
                                                    <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #475569;">
                                                        Vous pouvez dès à présent accéder à votre dashboard pour commencer à gérer vos réservations, vos clients, et propulser la croissance de votre agence.
                                                    </p>

                                                    <!-- CTA Button -->
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td align="center">
                                                                <a href="${loginUrl}" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                                                                    Accéder à votre Dashboard
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <!-- Subdomain Info Box -->
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 40px; background-color: #F1F5F9; border-radius: 8px;">
                                                        <tr>
                                                            <td style="padding: 20px; text-align: center;">
                                                                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B;">
                                                                    Votre lien de connexion unique
                                                                </p>
                                                                <a href="${loginUrl}" style="margin: 0; font-size: 15px; font-weight: 500; color: #2563EB; text-decoration: none; word-break: break-all;">
                                                                    ${loginUrl}
                                                                </a>
                                                                <p style="margin: 8px 0 0 0; font-size: 13px; color: #94A3B8;">
                                                                    (Sauvegardez ce lien dans vos favoris)
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Footer -->
                                        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
                                            <tr>
                                                <td align="center" style="padding-top: 32px;">
                                                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748B;">
                                                        Une question ? N'hésitez pas à répondre directement à cet email.
                                                    </p>
                                                    <p style="margin: 0; font-size: 14px; color: #94A3B8;">
                                                        &copy; ${new Date().getFullYear()} Trajetour. Tous droits réservés.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>
                    `
                }).then(res => {
                    console.log(`✉️ Email d'activation envoyé à ${agency.owner_email} (ID: ${res.data?.id})`);
                }).catch(err => {
                    console.error(`❌ Erreur lors de l'envoi de l'email Resend :`, err);
                });
            }

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

// ─── DELETE /agencies/:id ───────────────────────────────────────────────────
// Delete an agency from the master database
router.delete('/agencies/:id',
    authMiddleware,
    requirePermission('manage_users'),
    async (req: Request, res, next) => {
        try {
            const { id } = req.params;
            const result = await masterPool.query(
                `DELETE FROM agencies WHERE id = $1 RETURNING id`,
                [id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Agency not found.' });
            }

            // Note: Does not automatically drop the associated Neon DB branch to prevent 
            // accidental permanent data loss. Only removes it from the master platform.
            
            res.json({ success: true, message: 'Agency deleted successfully.' });
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

// ─── POST /agencies/:id/send-proof-reminder ──────────────────────────────────
// Master only: send an email to an agency asking them to re-upload their proof
router.post('/agencies/:id/send-proof-reminder',
    authMiddleware,
    requirePermission('manage_users'),
    async (req: Request, res, next) => {
        try {
            const { id } = req.params;
            const result = await masterPool.query(
                `SELECT id, name, subdomain, owner_email, contact_name, payment_proof_url FROM agencies WHERE id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Agency not found.' });
            }

            const agency = result.rows[0];

            if (agency.payment_proof_url) {
                return res.status(400).json({ error: 'Cette agence a déjà soumis une preuve de paiement.' });
            }

            if (!process.env.RESEND_API_KEY) {
                return res.status(503).json({ error: 'Email service not configured.' });
            }

            const loginUrl = `https://${agency.subdomain}.trajetour.com/login`;

            await resend.emails.send({
                from: 'Trajetour <hello@trajetour.com>',
                to: [agency.owner_email],
                subject: '⚠️ Action requise : Preuve de paiement manquante',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                    <body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:40px 20px;">
                            <tr><td align="center">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;">
                                    <tr><td align="center" style="padding-bottom:24px;">
                                        <span style="font-size:28px;font-weight:800;color:#2563EB;">Trajetour</span>
                                    </td></tr>
                                </table>
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
                                    <tr><td style="padding:40px;">
                                        <div style="width:60px;height:60px;background-color:#FEF3C7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto;text-align:center;line-height:60px;font-size:28px;">⚠️</div>
                                        <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#0F172A;text-align:center;">Action requise, ${agency.contact_name} !</h1>
                                        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#475569;">
                                            Nous avons bien reçu votre demande d'inscription pour l'agence <strong>${agency.name}</strong>. Cependant, nous n'avons pas trouvé de preuve de paiement associée à votre dossier.
                                        </p>
                                        <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#475569;">
                                            Pour que notre équipe puisse valider et activer votre compte, veuillez vous connecter et télécharger votre reçu de paiement (virement bancaire, capture BaridiMob, etc.).
                                        </p>
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#EFF6FF;border-radius:10px;border:1px solid #BFDBFE;margin-bottom:24px;">
                                            <tr><td style="padding:20px;">
                                                <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;text-transform:uppercase;color:#1E40AF;">Votre lien de connexion</p>
                                                <a href="${loginUrl}" style="font-size:14px;font-weight:600;color:#2563EB;word-break:break-all;">${loginUrl}</a>
                                            </td></tr>
                                        </table>
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr><td align="center">
                                                <a href="${loginUrl}" style="display:inline-block;background-color:#F59E0B;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
                                                    Télécharger ma preuve de paiement
                                                </a>
                                            </td></tr>
                                        </table>
                                        <p style="margin:24px 0 0 0;font-size:13px;color:#94A3B8;text-align:center;">
                                            Sans preuve de paiement, nous ne pourrons pas activer votre compte. En cas de question, répondez directement à cet email.
                                        </p>
                                    </td></tr>
                                </table>
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;">
                                    <tr><td align="center" style="padding-top:24px;">
                                        <p style="margin:0;font-size:13px;color:#94A3B8;">© ${new Date().getFullYear()} Trajetour. Tous droits réservés.</p>
                                    </td></tr>
                                </table>
                            </td></tr>
                        </table>
                    </body></html>
                `
            });

            console.log(`📧 Proof reminder sent to ${agency.owner_email} for agency ${agency.name}`);
            res.json({ success: true, message: `Email de rappel envoyé à ${agency.owner_email}` });
        } catch (error) {
            next(error);
        }
    }
);

// ─── POST /broadcast ─────────────────────────────────────────────────────────
// Master only: mass broadcast emails to active/all agencies
router.post('/broadcast',
    authMiddleware,
    requirePermission('manage_users'),
    async (req: Request, res, next) => {
        try {
            const { subject, message, target } = req.body; // target: 'ALL', 'ACTIVE', 'PENDING'

            let query = 'SELECT email as owner_email, name as company_name, contact_name FROM agencies'; 
            // Wait, looking at getAgencies, columns are owner_email, name, contact_name
            const params: any[] = [];
            
            if (target && target !== 'ALL') {
                query += ' WHERE status = $1';
                params.push(target);
            }
            
            const result = await masterPool.query(query, params);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'No agencies found matching criteria.' });
            }

            if (!process.env.RESEND_API_KEY) {
                return res.status(503).json({ error: 'Email service not configured.' });
            }

            // Using Bcc to send mass email
            const bccList = result.rows.map((r: any) => r.owner_email).filter(Boolean);
            
            if (bccList.length === 0) {
                return res.status(404).json({ error: 'No valid email addresses found.' });
            }

            // Chunk BCC list if > 50 (Resend limits)
            const CHUNK_SIZE = 49;
            for (let i = 0; i < bccList.length; i += CHUNK_SIZE) {
                const chunk = bccList.slice(i, i + CHUNK_SIZE);
                
                await resend.emails.send({
                    from: 'Trajetour <hello@trajetour.com>',
                    to: ['hello@trajetour.com'], // Primary recipient
                    bcc: chunk,
                    replyTo: 'hello@trajetour.com',
                    subject: subject,
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                        <body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:40px 20px;">
                                <tr><td align="center">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
                                        <tr><td style="padding:40px;">
                                            <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#0F172A;text-align:left;">Communication Officielle Trajetour</h1>
                                            
                                            <div style="font-size:16px;line-height:1.6;color:#475569;margin-bottom:24px;white-space:pre-wrap;">${message}</div>
                                            
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr><td align="left">
                                                    <p style="margin:0;font-size:15px;color:#0F172A;font-weight:600;">L'équipe Trajetour</p>
                                                    <a href="https://trajetour.com" style="margin:0;font-size:14px;color:#2563EB;">trajetour.com</a>
                                                </td></tr>
                                            </table>
                                        </td></tr>
                                    </table>
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;">
                                        <tr><td align="center" style="padding-top:24px;">
                                            <p style="margin:0;font-size:13px;color:#94A3B8;">Ce message a été envoyé à tous les partenaires Trajetour.</p>
                                        </td></tr>
                                    </table>
                                </td></tr>
                            </table>
                        </body></html>
                    `
                });
            }

            console.log(`📧 Mass broadcast sent to ${bccList.length} agencies`);
            res.json({ success: true, message: `Email diffusé avec succès à ${bccList.length} agences.` });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
