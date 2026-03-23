import { masterPool } from './config/tenantPool.js';
import fs from 'fs';

async function logAgencies() {
    try {
        const res = await masterPool.query("SELECT * FROM agencies ORDER BY created_at DESC LIMIT 5");
        fs.writeFileSync('constraints.json', JSON.stringify(res.rows, null, 2));
        console.log("Saved to constraints.json");
    } catch (e) {
        console.error(e);
    } finally {
        masterPool.end();
    }
}

logAgencies();
