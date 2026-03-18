import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';

export const tenantContext = new AsyncLocalStorage<{ subdomain: string }>();

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    let subdomain = 'default';
    
    // Extract subdomain
    // Assuming base is trajetour.com -> anything before is subdomain
    // local testing -> localhost:3000
    if (host.includes('.trajetour.com')) {
        const parts = host.split('.');
        if (parts.length > 2) {
             subdomain = parts[0]; // e.g., 'agency1' from 'agency1.trajetour.com'
        }
    } else if (req.headers['x-tenant-id']) {
        subdomain = req.headers['x-tenant-id'] as string;
    }

    tenantContext.run({ subdomain }, () => {
        next();
    });
}
