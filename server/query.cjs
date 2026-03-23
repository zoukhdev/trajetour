const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    // Check agencies with their db_url (is it provisioned?)
    const agencies = await pool.query(`SELECT id, name, subdomain, status, db_url, owner_email FROM agencies ORDER BY created_at DESC`);
    console.log('\n=== All Agencies ===');
    console.table(agencies.rows.map(r => ({ ...r, db_url: r.db_url ? r.db_url.substring(0, 40) + '...' : 'EMPTY!' })));

    // Check all upgrade requests
    const upgrades = await pool.query(`
      SELECT aa.id, aa.type, aa.status, aa.created_at, a.name, a.subdomain
      FROM agency_approvals aa
      JOIN agencies a ON aa.agency_id = a.id
      ORDER BY aa.created_at DESC
    `);
    console.log('\n=== Upgrade Requests ===');
    console.table(upgrades.rows);

  } catch (error) {
    console.error('Error executing query:', error);
  } finally {
    await pool.end();
  }
}

run();
