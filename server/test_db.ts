import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query('SELECT * FROM agency_approvals ORDER BY created_at DESC LIMIT 10');
    console.log('Recent Approvals:', JSON.stringify(res.rows, null, 2));

    const agencyRes = await pool.query('SELECT id, name, status, plan, subscription, created_at FROM agencies ORDER BY created_at DESC LIMIT 5');
    console.log('Recent Agencies:', JSON.stringify(agencyRes.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
