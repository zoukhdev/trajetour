import express from 'express';
import { pool } from '../config/database.js';
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
    roomPricing: row.room_pricing || []
});

// Get all offers (with filters)
router.get('/',
    authMiddleware,
    async (req: AuthRequest, res, next) => {
        try {
            const status = req.query.status as string;
            let query = 'SELECT * FROM offers';
            const params: any[] = [];

            if (status) {
                query += ' WHERE status = $1';
                params.push(status);
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
            const { title, type, destination, price, startDate, endDate, hotel, transport, description, status, disponibilite, inclusions, roomPricing } = req.body;

            const result = await client.query(
                `INSERT INTO offers (title, type, destination, price, start_date, end_date, hotel, transport, description, status, capacity, inclusions, room_pricing)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 RETURNING *`,
                [title, type, destination, price, startDate, endDate, hotel, transport, description, status || 'Draft', disponibilite || 0, inclusions || {}, JSON.stringify(roomPricing || [])]
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
            next(error);
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
            const { title, type, destination, price, startDate, endDate, hotel, transport, description, status, disponibilite, inclusions, roomPricing } = req.body;

            const result = await client.query(
                `UPDATE offers 
                 SET title=$1, type=$2, destination=$3, price=$4, start_date=$5, end_date=$6, hotel=$7, transport=$8, description=$9, status=$10, capacity=$11, inclusions=$12, room_pricing=$13
                 WHERE id=$14
                 RETURNING *`,
                [title, type, destination, price, startDate, endDate, hotel, transport, description, status, disponibilite, inclusions, JSON.stringify(roomPricing), req.params.id]
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
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
