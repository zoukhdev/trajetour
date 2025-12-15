import { pool } from '../config/database.js';

async function fixRoomsSchema() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting Rooms Schema Fix...');

        // Step 1: Check current columns
        const columnsResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'rooms'
            ORDER BY ordinal_position;
        `);

        console.log('📋 Current rooms table columns:');
        columnsResult.rows.forEach(row => {
            console.log(`   - ${row.column_name}: ${row.data_type}`);
        });

        // Step 2: Add missing columns
        console.log('\n🔧 Adding missing columns...');

        await client.query(`
            ALTER TABLE rooms 
            ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{"adult": 0, "child": 0, "infant": 0}'::jsonb;
        `);

        console.log('✅ Columns added successfully');

        // Step 3: Migrate existing data
        console.log('\n🔄 Migrating existing price data to pricing JSONB...');

        await client.query(`
            UPDATE rooms 
            SET pricing = jsonb_build_object(
                'adult', COALESCE(price, 0), 
                'child', 0, 
                'infant', 0
            )
            WHERE pricing IS NULL 
               OR pricing = '{}'::jsonb 
               OR NOT (pricing ? 'adult' AND pricing ? 'child' AND pricing ? 'infant');
        `);

        console.log('✅ Data migration completed');

        // Step 4: Verify final schema
        const finalColumnsResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'rooms'
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 Final rooms table columns:');
        finalColumnsResult.rows.forEach(row => {
            console.log(`   - ${row.column_name}: ${row.data_type}`);
        });

        console.log('\n✅ Rooms schema fix completed successfully!');

    } catch (error) {
        console.error('❌ Error fixing rooms schema:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
fixRoomsSchema()
    .then(() => {
        console.log('✅ Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration script failed:', error);
        process.exit(1);
    });
