import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function cleanup() {
    try {
        console.log("Cleaning up failed agencies mapping to unresolved neon branches...");
        
        // Delete dztravel, dztravler2, Test Agency
        const res = await pool.query(
            "DELETE FROM agencies WHERE name IN ('Dztravel', 'dztravler2', 'Test Agency') OR subdomain IN ('dztravel', 'dztravler2') RETURNING *"
        );
        
        console.log(`Deleted ${res.rowCount} invalid test agencies.`);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
cleanup();
