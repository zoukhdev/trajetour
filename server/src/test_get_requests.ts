import { defaultPool } from './config/database.js';

async function testGet() {
    try {
        const result = await defaultPool.query(`
            SELECT aa.*, a.name as agency_name 
            FROM agency_approvals aa
            JOIN agencies a ON aa.agency_id = a.id
            ORDER BY aa.created_at DESC
        `);
        console.log('✅ Requests count:', result.rows.length);
        console.log('📄 Requests list:', result.rows);
    } catch (e: any) {
        console.error('❌ SQL failure:', e.message);
    } finally {
        await defaultPool.end();
    }
}

testGet();
