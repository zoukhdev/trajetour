import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config({ path: '.env' });
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function addCol() {
    try {
        await pool.query("ALTER TABLE agencies ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);");
        console.log("Column added");
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
addCol();
