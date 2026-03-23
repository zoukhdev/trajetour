import { masterPool } from './config/tenantPool.js';

async function recentAgencies() {
    try {
        console.log("Reading recent agencies...");
        const res = await masterPool.query("SELECT * FROM agencies ORDER BY created_at DESC LIMIT 5");
        console.log(`Total agencies fetched: ${res.rows.length}`);
        res.rows.forEach((r: any) => {
            console.log(`Agency ID: ${r.id} | Subdomain: ${r.subdomain} | Owner: ${r.owner_email} | Plan: ${r.subscription} | Status: ${r.status} | Created: ${r.created_at}`);
        });

    } catch (e) {
        console.error("❌ Failed to list agencies:", e);
    } finally {
        masterPool.end();
    }
}

recentAgencies();
