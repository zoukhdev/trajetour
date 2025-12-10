import { pool } from '../config/database.js';

async function updateSchema() {
    const client = await pool.connect();
    try {
        console.log('🔄 Updating orders schema...');

        // Add passengers and hotels columns
        await client.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS passengers JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS hotels JSONB DEFAULT '[]'::jsonb;
        `);

        console.log('✅ Schema updated successfully!');

    } catch (error) {
        console.error('❌ Update failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
        process.exit(0);
    }
}

updateSchema();
