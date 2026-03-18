import express from 'express';
import { masterPool } from '../config/tenantPool.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, multiTenantAgencySchema } from '../middleware/validation.js';

const router = express.Router();

// Register a new agency on the platform (Umbrella level)
router.post('/register-agency',
    authMiddleware,
    requirePermission('manage_users'), // Only platform admins
    validate(multiTenantAgencySchema),
    async (req: AuthRequest, res, next) => {
        const client = await masterPool.connect();
        try {
            await client.query('BEGIN');
            const { name, subdomain, dbUrl, ownerEmail } = req.body;

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
                const defaultPassword = 'Password123!';
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);
                const permissions = JSON.stringify(['manage_users', 'manage_business', 'manage_financials', 'view_reports']);
                
                await tenantPool.query(
                    `INSERT INTO users (email, password_hash, username, role, permissions) 
                     VALUES ($1, $2, $3, $4, $5::jsonb)
                     ON CONFLICT (email) DO NOTHING`,
                    [ownerEmail, hashedPassword, 'Admin', 'admin', permissions]
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
