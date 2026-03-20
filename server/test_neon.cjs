const axios = require('axios');
require('dotenv').config({path: './server/.env'});
const { Pool } = require('pg');

async function test() {
  const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;
  const NEON_API_KEY = process.env.NEON_API_KEY;

  if (!NEON_PROJECT_ID || !NEON_API_KEY) {
    console.error("Missing NEON_PROJECT_ID or NEON_API_KEY");
    return;
  }

  const headers = {
    'Authorization': `Bearer ${NEON_API_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  try {
    const createBranchRes = await axios.post(
      `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`,
      {
          endpoints: [{ type: 'read_write' }],
          branch: {
              name: `test-branch-${Date.now()}`
          }
      },
      { headers }
    );

    const host = createBranchRes.data.endpoints[0].host;
    const role = createBranchRes.data.roles[0].name;
    const password = createBranchRes.data.roles[0].password;
    
    console.log("Branch created:", host, role, password);

    // Now try to run a query as the new role
    const dbUrl = `postgresql://${role}:${password}@${host}/neondb?sslmode=require`;
    const pool = new Pool({ connectionString: dbUrl });
    
    // Test schema permissions
    try {
      await pool.query("CREATE TABLE IF NOT EXISTS test_table (id INT)");
      console.log("Successfully created table with new role!");
    } catch (err) {
      console.error("Failed to create table. Permission error?", err.message);
    }
    
    await pool.end();
  } catch (e) {
    console.error("Error:", e.response ? e.response.data : e.message);
  }
}

test();
