import express, { Request } from 'express';
import { masterPool } from '../config/tenantPool.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, multiTenantAgencySchema } from '../middleware/validation.js';

const router = express.Router();

// Register a new agency on the platform (Public Onboarding)
// Creates a new Neon database automatically
router.post('/register-agency',
    validate(multiTenantAgencySchema),
    async (req: Request, res, next) => {
        const client = await masterPool.connect();
        try {
            await client.query('BEGIN');
            let { name, subdomain, dbUrl, ownerEmail, password, phone, address, contactName, plan } = req.body;
        
        // Default plan to Basic if not provided
        plan = plan || 'Basic';

            // --- NEON API INTEGRATION ---
            // If dbUrl is not provided, we automatically provision a new database branch on Neon
            if (!dbUrl) {
                const NEON_API_KEY = process.env.NEON_API_KEY;
                const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;

                if (!NEON_API_KEY || !NEON_PROJECT_ID) {
                    throw new Error("Neon API credentials are not configured. Cannot auto-provision database.");
                }

                console.log(`☁️ Auto-provisioning Neon Database Branch for: ${subdomain}`);
                
                const axios = (await import('axios')).default;
                
                let createBranchRes;
                try {
                    createBranchRes = await axios.post(
                        `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`,
                        {
                            branch: {
                                name: `tenant_${subdomain}`,
                            },
                            endpoints: [
                                { type: "read_write" }
                            ]
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${NEON_API_KEY}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        }
                    );
                } catch (neonErr: any) {
                    if (neonErr.response?.status === 409 && neonErr.response?.data?.message?.includes('already exists')) {
                        const err = new Error('This subdomain is already taken. Please choose another one.');
                        (err as any).statusCode = 400;
                        throw err;
                    }
                    console.error("Neon API Branch Creation Error:", neonErr.response?.data || neonErr.message);
                    const errMsg = neonErr.response?.data ? JSON.stringify(neonErr.response.data) : neonErr.message;
                    const err = new Error(`Failed to provision database: ${errMsg}`);
                    (err as any).statusCode = 500;
                    throw err;
                }

                const branchId = createBranchRes.data.branch.id;
                const endpointId = createBranchRes.data.endpoints[0].id;
                const endpointHost = createBranchRes.data.endpoints[0].host;
                
                console.log(`✅ Branch created: ${branchId}, Endpoint: ${endpointHost}`);

                // 2. We need the role/password to construct the URL
                let rolesRes;
                try {
                    rolesRes = await axios.get(
                        `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branchId}/roles`,
                        {
                            headers: {
                                'Authorization': `Bearer ${NEON_API_KEY}`,
                                'Accept': 'application/json'
                            }
                        }
                    );
                } catch (e: any) {
                    console.error("Neon API Roles Fetch Error:", e.response?.data || e.message);
                    const errMsg = e.response?.data ? JSON.stringify(e.response.data) : e.message;
                    const err = new Error(`Failed to fetch database role: ${errMsg}`);
                    (err as any).statusCode = 500;
                    throw err;
                }
                
                const roleName = rolesRes.data.roles[0].name;

                // 3. Poll for branch endpoint readiness before resetting password
                console.log(`⏳ Waiting for Neon branch endpoint to become ready...`);
                let endpointReady = false;
                for (let i = 0; i < 30; i++) {
                    try {
                        const epRes = await axios.get(
                            `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/endpoints`,
                            { headers: { 'Authorization': `Bearer ${NEON_API_KEY}`, 'Accept': 'application/json' } }
                        );
                        const ep = epRes.data.endpoints?.find((e: any) => e.id === endpointId);
                        if (ep && ep.current_state === 'idle') {
                            console.log(`✅ Branch endpoint is ready (state: ${ep.current_state})`);
                            endpointReady = true;
                            break;
                        }
                        console.log(`⏳ Endpoint state: ${ep?.current_state || 'unknown'}. Waiting... (${i+1}/30)`);
                    } catch (e) { /* ignore polling errors */ }
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }

                // 4. Reset password to get credentials (retry up to 30 times, 3s each = 90s max)
                let passRes;
                let attempts = 0;
                while (attempts < 30) {
                    try {
                        passRes = await axios.post(
                            `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branchId}/roles/${roleName}/reset_password`,
                            {},
                            {
                                headers: {
                                    'Authorization': `Bearer ${NEON_API_KEY}`,
                                    'Accept': 'application/json'
                                }
                            }
                        );
                        break; // Success!
                    } catch (err: any) {
                        if (err.response?.status === 423) {
                            attempts++;
                            console.log(`⏳ Branch is locked (423). Retrying in 3 seconds... (Attempt ${attempts}/30)`);
                            await new Promise(resolve => setTimeout(resolve, 3000));
                        } else {
                            console.error("Neon API Reset Password Error:", err.response?.data || err.message);
                            const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                            const newErr = new Error(`Failed to reset database password: ${errMsg}`);
                            (newErr as any).statusCode = 500;
                            throw newErr;
                        }
                    }
                }
                
                if (!passRes) {
                    const err = new Error("Failed to reset role password after multiple attempts. Branch remains locked.");
                    (err as any).statusCode = 500;
                    throw err;
                }

                const rolePassword = passRes.data.role.password;

                // 4. Construct the standard Neon postgres connection string
                // format: postgres://[user]:[password]@[host]/[dbname]?sslmode=require
                const dbName = 'neondb'; // Default neon DB name on new branches
                dbUrl = `postgres://${roleName}:${rolePassword}@${endpointHost}/${dbName}?sslmode=require`;
                
                // 4.5. Grant CREATE permissions on the public schema to the new role using the master DB owner credentials
                // Because Neon copies roles, the new branch still has the master's db owner with its original password
                if (process.env.DATABASE_URL) {
                    try {
                        console.log(`🔑 Granting schema permission to ${roleName}...`);
                        const masterDbUrl = new URL(process.env.DATABASE_URL);
                        masterDbUrl.hostname = endpointHost;
                        
                        const { Pool } = await import('pg');
                        const adminPool = new Pool({
                            connectionString: masterDbUrl.toString(),
                            ssl: { rejectUnauthorized: false }
                        });
                        await adminPool.query(`GRANT ALL ON SCHEMA public TO "${roleName}"`);
                        await adminPool.end();
                        console.log(`✅ Granted schema permission to ${roleName}`);
                    } catch (grantErr: any) {
                        console.error('⚠️ Could not grant schema permission (might already have it):', grantErr.message);
                    }
                }

                console.log(`✅ Auto-provisioning successful. Secured DB URL for ${subdomain}.`);
            }

            // --- END NEON API INTEGRATION ---

            const result = await client.query(
                `INSERT INTO agencies (name, subdomain, db_url, owner_email, plan, type)
                 VALUES ($1, $2, $3, $4, $5, 'Agence')
                 RETURNING *`,
                [name, subdomain.toLowerCase(), dbUrl, ownerEmail, plan]
            );

            const newAgency = result.rows[0];

            console.log(`🚀 New agency registered: ${name} (${subdomain}). Will provision tenant admin in background...`);

            // Commit the master DB transaction and respond immediately
            await client.query('COMMIT');
            res.status(201).json({
                message: 'Agency registered successfully! Your dashboard is being set up and will be ready in about 1-2 minutes.',
                agency: newAgency,
                loginEmail: ownerEmail,
                loginPassword: password || 'Password123!'
            });

            // 2. Provision tenant admin user in the background (fire-and-forget)
            // This runs AFTER the response is sent — no HTTP timeout concern
            setImmediate(async () => {
                console.log(`🔧 Background: provisioning admin user for ${subdomain}...`);
                try {
                    const { Pool } = await import('pg');
                    const bcrypt = (await import('bcrypt')).default;

                    // Wait for the Neon branch endpoint to be reachable
                    // The branch was already created above; we just need it to be ready
                    let connected = false;
                    for (let attempt = 0; attempt < 30; attempt++) {
                        const tenantPool = new Pool({
                            connectionString: dbUrl,
                            ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
                            connectionTimeoutMillis: 5000,
                        });
                        try {
                            await tenantPool.query('SELECT 1');
                            await tenantPool.end();
                            connected = true;
                            console.log(`✅ Background: tenant DB connected for ${subdomain}`);
                            break;
                        } catch (connErr: any) {
                            await tenantPool.end().catch(() => {});
                            console.log(`⏳ Background: waiting for tenant DB (attempt ${attempt + 1}/30)...`);
                            await new Promise(resolve => setTimeout(resolve, 5000));
                        }
                    }

                    if (!connected) {
                        console.error(`❌ Background: could not connect to tenant DB for ${subdomain} after waiting`);
                        return;
                    }

                    const finalPool = new Pool({
                        connectionString: dbUrl,
                        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
                    });

                    const defaultPassword = password || 'Password123!';
                    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
                    const permissions = JSON.stringify(['manage_users', 'manage_business', 'manage_financials', 'view_reports']);

                    await finalPool.query(
                        `INSERT INTO users (email, password_hash, username, role, permissions) 
                         VALUES ($1, $2, $3, $4, $5::jsonb)
                         ON CONFLICT (email) DO NOTHING`,
                        [ownerEmail, hashedPassword, contactName || 'Admin', 'admin', permissions]
                    );
                    await finalPool.end();
                    console.log(`🎉 Background: admin user created for ${subdomain}! Agency fully onboarded.`);
                } catch (bgErr: any) {
                    console.error(`❌ Background provisioning failed for ${subdomain}:`, bgErr.message);
                }
            });
        } catch (error: any) {
            await client.query('ROLLBACK');
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({ error: 'Subdomain already exists' });
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

// List all registered agencies on the platform
router.get('/agencies',
    authMiddleware,
    requirePermission('manage_users'),
    async (req, res, next) => {
        try {
            const result = await masterPool.query('SELECT * FROM agencies ORDER BY created_at DESC');
            res.json(result.rows);
        } catch (error) {
            next(error);
        }
    }
);

export default router;
