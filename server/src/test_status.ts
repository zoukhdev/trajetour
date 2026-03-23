import { masterPool } from './config/tenantPool.js';

async function check() {
    try {
        const res = await masterPool.query("SELECT id, name, subdomain, status, db_url, db_provisioned_at FROM agencies WHERE subdomain = 'test-xyz-99'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        masterPool.end();
    }
}

check();
