import express from 'express';
import { pool } from '../config/database.js';
import { config } from '../config/env.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { validate, loginSchema, registerSchema, registerAgencySchema } from '../middleware/validation.js';

const router = express.Router();

// Login
router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            'SELECT id, email, username, password_hash, role, permissions FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await comparePassword(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const clientCheck = await pool.query('SELECT id FROM clients WHERE user_id = $1', [user.id]);
        const clientId = clientCheck.rows[0]?.id;

        const agencyCheck = await pool.query('SELECT id FROM agencies WHERE user_id = $1', [user.id]);
        const agencyId = agencyCheck.rows[0]?.id;

        const { tenantContext } = await import('../middleware/tenant.js');
        const currentTenant = tenantContext.getStore()?.subdomain || 'default';

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions || [],
            clientId,
            agencyId,
            tenantId: currentTenant
        });

        const isProduction = config.nodeEnv === 'production';
        res.cookie('token', token, {
            domain: isProduction ? '.trajetour.com' : undefined,
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? user.permissions : [],
            clientId,
            agencyId
        });
    } catch (error) {
        console.error('❌ Login Error Details:', error);
        next(error);
    }
});

// Register (Client)
router.post('/register', validate(registerSchema), async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { firstName, lastName, email, phone, password } = req.body;

        // 1. Check if user exists
        const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Email already registered' });
        }

        // 2. Create User (use email as username to avoid duplicates)
        const hashedPassword = await hashPassword(password);
        const permissions = JSON.stringify(['view_profile', 'view_bookings']);
        const userResult = await client.query(
            `INSERT INTO users (username, email, password_hash, role, permissions) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, email, username, role`,
            [email, email, hashedPassword, 'client', permissions]
        );
        const newUser = userResult.rows[0];

        // 3. Create Client Profile
        const clientResult = await client.query(
            `INSERT INTO clients (full_name, mobile_number, type, user_id) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id`,
            [`${firstName} ${lastName}`, phone, 'Individual', newUser.id]
        );

        await client.query('COMMIT');

        const { tenantContext } = await import('../middleware/tenant.js');
        const currentTenant = tenantContext.getStore()?.subdomain || 'default';

        // 4. Generate Token
        const token = generateToken({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            permissions: ['view_profile', 'view_bookings'],
            clientId: clientResult.rows[0].id,
            tenantId: currentTenant
        });

        const isProduction = config.nodeEnv === 'production';
        res.cookie('token', token, {
            domain: isProduction ? '.trajetour.com' : undefined,
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            role: newUser.role,
            permissions: ['view_profile', 'view_bookings'],
            clientId: clientResult.rows[0].id // Return client ID if needed immediately
        });



    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Registration Failed:', error);
        next(error);
    } finally {
        client.release();
    }
});

// Register (Agency)
router.post('/register-agency', validate(registerAgencySchema), async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { agencyName, email, phone, password, address, contactName } = req.body;

        // 1. Check if user exists
        const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Email already registered' });
        }

        // 2. Create User (Role: Agent - using email as username for uniqueness)
        const hashedPassword = await hashPassword(password);
        const permissions = JSON.stringify(['view_profile', 'view_bookings', 'manage_business']); // tailored permissions
        const userResult = await client.query(
            `INSERT INTO users (username, email, password_hash, role, permissions) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, email, username, role`,
            [email, email, hashedPassword, 'agent', permissions] // Using email as username to avoid duplicates
        );
        const newUser = userResult.rows[0];

        // 3. Create Agency (B2B Partner)
        const agencyResult = await client.query(
            `INSERT INTO agencies (name, type, email, phone, address, user_id, subscription, credit_start, current_credit) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING id`,
            [agencyName, 'Agence', email, phone, address, newUser.id, 'Standard', 0, 0]
        );

        await client.query('COMMIT');

        const { tenantContext } = await import('../middleware/tenant.js');
        const currentTenant = tenantContext.getStore()?.subdomain || 'default';

        // 4. Generate Token
        const token = generateToken({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            permissions: ['view_profile', 'view_bookings', 'manage_business'],
            agencyId: agencyResult.rows[0].id,
            tenantId: currentTenant
        });

        const isProduction = config.nodeEnv === 'production';
        res.cookie('token', token, {
            domain: isProduction ? '.trajetour.com' : undefined,
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            role: newUser.role,
            permissions: ['view_profile', 'view_bookings', 'manage_business'],
            agencyId: agencyResult.rows[0].id
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Agency Registration Failed:', error);
        next(error);
    } finally {
        client.release();
    }
});

// Logout
router.post('/logout', (req, res) => {
    const isProduction = config.nodeEnv === 'production';
    res.clearCookie('token', {
        domain: isProduction ? '.trajetour.com' : undefined
    });
    res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { verifyToken } = await import('../utils/jwt.js');
        const decoded = verifyToken(token);

        const result = await pool.query(
            `SELECT u.id, u.email, u.username, u.role, u.permissions,
                    c.id as client_id, c.full_name,
                    a.id as agency_id, a.name as agency_name
             FROM users u
             LEFT JOIN clients c ON u.id = c.user_id
             LEFT JOIN agencies a ON u.id = a.user_id
             WHERE u.id = $1`,
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // Derive firstName/lastName from full_name if it's a client
        let firstName = '';
        let lastName = '';
        if (user.full_name) {
            const parts = user.full_name.split(' ');
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
        } else if (user.role === 'agent' || user.role === 'admin' || user.role === 'staff') {
            // For staff/admin/agents, username might be used as a fallback or if we add real name fields later
            firstName = user.username;
        }

        res.json({
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? user.permissions : [],
            clientId: user.client_id,
            agencyId: user.agency_id,
            firstName,
            lastName
        });
    } catch (error) {
        next(error);
    }
});

export default router;
