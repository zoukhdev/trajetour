import { defaultPool as pool } from './config/database.js';

async function checkTable() {
    try {
        const res = await pool.query("SELECT count(*) FROM agency_approvals");
        console.log("Count:", res.rows[0].count);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkTable();
