const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});

async function checkRows() {
    try {
        const res = await pool.query("SELECT id, name, status, db_provisioned_at FROM agencies LIMIT 5");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch(e) {
        console.error("Error:", e.message);
    } finally {
        pool.end();
    }
}

checkRows();
