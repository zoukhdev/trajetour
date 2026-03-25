import { pool } from '../config/database.js';

async function run() {
    try {
        console.log('Adding image_url column to offers table...');
        await pool.query('ALTER TABLE offers ADD COLUMN IF NOT EXISTS image_url TEXT;');
        console.log('✅ Success: image_url column added.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding column:', err);
        process.exit(1);
    }
}

run();
