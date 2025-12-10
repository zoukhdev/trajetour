import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt.js';

export interface AuthRequest extends Request {
    user?: JWTPayload;
}

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = req.cookies.token;

        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function requirePermission(permission: string) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (req.user.role === 'admin' || req.user.permissions.includes(permission)) {
            next();
        } else {
            res.status(403).json({ error: 'Insufficient permissions' });
        }
    };
}

export function requireRole(role: string) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (req.user.role === role || req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: `Role ${role} required` });
        }
    };
}
