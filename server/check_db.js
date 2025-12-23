
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log('Columns in users table:', res.rows.map(r => r.column_name).join(', '));
        process.exit(0);
    } catch (err) {
        console.error('Error checking columns:', err);
        process.exit(1);
    }
}
check();
