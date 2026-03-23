import { masterPool } from './config/tenantPool.js';

async function diagnose() {
    try {
        console.log("1. Fetching agency_id for test-xyz-99...");
        const agencyRes = await masterPool.query("SELECT id FROM agencies WHERE subdomain = 'test-xyz-99'");
        if (agencyRes.rows.length === 0) {
            console.log("❌ Agency test-xyz-99 not found.");
            return;
        }
        const agencyId = agencyRes.rows[0].id;
        console.log(`✅ Found Agency ID: ${agencyId}`);

        console.log("2. Inserting mock request into agency_approvals...");
        const insertRes = await masterPool.query(
            `INSERT INTO agency_approvals (agency_id, type, current_value, requested_value, status, notes)
             VALUES ($1, 'UPGRADE_PLAN', 'Basic', 'Premium', 'PENDING', 'Mock Upgrade diagnostic')
             RETURNING *`,
            [agencyId]
        );
        console.log("✅ Inserted row:", insertRes.rows[0]);

        console.log("3. Running the select query from /requests endpoint...");
        const result = await masterPool.query(`
            SELECT aa.*, a.name as agency_name 
            FROM agency_approvals aa
            JOIN agencies a ON aa.agency_id = a.id
            ORDER BY aa.created_at DESC
        `);
        console.log(`✅ Select query returned ${result.rows.length} rows.`);
        if (result.rows.length > 0) {
            console.log("First row from select query:", result.rows[0]);
        }

    } catch (e) {
        console.error("❌ Diagnostic failed with error:", e);
    } finally {
        masterPool.end();
    }
}

diagnose();
