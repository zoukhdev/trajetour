import { defaultPool } from './config/database.js';

async function sync() {
    try {
        const res = await defaultPool.query(`
            UPDATE agencies 
            SET plan = subscription 
            WHERE subscription IS NOT NULL AND plan != subscription
        `);
        console.log('✅ Synchronized existing agencies:', res.rowCount);
    } catch (e: any) {
        console.error('❌ Sync Error:', e.message);
    } finally {
        await defaultPool.end();
    }
}

sync();
