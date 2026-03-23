import { masterPool } from './config/tenantPool.js';

async function check() {
    try {
        const res = await masterPool.query("SELECT * FROM agency_approvals ORDER BY created_at DESC");
        console.log("Total requests:", res.rows.length);
        if (res.rows.length > 0) {
            console.log(JSON.stringify(res.rows, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        masterPool.end();
    }
}

check();
