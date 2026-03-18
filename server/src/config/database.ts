import pkg from 'pg';
import { config } from './env.js';
import { getTenantPool } from './tenantPool.js';
import { tenantContext } from '../middleware/tenant.js';

const { Pool } = pkg;

// Create default PostgreSQL pool
export const defaultPool = new Pool({
    connectionString: config.databaseUrl
});

defaultPool.on('connect', () => {
    // console.log('✅ Connected to default PostgreSQL database');
});

defaultPool.on('error', (err) => {
    console.error('❌ Unexpected database error on default pool:', err);
});

// Proxy the default pool to seamlessly route queries/connections to tenant pools
export const pool = new Proxy(defaultPool, {
    get(target, prop) {
        if (prop === 'query') {
            return async function (text: string, params?: any[]) {
                const store = tenantContext.getStore();
                const subdomain = store?.subdomain || 'default';
                const actualPool = await getTenantPool(subdomain);
                return actualPool.query(text, params);
            };
        } else if (prop === 'connect') {
            return async function () {
                const store = tenantContext.getStore();
                const subdomain = store?.subdomain || 'default';
                const actualPool = await getTenantPool(subdomain);
                return actualPool.connect();
            };
        }
        
        const origin = target[prop as keyof pkg.Pool];
        if (typeof origin === 'function') {
            return origin.bind(target);
        }
        return origin;
    }
}) as pkg.Pool;

// Helper function to test connection
export async function testConnection(): Promise<boolean> {
    try {
        const client = await defaultPool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection test successful:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
    }
}
