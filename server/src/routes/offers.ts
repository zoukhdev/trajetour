import express from 'express';
import { pool, defaultPool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';

import { validate, offerSchema } from '../middleware/validation.js';
import { logAudit } from '../services/auditLog.js';

const router = express.Router();

// Helper to map DB columns to API model
const mapOfferResponse = (row: any) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    destination: row.destination,
    price: parseFloat(row.price),
    startDate: row.start_date,
    endDate: row.end_date,
    hotel: row.hotel,
    transport: row.transport,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    disponibilite: row.capacity, // Map DB capacity to frontend disponibilite
    inclusions: row.inclusions || {},
    roomPricing: row.room_pricing || [],
    agencyId: row.agency_id,
    isFeatured: row.is_featured || false,
    imageUrl: row.image_url
});

// Get all offers (with filters) - PUBLIC
router.get('/',
    // authMiddleware, // Public access for website
    async (req: express.Request, res, next) => {
        try {
            const status = req.query.status as string;
            // Optionally authenticate to read agency filter, since endpoint is public
            // (Assumes auth middleware would set req.user if present, or we check manually)
            const token = req.cookies?.token;
            let authenticatedUser: any = null;
            if (token) {
                const { verifyToken } = await import('../utils/jwt.js');
                try { authenticatedUser = verifyToken(token); } catch (e) { /* ignore */ }
            }

            let query = 'SELECT * FROM offers WHERE 1=1';
            const params: any[] = [];
            let paramIndex = 1;

            if (status) {
                query += ` AND status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            const resolvedAgencyId = authenticatedUser?.agencyId || (req as any).tenantAgencyId;

            if (resolvedAgencyId) {
                query += ` AND agency_id = $${paramIndex}`;
                params.push(resolvedAgencyId);
                paramIndex++;
            }

            query += ' ORDER BY created_at DESC';

            const result = await pool.query(query, params);
            res.json(result.rows.map(mapOfferResponse));
        } catch (error) {
            next(error);
        }
    }
);

// Get single offer
router.get('/:id',
    authMiddleware,
    async (req, res, next) => {
        try {
            const result = await pool.query('SELECT * FROM offers WHERE id = $1', [req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Offer not found' });
            res.json(mapOfferResponse(result.rows[0]));
        } catch (error) {
            next(error);
        }
    }
);

// Create offer
router.post('/',
    authMiddleware,
    requirePermission('manage_business'),
    validate(offerSchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { title, type, destination, price, startDate, endDate, hotel, transport, description, status, disponibilite, inclusions, roomPricing, imageUrl, isFeatured } = req.body;
            const agencyId = req.user!.agencyId;

            // Enforce Subscription Limits for Offers/Packs
            if (agencyId) {
                const agencyRes = await defaultPool.query('SELECT subscription FROM agencies WHERE id = $1', [agencyId]);
                if (agencyRes.rows.length > 0) {
                        const sub = agencyRes.rows[0].subscription || 'Standard';

                    
                    const PLAN_LIMITS: { [key: string]: number } = {
                        'Standard': 30,
                        'Premium': 200,
                        'Gold': 999999
                    };

                    const countRes = await client.query('SELECT COUNT(*) FROM offers WHERE agency_id = $1', [agencyId]);
                    const currentCount = parseInt(countRes.rows[0].count);

                    if (currentCount >= (PLAN_LIMITS[sub] || 30)) {
                        await client.query('ROLLBACK');
                        return res.status(403).json({ 
                            error: `Subscription Limit Reached: Your current ${sub} plan only allows up to ${PLAN_LIMITS[sub]} offers.` 
                        });
                    }
                }
            }

            const queryParams = [
                title, 
                type, 
                destination, 
                price || 0, 
                startDate, 
                endDate, 
                hotel || '', 
                transport || 'Avion', 
                description || '', 
                status || 'Draft', 
                disponibilite || 0, 
                JSON.stringify(inclusions || {}), 
                JSON.stringify(roomPricing || []), 
                agencyId || null, 
                imageUrl || null, 
                isFeatured === true
            ];

            const result = await client.query(
                `INSERT INTO offers (title, type, destination, price, start_date, end_date, hotel, transport, description, status, capacity, inclusions, room_pricing, agency_id, image_url, is_featured)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                 RETURNING *`,
                queryParams
            );
            const newOffer = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'offer',
                entityId: newOffer.id,
                changes: newOffer,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.status(201).json(mapOfferResponse(newOffer));
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error in POST /api/offers:', error);
            res.status(500).json({ 
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            client.release();
        }
    }
);

// Update offer
router.put('/:id',
    authMiddleware,
    requirePermission('manage_business'),
    validate(offerSchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { title, type, destination, price, startDate, endDate, hotel, transport, description, status, disponibilite, inclusions, roomPricing, imageUrl, isFeatured } = req.body;

            const result = await client.query(
                `UPDATE offers 
                 SET title=$1, type=$2, destination=$3, price=$4, start_date=$5, end_date=$6, hotel=$7, transport=$8, description=$9, status=$10, capacity=$11, inclusions=$12, room_pricing=$13, image_url=$14, is_featured=$15
                 WHERE id=$16
                 RETURNING *`,
                [
                    title, 
                    type, 
                    destination, 
                    price, 
                    startDate, 
                    endDate, 
                    hotel, 
                    transport, 
                    description, 
                    status, 
                    disponibilite, 
                    JSON.stringify(inclusions || {}), 
                    JSON.stringify(roomPricing || []), 
                    imageUrl, 
                    isFeatured || false, 
                    req.params.id
                ]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Offer not found' });
            }
            const updatedOffer = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'offer',
                entityId: updatedOffer.id,
                changes: updatedOffer,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json(mapOfferResponse(updatedOffer));
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error in PUT /api/offers/:id:', error);
            res.status(500).json({ 
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            client.release();
        }
    }
);

// Toggle featured status of an offer
router.patch('/:id/featured',
    authMiddleware,
    requirePermission('manage_business'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { isFeatured } = req.body;

            const result = await client.query(
                `UPDATE offers 
                 SET is_featured = $1
                 WHERE id = $2
                 RETURNING *`,
                [isFeatured, req.params.id]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Offer not found' });
            }
            const updatedOffer = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPDATE_FEATURED',
                entityType: 'offer',
                entityId: updatedOffer.id,
                changes: { isFeatured },
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json(mapOfferResponse(updatedOffer));
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error in PATCH /api/offers/:id/featured:', error);
            res.status(500).json({ 
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            client.release();
        }
    }
);

// Upload offer image
router.post('/:id/upload',
    authMiddleware,
    requirePermission('manage_business'),
    async (req, res, next) => {
        try {
            const { upload } = await import('../utils/fileUpload.js');
            const uploadMiddleware = upload.single('image');
            uploadMiddleware(req, res, (err) => {
                if (err) return res.status(400).json({ message: 'File upload failed: ' + err.message });
                next();
            });
        } catch (e) {
            next(e);
        }
    },
    async (req: any, res, next) => {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        
        try {
            const { uploadToCloudinary } = await import('../utils/fileUpload.js');
            const folder = `trajetour/offers/${req.params.id}`;
            const uploadResult = await uploadToCloudinary(req.file.buffer, folder);

            const result = await pool.query(
                'UPDATE offers SET image_url = $1 WHERE id = $2 RETURNING *',
                [uploadResult.secure_url, req.params.id]
            );

            if (result.rows.length === 0) return res.status(404).json({ error: 'Offer not found' });
            
            res.json({ 
                message: 'Image uploaded successfully', 
                imageUrl: uploadResult.secure_url,
                offer: mapOfferResponse(result.rows[0])
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
