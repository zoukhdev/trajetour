import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  try {
    const agencyRes = await pool.query('SELECT id, name, status, neon_branch_id, db_url FROM agencies ORDER BY created_at DESC LIMIT 5');
    console.log('Recent Agencies:', JSON.stringify(agencyRes.rows, null, 2));
  } finally { await pool.end(); }
}
run();
