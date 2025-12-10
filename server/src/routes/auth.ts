import express from 'express';
import { pool } from '../config/database.js';
import { config } from '../config/env.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { validate, loginSchema } from '../middleware/validation.js';

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

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions || []
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: config.nodeEnv === 'production', // Required for sameSite: 'none'
            sameSite: config.nodeEnv === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? user.permissions : []
        });
    } catch (error) {
        console.error('❌ Login Error Details:', error);
        next(error);
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
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
            'SELECT id, email, username, role, permissions FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? user.permissions : []
        });
    } catch (error) {
        next(error);
    }
});

export default router;
