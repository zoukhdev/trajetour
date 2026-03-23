import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';
import { masterPool } from '../config/tenantPool.js'; // MUST use masterPool - agencies table only exists in master DB

export const tenantContext = new AsyncLocalStorage<{ subdomain: string; agencyId?: string }>();

// Augment the global Express namespace so tenantAgencyId is typed on ALL request types
// (including AuthRequest from auth.ts) without needing separate interface declarations.
declare global {
    namespace Express {
        interface Request {
            tenantAgencyId?: string;
        }
    }
}

// Keep TenantRequest for backwards compatibility (routes that import it directly)
export interface TenantRequest extends Request {
    tenantAgencyId?: string;
}

export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    let subdomain = 'default';

    // Explicit header takes precedence
    if (req.headers['x-tenant-id']) {
        subdomain = req.headers['x-tenant-id'] as string;
    } else if (host.includes('.trajetour.com')) {
        const parts = host.split('.');
        if (parts.length > 2 && parts[0] !== 'api' && parts[0] !== 'app') {
            subdomain = parts[0];
        }
    }

    let agencyId: string | undefined = undefined;
    if (subdomain !== 'default') {
        try {
            const result = await masterPool.query('SELECT id FROM agencies WHERE subdomain = $1', [subdomain]);
            if (result.rows.length > 0) {
                agencyId = result.rows[0].id;
                req.tenantAgencyId = agencyId; // Attach to request for easy endpoint access
            }
        } catch (err) {
            console.error('❌ Tenant lookup failed for:', subdomain, err);
        }
    }

    tenantContext.run({ subdomain, agencyId }, () => {
        next();
    });
}
