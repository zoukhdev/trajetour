import { defaultPool } from './config/database.js';

async function testCols() {
    try {
        const result = await defaultPool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'agencies'
        `);
        console.log('📋 Agencies columns:', result.rows.map(r => r.column_name));
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    } finally {
        await defaultPool.end();
    }
}

testCols();
