import { pool } from '../config/database.js';

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting migration: addPaymentReceipts...');

        await client.query('BEGIN');

        // 1. Add receipt_url to payments table
        console.log('Adding receipt_url to payments...');
        // Check if column exists strictly to avoid errors? Or just try/catch? 
        // Postgres: ALTER TABLE ... ADD COLUMN IF NOT EXISTS
        await client.query(`
            ALTER TABLE payments 
            ADD COLUMN IF NOT EXISTS receipt_url TEXT;
        `);

        // 2. Update status check constraint on orders
        console.log('Updating orders status check constraint...');

        // We drop the constraint only if we know its name. 
        // Usually constraints are named orders_status_check or similar.
        // We can query information_schema to enable safer drop, but for now we try standard naming
        // or just recreate it with a safer approach (rename old, create new).

        // Postgres doesn't allow MODIFY COLUMN CHECK easily without dropping.
        // Let's attempt to drop by name 'orders_status_check' which is default if defined inline
        // or we try to find the constraint name.

        // Query to find constraint name
        const res = await client.query(`
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'orders'::regclass 
            AND contype = 'c' 
            AND pg_get_constraintdef(oid) LIKE '%status%';
        `);

        if (res.rows.length > 0) {
            const constraintName = res.rows[0].conname;
            console.log(`Dropping constraint: ${constraintName}`);
            await client.query(`ALTER TABLE orders DROP CONSTRAINT "${constraintName}";`);
        }

        // Add new constraint
        await client.query(`
            ALTER TABLE orders 
            ADD CONSTRAINT orders_status_check 
            CHECK (status IN ('Payé', 'Non payé', 'Partiel', 'En attente'));
        `);

        await client.query('COMMIT');
        console.log('✅ Migration successful');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
