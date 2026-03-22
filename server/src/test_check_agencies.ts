import { defaultPool } from './config/database.js';

async function checkAgency() {
    try {
        const res = await defaultPool.query(`SELECT id, subdomain FROM agencies`);
        console.log('📄 Existing agency subdomains:', res.rows.map(r => r.subdomain));
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    } finally {
        await defaultPool.end();
    }
}

checkAgency();
