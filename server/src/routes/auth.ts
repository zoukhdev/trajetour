import express from 'express';
import { pool } from '../config/database.js';
import { config } from '../config/env.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { validate, loginSchema, registerSchema, registerAgencySchema } from '../middleware/validation.js';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

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

// Forgot Password
router.post('/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "L'e-mail est obligatoire." });

        const result = await pool.query('SELECT id, username FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        // Do not reveal if the user exists or not for security, but proceed if they do
        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
            const expires = new Date(Date.now() + 3600000); // 1 hour

            await pool.query(
                'UPDATE users SET reset_password_token = $1, reset_password_expires_at = $2 WHERE id = $3',
                [hashedToken, expires, user.id]
            );

            const { tenantContext } = await import('../middleware/tenant.js');
            let subdomain = tenantContext.getStore()?.subdomain || 'www';
            if (subdomain === 'api') subdomain = 'www';

            const resetLink = `https://${subdomain}.trajetour.com/reset-password?token=${token}`;

            if (process.env.RESEND_API_KEY) {
                await resend.emails.send({
                    from: 'Trajetour Sécurité <hello@trajetour.com>',
                    to: [email],
                    subject: '🔒 Réinitialisation de votre mot de passe',
                    html: `
                        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333; padding: 20px;">
                            <h2 style="color: #2563EB;">Réinitialisation de mot de passe</h2>
                            <p>Bonjour ${user.username},</p>
                            <p>Quelqu'un a demandé à réinitialiser votre mot de passe pour votre compte Trajetour. Si c'est vous, vous pouvez configurer un nouveau mot de passe en cliquant sur le bouton ci-dessous :</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetLink}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                    Réinitialiser mon mot de passe
                                </a>
                            </div>
                            <p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>
                            <p style="font-size: 13px; color: #64748b;">Le lien expirera dans une heure.</p>
                        </div>
                    `
                });
            }
        }

        res.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation vous a été envoyé." });
    } catch (error) {
        next(error);
    }
});

// Reset Password
router.post('/reset-password', async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ error: "Token et nouveau mot de passe sont obligatoires." });

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const result = await pool.query(
            'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires_at > NOW()',
            [hashedToken]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Le lien est invalide ou a expiré. Veuillez refaire une demande." });
        }

        const user = result.rows[0];
        const newPasswordHash = await hashPassword(newPassword);

        await pool.query(
            'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires_at = NULL WHERE id = $2',
            [newPasswordHash, user.id]
        );

        res.json({ message: "Votre mot de passe a été réinitialisé avec succès." });
    } catch (error) {
        next(error);
    }
});

export default router;
