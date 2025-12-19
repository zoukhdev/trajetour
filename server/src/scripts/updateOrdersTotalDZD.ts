import { pool } from '../config/database.js';

async function updateSchema() {
    const client = await pool.connect();
    try {
        console.log('🔄 Updating orders schema to add total_amount_dzd...');

        // Add total_amount_dzd column
        await client.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS total_amount_dzd DECIMAL(15, 2) DEFAULT 0;
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
