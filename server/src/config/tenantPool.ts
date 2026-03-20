import pkg from 'pg';
import { config } from './env.js';

const { Pool } = pkg;

// Master connection pool for querying agencies
export const masterPool = new Pool({
    connectionString: config.masterDatabaseUrl
});

// Cache for tenant connection pools
const tenantPools: Record<string, pkg.Pool> = {};

export async function getTenantPool(subdomain: string): Promise<pkg.Pool> {
    // If it's the default/main tenant and we have the standard DB URL, we might want to use it
    if (subdomain === 'default' || subdomain === 'www') {
        if (!tenantPools['default']) {
            tenantPools['default'] = new Pool({ connectionString: config.databaseUrl });
        }
        return tenantPools['default'];
    }

    // Check memory cache
    if (tenantPools[subdomain]) {
        return tenantPools[subdomain];
    }

    // Lookup in master db
    try {
        const res = await masterPool.query(
            'SELECT db_url, status FROM agencies WHERE subdomain = $1',
            [subdomain]
        );

        if (res.rows.length === 0) {
            // No custom agency database, fallback to default or throw
            console.warn(`⚠️ No agency found for subdomain: ${subdomain}, falling back to default db.`);
            return getTenantPool('default');
        }

        const agency = res.rows[0];
        if (agency.status !== 'ACTIVE') {
            if (agency.status === 'PENDING') {
                throw new Error(`Agency "${subdomain}" is awaiting approval. Please wait for confirmation.`);
            } else if (agency.status === 'REJECTED') {
                throw new Error(`Agency "${subdomain}" registration was rejected. Please contact support.`);
            }
            throw new Error(`Agency ${subdomain} is not active (status: ${agency.status}).`);
        }

        // Create new pool for the tenant
        const newPool = new Pool({ connectionString: agency.db_url });
        tenantPools[subdomain] = newPool;
        console.log(`✅ Created DB pool for tenant: ${subdomain}`);

        return newPool;
    } catch (error) {
        console.error(`❌ Error resolving DB pool for ${subdomain}:`, error);
        throw error; // Or fallback to default depends on business logic
    }
}
