import { masterPool } from './config/tenantPool.js';

async function listAll() {
    try {
        console.log("Reading all rows in agency_approvals RAW...");
        const res = await masterPool.query("SELECT * FROM agency_approvals ORDER BY created_at DESC");
        console.log("RAW ROWS:", JSON.stringify(res.rows, null, 2));
        console.log(`Total raw requests: ${res.rows.length}`);
        res.rows.forEach((r: any) => {
            console.log(`Request ID: ${r.id} | Agency ID: ${r.agency_id} | Status: ${r.status} | Created: ${r.created_at}`);
        });

    } catch (e) {
        console.error("❌ Failed to list requests:", e);
    } finally {
        masterPool.end();
    }
}

listAll();
