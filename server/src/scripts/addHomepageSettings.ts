import { defaultPool } from '../config/database.js';
import { getTenantPool } from '../config/tenantPool.js';

async function migrateExistingTenants() {
    try {
        console.log('🔄 Starting Homepage Settings Schema Migration for all tenants...');
        
        // 1. Get all agencies with a db_url from master database
        const masterClient = await defaultPool.connect();
        const agenciesResult = await masterClient.query(`
            SELECT id, name, subdomain, db_url 
            FROM agencies 
            WHERE db_url IS NOT NULL
        `);
        masterClient.release();
        
        const agencies = agenciesResult.rows;
        console.log(`📋 Found ${agencies.length} agencies with dedicated databases.`);

        for (const agency of agencies) {
            console.log(`\n➡️ Migrating agency: ${agency.name} (${agency.subdomain})`);
            let tenantClient;
            try {
                const tenantPool = await getTenantPool(agency.subdomain);
                tenantClient = await tenantPool.connect();

                console.log('  - Adding agency_settings table...');
                await tenantClient.query(`
                    CREATE TABLE IF NOT EXISTS agency_settings (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        logo_url TEXT,
                        display_name VARCHAR(255),
                        slogan VARCHAR(255),
                        primary_color VARCHAR(50) DEFAULT '#3B82F6',
                        contact_email VARCHAR(255),
                        contact_phone VARCHAR(50),
                        contact_address TEXT,
                        map_embed_url TEXT,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                `);

                console.log('  - Adding agency_hero_slides table...');
                await tenantClient.query(`
                    CREATE TABLE IF NOT EXISTS agency_hero_slides (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        image_url TEXT NOT NULL,
                        title VARCHAR(255),
                        description TEXT,
                        cta_text VARCHAR(50),
                        cta_url VARCHAR(255),
                        order_index INTEGER DEFAULT 0,
                        is_active BOOLEAN DEFAULT true
                    );
                `);

                console.log('  - Updating offers table with is_featured column...');
                await tenantClient.query(`
                    ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
                `);

                console.log(`  ✅ Successfully migrated tenant ${agency.subdomain}`);
            } catch (err) {
                console.error(`  ❌ Failed to migrate tenant ${agency.subdomain}:`, err);
            } finally {
                if (tenantClient) {
                    tenantClient.release();
                }
            }
        }

        console.log('\n✅ All migrations completed!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await defaultPool.end();
    }
}

// Run the migration
migrateExistingTenants()
    .then(() => {
        console.log('✅ Migration script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration script failed:', error);
        process.exit(1);
    });
