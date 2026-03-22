import { defaultPool } from './config/database.js';

async function testDuplication() {
    try {
        const subdomain = 'dzdoran313';
        const existing = await defaultPool.query('SELECT id FROM agencies WHERE subdomain = $1', [subdomain]);
        if (existing.rows.length > 0) {
            console.log('🚨 Subdomain dzdoran313 is already TAKEN on the database!');
        } else {
            console.log('✅ Subdomain dzdoran313 is FREE in the database.');
        }
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    } finally {
        await defaultPool.end();
    }
}

testDuplication();
