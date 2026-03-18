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

        // DEBUG LOGGING
        console.log(`🔒 Auth Check [${req.method} ${req.path}]`);
        console.log('   Cookies:', req.cookies ? 'Present' : 'Missing');
        console.log('   Token:', token ? 'Found' : 'Missing');


        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const decoded = verifyToken(token);
        
        // Tenant security check
        const { tenantContext } = await import('./tenant.js');
        const store = tenantContext.getStore();
        const currentTenant = store?.subdomain || 'default';
        
        if (decoded.tenantId && decoded.tenantId !== currentTenant) {
            console.error(`🔒 Tenant Mismatch: token for ${decoded.tenantId} used on ${currentTenant}`);
            res.status(401).json({ error: 'Token not valid for this tenant' });
            return;
        }

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

export function requireRole(allowedRoles: string | string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (roles.includes(req.user.role) || req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: `Requires one of roles: ${roles.join(', ')}` });
        }
    };
}
