import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_pMWw8Foc1CIQ@ep-ancient-cake-agf81841-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function run() {
    try {
        const res = await pool.query("SELECT id, email, role, agency_id FROM users WHERE agency_id = $1", ['de02fd18-f300-489a-a890-8a2716eeefd6']);
        console.log("Users for DZDORAN31:", res.rows);
    } catch (e) {
        console.error(e);
    }
    pool.end();
}
run();
