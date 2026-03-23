const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_pMWw8Foc1CIQ@ep-ancient-cake-agf81841-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
});

async function checkApp() {
  const res = await pool.query(`
    SELECT aa.id, aa.agency_id, a.name as agency_name, aa.type, aa.current_value, aa.requested_value, aa.status, aa.created_at
    FROM agency_approvals aa
    LEFT JOIN agencies a ON aa.agency_id = a.id
    ORDER BY aa.created_at DESC
    LIMIT 10
  `);
  console.table(res.rows);
  
  const res2 = await pool.query(`
    SELECT id, name, subdomain FROM agencies WHERE subdomain = 'westtravel'
  `);
  console.log("\nWesttravel Agency in DB:");
  console.table(res2.rows);

  process.exit(0);
}

checkApp();
