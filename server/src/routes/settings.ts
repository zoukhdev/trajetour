import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper to map DB snake_case to frontend camelCase
 */
const mapSettingsToClient = (dbSettings: any) => {
    if (!dbSettings) return {};
    return {
        id: dbSettings.id,
        logoUrl: dbSettings.logo_url || '',
        displayName: dbSettings.display_name || '',
        slogan: dbSettings.slogan || '',
        primaryColor: dbSettings.primary_color || '#3B82F6',
        contactEmail: dbSettings.contact_email || '',
        contactPhone: dbSettings.contact_phone || '',
        contactAddress: dbSettings.contact_address || '',
        mapEmbedUrl: dbSettings.map_embed_url || '',
        updatedAt: dbSettings.updated_at
    };
};

const mapSlideToClient = (row: any) => {
    return {
        id: row.id,
        imageUrl: row.image_url || '',
        title: row.title || '',
        description: row.description || '',
        ctaText: row.cta_text || '',
        ctaUrl: row.cta_url || '',
        orderIndex: row.order_index,
        isActive: row.is_active
    };
};

/**
 * @route   GET /api/settings/homepage
 * @desc    Get homepage settings and hero slides for the tenant
 * @access  Public (so the public homepage can access them)
 */
router.get('/homepage', async (req, res) => {
    try {
        const settingsResult = await pool.query(`SELECT * FROM agency_settings ORDER BY updated_at DESC LIMIT 1`);
        const settings = mapSettingsToClient(settingsResult.rows[0]);

        const slidesResult = await pool.query(`SELECT * FROM agency_hero_slides ORDER BY order_index ASC`);
        const slides = slidesResult.rows.map(mapSlideToClient);

        res.json({ settings, slides });
    } catch (err: any) {
        console.error('Error fetching homepage settings:', err.message);
        res.status(500).json({ message: 'Server error fetching settings' });
    }
});

/**
 * @route   POST /api/settings/homepage
 * @desc    Update homepage settings and hero slides
 * @access  Private (Admin only)
 */
router.post('/homepage', authMiddleware, requirePermission('manage_business'), async (req, res) => {
    // Basic auth check already done by middleware, you might also want to restrict to 'manage_business' permission
    const { settings, slides } = req.body;
    
    // We expect { settings: {...}, slides: [{...}, ...] }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // 1. Upsert Settings
        let settingsId;
        const currentSettings = await client.query('SELECT id FROM agency_settings LIMIT 1');
        
        if (currentSettings.rows.length > 0) {
            settingsId = currentSettings.rows[0].id;
            await client.query(`
                UPDATE agency_settings 
                SET logo_url = $1, display_name = $2, slogan = $3, primary_color = $4, 
                    contact_email = $5, contact_phone = $6, contact_address = $7, map_embed_url = $8,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $9
            `, [
                settings.logoUrl || settings.logo_url || null, 
                settings.displayName || settings.display_name || null, 
                settings.slogan || null, 
                settings.primaryColor || settings.primary_color || '#3B82F6', 
                settings.contactEmail || settings.contact_email || null, 
                settings.contactPhone || settings.contact_phone || null, 
                settings.contactAddress || settings.contact_address || null, 
                settings.mapEmbedUrl || settings.map_embed_url || null,
                settingsId
            ]);
        } else {
            const insertRes = await client.query(`
                INSERT INTO agency_settings (logo_url, display_name, slogan, primary_color, contact_email, contact_phone, contact_address, map_embed_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `, [
                settings.logoUrl || settings.logo_url || null, 
                settings.displayName || settings.display_name || null, 
                settings.slogan || null, 
                settings.primaryColor || settings.primary_color || '#3B82F6', 
                settings.contactEmail || settings.contact_email || null, 
                settings.contactPhone || settings.contact_phone || null, 
                settings.contactAddress || settings.contact_address || null, 
                settings.mapEmbedUrl || settings.map_embed_url || null
            ]);
            settingsId = insertRes.rows[0].id;
        }

        // 2. Refresh Slides (Delete all and insert new ones to keep it simple)
        await client.query('DELETE FROM agency_hero_slides');
        
        if (slides && Array.isArray(slides)) {
            for (let i = 0; i < slides.length; i++) {
                const slide = slides[i];
                await client.query(`
                    INSERT INTO agency_hero_slides (image_url, title, description, cta_text, cta_url, order_index, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    slide.imageUrl || slide.image_url || null,
                    slide.title || null,
                    slide.description || null,
                    slide.ctaText || slide.cta_text || null,
                    slide.ctaUrl || slide.cta_url || null,
                    i,
                    slide.isActive !== undefined ? slide.isActive : (slide.is_active !== undefined ? slide.is_active : true)
                ]);
            }
        }

        await client.query('COMMIT');

        // Fetch the updated data to return
        const updatedSettings = await client.query(`SELECT * FROM agency_settings WHERE id = $1`, [settingsId]);
        const updatedSlides = await client.query(`SELECT * FROM agency_hero_slides ORDER BY order_index ASC`);

        res.json({ 
            settings: mapSettingsToClient(updatedSettings.rows[0]), 
            slides: updatedSlides.rows.map(mapSlideToClient) 
        });

    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('Error updating homepage settings:', err.message);
        res.status(500).json({ message: 'Server error updating settings' });
    } finally {
        client.release();
    }
});

export default router;
