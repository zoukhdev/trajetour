
import { pool } from './server/src/config/database.js';

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'offers';
        `);
        console.log('--- Columns in offers table ---');
        res.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

checkSchema();
