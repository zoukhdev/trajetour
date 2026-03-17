
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_pMWw8Foc1CIQ@ep-ancient-cake-agf81841-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function checkData() {
    try {
        console.log('Connecting to DB...');
        const users = await pool.query("SELECT email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5");
        console.log("Recent Users:", users.rows);

        const orders = await pool.query("SELECT id, status, total_amount, created_at FROM orders ORDER BY created_at DESC LIMIT 5");
        console.log("Recent Orders:", orders.rows);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

checkData();
