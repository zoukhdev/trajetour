import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  try {
    const res = await pool.query(`
      SELECT aa.*, a.name as agency_name 
      FROM agency_approvals aa
      JOIN agencies a ON aa.agency_id = a.id
      ORDER BY aa.created_at DESC
    `);
    console.log('Result length:', res.rows.length);
    console.log('Results:', JSON.stringify(res.rows, null, 2));
  } finally { await pool.end(); }
}
run();
