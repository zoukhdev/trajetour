import { pool } from '../config/database.js';

async function addPremiumSettings() {
    const client = await pool.connect();

    try {
        console.log('🔄 Adding premium settings columns...');

        // 1. Branding & Visuals
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'Inter'`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS video_url TEXT`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(50) DEFAULT '#10B981'`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS border_radius VARCHAR(20) DEFAULT '8px'`);

        // 2. Marketing & SEO
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255)`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS seo_description TEXT`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS analytics_ga_id VARCHAR(50)`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS analytics_fb_id VARCHAR(50)`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS analytics_tiktok_id VARCHAR(50)`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS og_image_url TEXT`);

        // 3. Interactive Content (using JSONB for flexibility)
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS trust_stats JSONB DEFAULT '[]'::jsonb`);

        // 4. Conversion Tools
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50)`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS whatsapp_message TEXT`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS newsletter_enabled BOOLEAN DEFAULT false`);
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS custom_scripts TEXT`);

        // 5. Multilingual
        await client.query(`ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb`);

        console.log('✅ Premium settings columns added successfully');

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

addPremiumSettings()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
