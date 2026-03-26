import pkg from 'pg';
import { config } from '../config/env.js';

const { Pool } = pkg;
const masterPool = new Pool({
    connectionString: config.masterDatabaseUrl
});

async function fixAgencyImages() {
    try {
        const subdomain = 'mustaphavoyage';
        const res = await masterPool.query('SELECT name, subdomain, db_url FROM agencies WHERE subdomain = $1', [subdomain]);
        
        if (res.rows[0]?.db_url) {
            const tenantPool = new Pool({ connectionString: res.rows[0].db_url });
            
            // 1. Update offers that have no image or generic images
            // We'll reset them to null so the frontend fallbacks (which we already fixed to Hajj/Omrah) take over
            // Or explicitly set them to our new local assets
            await tenantPool.query(`
                UPDATE offers 
                SET image_url = CASE 
                    WHEN title ILIKE '%omrah%' THEN '/masjid-haram-aerial.png'
                    WHEN title ILIKE '%hajj%' THEN '/hajj-hero.png'
                    ELSE '/kaaba-night.png'
                END
                WHERE image_url IS NULL OR image_url = '' OR image_url LIKE '%unsplash%' OR image_url LIKE '%wedding%'
            `);
            
            // 2. Clear out any sample hero slides that might have wedding images
            await tenantPool.query(`
                UPDATE agency_hero_slides 
                SET image_url = '/hajj-hero.png'
                WHERE image_url IS NULL OR image_url = '' OR image_url LIKE '%unsplash%' OR image_url LIKE '%wedding%'
            `);

            // 3. Update agency settings defaults if generic
            await tenantPool.query(`
                UPDATE agency_settings
                SET logo_url = '/logo.png'
                WHERE logo_url IS NULL OR logo_url = '' OR logo_url LIKE '%unsplash%'
            `);

            console.log('✅ Updated mustaphavoyage database records with Hajj/Omrah assets.');
            
            await tenantPool.end();
        } else {
            console.log(`No db_url found for ${subdomain}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await masterPool.end();
    }
}

fixAgencyImages();
