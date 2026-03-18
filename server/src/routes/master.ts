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

            // 2. Log this action (Optional: implement platform-level audit logs)
            console.log(`🚀 New agency registered: ${name} (${subdomain})`);

            await client.query('COMMIT');
            res.status(201).json({
                message: 'Agency registered successfully on the platform',
                agency: newAgency
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
