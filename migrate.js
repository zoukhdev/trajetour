import { Pool } from 'pg';

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_pMWw8Foc1CIQ@ep-ancient-cake-agf81841-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function runMigration() {
    try {
        console.log('Connecting to DB...');
        await pool.query(`
            ALTER TABLE agencies 
            ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100) UNIQUE,
            ADD COLUMN IF NOT EXISTS db_url TEXT,
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE',
            ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);
        `);
        console.log('✅ Altered agencies table successfully');
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

runMigration();
