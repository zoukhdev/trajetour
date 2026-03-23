require('dotenv').config();
const { masterPool } = require('./dist/config/tenantPool.js');

async function run() {
  try {
    const res = await masterPool.query(`
      SELECT aa.id, aa.agency_id, a.name as agency_name, aa.type, aa.current_value, aa.requested_value, aa.status, aa.created_at
      FROM agency_approvals aa
      LEFT JOIN agencies a ON aa.agency_id = a.id
      ORDER BY aa.created_at DESC LIMIT 10
    `);
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
