import { defaultPool } from './config/database.js';

async function testInsert() {
    const client = await defaultPool.connect();
    try {
        await client.query('BEGIN');
        const agencyId = 'de02fd18-f300-489a-a890-8a2716eeefd6'; // DZDORAN31 Dashboard Agency ID
        const currentPlan = 'Standard';
        const requestedPlan = 'Premium';
        const notes = 'Auto-test Upgrade';

        const result = await client.query(
            `INSERT INTO agency_approvals (agency_id, type, current_value, requested_value, status, notes)
             VALUES ($1, 'UPGRADE_PLAN', $2, $3, 'PENDING', $4)
             RETURNING *`,
            [agencyId, currentPlan, requestedPlan, notes]
        );
        console.log('✅ Insert Successful:', result.rows[0]);
        await client.query('COMMIT');
    } catch (e: any) {
        await client.query('ROLLBACK');
        console.error('❌ SQL Failure:', e.message, '\n', e.stack);
    } finally {
        client.release();
        await defaultPool.end();
    }
}

testInsert();
