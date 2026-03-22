import { defaultPool } from './config/database.js';

async function testConstraints() {
    try {
        const result = await defaultPool.query(`
            SELECT conname, contype, pg_get_constraintdef(c.oid) as def
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'agencies'::regclass
        `);
        console.log('📋 Agencies constraints:', result.rows);
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    } finally {
        await defaultPool.end();
    }
}

testConstraints();
