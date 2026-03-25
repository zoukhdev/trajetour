import pkg from 'pg';
const { Pool } = pkg;

export async function migrateTenantDatabase(pool: pkg.Pool) {
    console.log('🔄 Running tenant-level migrations...');
    try {
        // Rooms Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                offer_id VARCHAR(255),
                hotel_name VARCHAR(255) NOT NULL,
                room_number VARCHAR(50) NOT NULL,
                capacity INTEGER NOT NULL DEFAULT 4,
                gender VARCHAR(20) CHECK (gender IN ('MEN', 'WOMEN', 'MIXED')) NOT NULL,
                status VARCHAR(20) DEFAULT 'ACTIVE',
                price DECIMAL(12,2) DEFAULT 0,
                agency_id UUID,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            ALTER TABLE rooms 
            ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS offer_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS agency_id UUID,
            ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{"adult": 0, "child": 0, "infant": 0}'::jsonb;
        `);

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_rooms_agency_id ON rooms(agency_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);`);

        // Offers Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS offers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                type VARCHAR(50),
                destination VARCHAR(255),
                price DECIMAL(12,2) DEFAULT 0,
                start_date DATE,
                end_date DATE,
                hotel VARCHAR(255),
                transport VARCHAR(255),
                description TEXT,
                status VARCHAR(50) DEFAULT 'Draft',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            ALTER TABLE offers 
            ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS inclusions JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS room_pricing JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS agency_id UUID,
            ADD COLUMN IF NOT EXISTS image_url TEXT,
            ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
        `);

        // Clients Table
        await pool.query(`
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS agency_id UUID;
        `);

        // Offer Hotels Mapping Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS offer_hotels (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
                room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(offer_id, room_id)
            );
        `);

        // Payments/Transactions audit
        await pool.query(`
            ALTER TABLE payments 
            ADD COLUMN IF NOT EXISTS account_id UUID,
            ADD COLUMN IF NOT EXISTS validated_by UUID,
            ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;
        `);

        await pool.query(`
            ALTER TABLE transactions 
            ADD COLUMN IF NOT EXISTS payment_id UUID;
        `);

        // Agency Settings & Hero Slides (for homepage builder)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS agency_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                display_name VARCHAR(255),
                primary_color VARCHAR(20) DEFAULT '#3b82f6',
                secondary_color VARCHAR(20) DEFAULT '#10b981',
                logo_url TEXT,
                og_image_url TEXT,
                seo_title TEXT,
                seo_description TEXT,
                font_family VARCHAR(100) DEFAULT 'Inter',
                border_radius VARCHAR(20) DEFAULT '12px',
                video_url TEXT,
                whatsapp_number VARCHAR(30),
                newsletter_enabled BOOLEAN DEFAULT false,
                trust_stats JSONB DEFAULT '[]'::jsonb,
                testimonials JSONB DEFAULT '[]'::jsonb,
                faqs JSONB DEFAULT '[]'::jsonb,
                analytics_ga_id VARCHAR(100),
                custom_scripts TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS agency_hero_slides (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT,
                description TEXT,
                image_url TEXT,
                cta_text VARCHAR(100),
                cta_link TEXT,
                is_active BOOLEAN DEFAULT true,
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Tenant-level migrations completed.');

    } catch (error) {
        console.error('❌ Tenant migration failed:', error);
        throw error;
    }
}
