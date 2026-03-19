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
            let { name, subdomain, dbUrl, ownerEmail, password, phone, address, contactName } = req.body;

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
                
                // 1. Create a new branch in the neon project
                let createBranchRes;
                try {
                    createBranchRes = await axios.post(
                        `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`,
                        {
                            branch: {
                                name: `tenant_${subdomain}`,
                                // Optional: you can specify a parent_id here to branch from a specific schema template
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
                    const err = new Error("Failed to provision database. Please try again later.");
                    (err as any).statusCode = 500;
                    throw err;
                }

                const branchId = createBranchRes.data.branch.id;
                const endpointId = createBranchRes.data.endpoints[0].id;
                const endpointHost = createBranchRes.data.endpoints[0].host;
                
                console.log(`✅ Branch created: ${branchId}, Endpoint: ${endpointHost}`);

                // 2. We need the role/password to construct the URL
                const rolesRes = await axios.get(
                    `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branchId}/roles`,
                    {
                        headers: {
                            'Authorization': `Bearer ${NEON_API_KEY}`,
                            'Accept': 'application/json'
                        }
                    }
                );
                
                const roleName = rolesRes.data.roles[0].name;

                // 3. We need to get the role password, handling the 423 Locked state if branch isn't ready.
                let passRes;
                let attempts = 0;
                while (attempts < 10) {
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
                            console.log(`⏳ Branch is locked (423). Retrying in 2 seconds... (Attempt ${attempts}/10)`);
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        } else {
                            throw err; // Not a 423 error, rethrow
                        }
                    }
                }
                
                if (!passRes) {
                    throw new Error("Failed to reset role password after multiple attempts. Branch remains locked.");
                }

                const rolePassword = passRes.data.role.password;

                // 4. Construct the standard Neon postgres connection string
                // format: postgres://[user]:[password]@[host]/[dbname]?sslmode=require
                const dbName = 'neondb'; // Default neon DB name on new branches
                dbUrl = `postgres://${roleName}:${rolePassword}@${endpointHost}/${dbName}?sslmode=require`;
                
                console.log(`✅ Auto-provisioning successful. Secured DB URL for ${subdomain}.`);
            }
            // --- END NEON API INTEGRATION ---

            // 1. Create the agency in the Master DB
            const result = await client.query(
                `INSERT INTO agencies (name, subdomain, db_url, owner_email)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [name, subdomain.toLowerCase(), dbUrl, ownerEmail]
            );

            const newAgency = result.rows[0];

            console.log(`🚀 New agency registered: ${name} (${subdomain}). Initializing tenant database...`);
            
            // 2. Automated Onboarding: Initialize Tenant Database
            const { Pool } = await import('pg');
            const fs = await import('fs');
            const path = await import('path');
            const bcrypt = (await import('bcrypt')).default;

            const tenantPool = new Pool({
                connectionString: dbUrl,
                ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
            });

            try {
                // Read the base schema
                const schemaPath = path.join(process.cwd(), 'src', 'models', 'schema.sql');
                const schemaSql = fs.readFileSync(schemaPath, 'utf8');
                
                // Execute schema creation
                await tenantPool.query(schemaSql);

                // Run additional auto-migration steps from server.ts to ensure everything is latest
                await tenantPool.query(`
                    ALTER TABLE orders 
                    ADD COLUMN IF NOT EXISTS passengers JSONB DEFAULT '[]'::jsonb,
                    ADD COLUMN IF NOT EXISTS hotels JSONB DEFAULT '[]'::jsonb;
                `);

                // Ensure users table matches the latest constraints and columns
                await tenantPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS code VARCHAR(50);`);
                try {
                    await tenantPool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
                } catch (e) { /* ignore */ }
                await tenantPool.query(`
                    ALTER TABLE users ADD CONSTRAINT users_role_check 
                    CHECK (role IN ('admin', 'staff', 'caisser', 'agent', 'client'));
                `);

                // Ensure offers table matches latest
                await tenantPool.query(`
                    ALTER TABLE offers 
                    ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS inclusions JSONB DEFAULT '{}'::jsonb,
                    ADD COLUMN IF NOT EXISTS room_pricing JSONB DEFAULT '[]'::jsonb;
                `);

                // Create the tenant's admin user
                const defaultPassword = password || 'Password123!';
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);
                const permissions = JSON.stringify(['manage_users', 'manage_business', 'manage_financials', 'view_reports']);
                
                await tenantPool.query(
                    `INSERT INTO users (email, password_hash, username, role, permissions) 
                     VALUES ($1, $2, $3, $4, $5::jsonb)
                     ON CONFLICT (email) DO NOTHING`,
                    [ownerEmail, hashedPassword, contactName || 'Admin', 'admin', permissions]
                );

                console.log(`✅ Tenant database for ${subdomain} initialized successfully.`);
            } catch (initError: any) {
                console.error(`❌ Failed to initialize tenant database for ${subdomain}:`, initError);
                // We should probably rollback the master DB insertion if tenant DB fails
                throw initError; 
            } finally {
                await tenantPool.end();
            }

            // 3. Log this action (Optional: implement platform-level audit logs)
            console.log(`🎉 Agency Onboarding Complete: ${name} (${subdomain})`);

            await client.query('COMMIT');
            res.status(201).json({
                message: 'Agency registered and database initialized successfully',
                agency: newAgency,
                defaultAdminPassword: 'Password123!'
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
