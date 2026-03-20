import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';

export const tenantContext = new AsyncLocalStorage<{ subdomain: string }>();

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
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

    tenantContext.run({ subdomain }, () => {
        next();
    });
}
