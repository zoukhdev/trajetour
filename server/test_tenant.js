import pg from 'pg';

const dbUrl = "postgres://neondb_owner:npg_pMWw8Foc1CIQ@ep-soft-mode-a2bgi220.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const { Pool } = pg;
const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function queryDB() {
    try {
        const res = await pool.query("SELECT id, email, username FROM users");
        console.log("Success! Users:", res.rows.length);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
queryDB();
