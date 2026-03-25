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
        fontFamily: dbSettings.font_family || 'Inter',
        videoUrl: dbSettings.video_url || '',
        secondaryColor: dbSettings.secondary_color || '#10B981',
        borderRadius: dbSettings.border_radius || '8px',
        seoTitle: dbSettings.seo_title || '',
        seoDescription: dbSettings.seo_description || '',
        analyticsGaId: dbSettings.analytics_ga_id || '',
        analyticsFbId: dbSettings.analytics_fb_id || '',
        analyticsTiktokId: dbSettings.analytics_tiktok_id || '',
        ogImageUrl: dbSettings.og_image_url || '',
        testimonials: dbSettings.testimonials || [],
        faqs: dbSettings.faqs || [],
        trustStats: dbSettings.trust_stats || [],
        whatsappNumber: dbSettings.whatsapp_number || '',
        whatsappMessage: dbSettings.whatsapp_message || '',
        newsletterEnabled: dbSettings.newsletter_enabled || false,
        customScripts: dbSettings.custom_scripts || '',
        translations: dbSettings.translations || {},
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

        // Fetch featured offers
        const offersResult = await pool.query(`
            SELECT * FROM offers 
            WHERE status = 'Active' 
            ORDER BY is_featured DESC, created_at DESC 
            LIMIT 6
        `);
        
        // Map offers to client format (similar to what is in offers.ts)
        const featuredOffers = offersResult.rows.map(row => {
            const startDate = new Date(row.start_date);
            const endDate = new Date(row.end_date);
            const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
            
            // Extract some features
            const features = [];
            if (row.hotel) features.push(row.hotel.substring(0, 20));
            if (row.transport) features.push(row.transport.substring(0, 20));
            if (row.capacity > 0) features.push(`${row.capacity} places`);

            return {
                id: row.id,
                title: row.title,
                type: row.type,
                destination: row.destination,
                price: parseFloat(row.price).toLocaleString(),
                duration: row.duration || `${durationDays} jours`,
                rating: 5.0, 
                features: features.slice(0, 3).length > 0 ? features.slice(0, 3) : ['Accompagnement', 'Hôtel inclus', 'Assistance'],
                image: row.image_url || '/kaaba-night.png',
                isFeatured: row.is_featured
            };
        });

        res.json({ settings, slides, featuredOffers });
    } catch (err: any) {
        console.error('Error fetching homepage settings:', err.message);
        res.status(500).json({ message: 'Server error fetching settings' });
    }
});

/**
 * @route   POST /api/settings/upload-logo
 * @desc    Upload agency logo to Cloudinary
 * @access  Private (Admin only)
 */
router.post('/upload-logo', 
    authMiddleware, 
    requirePermission('manage_business'),
    async (req, res, next) => {
        try {
            const { upload } = await import('../utils/fileUpload.js');
            const uploadMiddleware = upload.single('logo');
            uploadMiddleware(req, res, (err) => {
                if (err) return res.status(400).json({ message: 'File upload failed: ' + err.message });
                next();
            });
        } catch (e) {
            next(e);
        }
    },
    async (req: any, res) => {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        try {
            const { uploadToCloudinary } = await import('../utils/fileUpload.js');
            const folder = `trajetour/agencies/${(req as any).tenantAgencyId || 'default'}`;
            const uploadResult = await uploadToCloudinary(req.file.buffer, folder);

            // Update DB
            await pool.query(
                `UPDATE agency_settings SET logo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM agency_settings LIMIT 1)`,
                [uploadResult.secure_url]
            );

            res.json({ 
                message: 'Logo uploaded successfully', 
                logoUrl: uploadResult.secure_url 
            });
        } catch (err: any) {
            console.error('Error uploading logo:', err.message);
            res.status(500).json({ message: 'Error uploading to Cloudinary' });
        }
    }
);

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
                    font_family = $9, video_url = $10, secondary_color = $11, border_radius = $12,
                    seo_title = $13, seo_description = $14, analytics_ga_id = $15, analytics_fb_id = $16,
                    analytics_tiktok_id = $17, og_image_url = $18, testimonials = $19, faqs = $20, 
                    trust_stats = $21, whatsapp_number = $22, whatsapp_message = $23, newsletter_enabled = $24,
                    custom_scripts = $25, translations = $26,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $27
            `, [
                settings.logoUrl || settings.logo_url || null, 
                settings.displayName || settings.display_name || null, 
                settings.slogan || null, 
                settings.primaryColor || settings.primary_color || '#3B82F6', 
                settings.contactEmail || settings.contact_email || null, 
                settings.contactPhone || settings.contact_phone || null, 
                settings.contactAddress || settings.contact_address || null, 
                settings.mapEmbedUrl || settings.map_embed_url || null,
                settings.fontFamily || 'Inter',
                settings.videoUrl || null,
                settings.secondaryColor || '#10B981',
                settings.borderRadius || '8px',
                settings.seoTitle || null,
                settings.seoDescription || null,
                settings.analyticsGaId || null,
                settings.analyticsFbId || null,
                settings.analyticsTiktokId || null,
                settings.ogImageUrl || null,
                JSON.stringify(settings.testimonials || []),
                JSON.stringify(settings.faqs || []),
                JSON.stringify(settings.trustStats || []),
                settings.whatsappNumber || null,
                settings.whatsappMessage || null,
                settings.newsletterEnabled || false,
                settings.customScripts || null,
                JSON.stringify(settings.translations || {}),
                settingsId
            ]);
        } else {
            const insertRes = await client.query(`
                INSERT INTO agency_settings (
                    logo_url, display_name, slogan, primary_color, contact_email, contact_phone, 
                    contact_address, map_embed_url, font_family, video_url, secondary_color, 
                    border_radius, seo_title, seo_description, analytics_ga_id, analytics_fb_id, 
                    analytics_tiktok_id, og_image_url, testimonials, faqs, trust_stats, 
                    whatsapp_number, whatsapp_message, newsletter_enabled, custom_scripts, translations
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
                RETURNING id
            `, [
                settings.logoUrl || settings.logo_url || null, 
                settings.displayName || settings.display_name || null, 
                settings.slogan || null, 
                settings.primaryColor || settings.primary_color || '#3B82F6', 
                settings.contactEmail || settings.contact_email || null, 
                settings.contactPhone || settings.contact_phone || null, 
                settings.contactAddress || settings.contact_address || null, 
                settings.mapEmbedUrl || settings.map_embed_url || null,
                settings.fontFamily || 'Inter',
                settings.videoUrl || null,
                settings.secondaryColor || '#10B981',
                settings.borderRadius || '8px',
                settings.seoTitle || null,
                settings.seoDescription || null,
                settings.analyticsGaId || null,
                settings.analyticsFbId || null,
                settings.analyticsTiktokId || null,
                settings.ogImageUrl || null,
                JSON.stringify(settings.testimonials || []),
                JSON.stringify(settings.faqs || []),
                JSON.stringify(settings.trustStats || []),
                settings.whatsappNumber || null,
                settings.whatsappMessage || null,
                settings.newsletterEnabled || false,
                settings.customScripts || null,
                JSON.stringify(settings.translations || {})
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
