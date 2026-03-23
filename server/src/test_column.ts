import { masterPool } from './config/tenantPool.js';

async function checkColumn() {
    try {
        const res = await masterPool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'agency_approvals' AND column_name = 'agency_id'
        `);
        console.log("Column Info:", res.rows[0]);

    } catch (e) {
        console.error(e);
    } finally {
        masterPool.end();
    }
}

checkColumn();
