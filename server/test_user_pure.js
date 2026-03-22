import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_pMWw8Foc1CIQ@ep-ancient-cake-agf81841-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function run() {
    try {
        const res = await pool.query("SELECT id, email, role, agency_id FROM users WHERE email = $1", ['zoukh909@gmail.com']);
        console.log("User Profile:", res.rows[0]);
        if (res.rows[0] && res.rows[0].agency_id) {
             const agencyRes = await pool.query("SELECT * FROM agencies WHERE id = $1", [res.rows[0].agency_id]);
             console.log("Agency Profile:", agencyRes.rows[0]);
        }
    } catch (e) {
        console.error(e);
    }
    pool.end();
}
run();
