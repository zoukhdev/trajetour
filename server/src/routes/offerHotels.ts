import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all rooms assigned to an offer (with full room details and pricing)
router.get('/:offerId/hotels',
    authMiddleware,
    async (req: AuthRequest, res, next) => {
        try {
            const { offerId } = req.params;

            const result = await pool.query(
                `SELECT 
                    oh.id as assignment_id,
                    oh.offer_id,
                    r.id as room_id,
                    r.hotel_name,
                    r.room_number,
                    r.capacity,
                    r.gender,
                    r.price,
                    r.pricing
                 FROM offer_hotels oh
                 JOIN rooms r ON oh.room_id = r.id
                 WHERE oh.offer_id = $1
                 ORDER BY r.hotel_name, r.room_number ASC`,
                [offerId]
            );

            // Transform to include parsed pricing
            const hotels = result.rows.map(row => ({
                id: row.assignment_id,
                room_id: row.room_id,
                hotel_name: row.hotel_name,
                room_number: row.room_number,
                capacity: row.capacity,
                gender: row.gender,
                price: parseFloat(row.price),
                infant_price: row.pricing?.infant || 0,
                child_price: row.pricing?.child || 0,
                adult_price: row.pricing?.adult || parseFloat(row.price) || 0
            }));

            res.json({ hotels });
        } catch (error) {
            next(error);
        }
    }
);

// Assign a room to an offer
router.post('/:offerId/hotels',
    authMiddleware,
    requirePermission('manage_business'),
    async (req: AuthRequest, res, next) => {
        try {
            const { offerId } = req.params;
            const { room_id } = req.body;

            if (!room_id) {
                return res.status(400).json({ error: 'room_id is required' });
            }

            // Check if room exists
            const roomCheck = await pool.query('SELECT id FROM rooms WHERE id = $1', [room_id]);
            if (roomCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Room not found' });
            }

            // Check if already assigned
            const existingCheck = await pool.query(
                'SELECT id FROM offer_hotels WHERE offer_id = $1 AND room_id = $2',
                [offerId, room_id]
            );

            if (existingCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Room already assigned to this offer' });
            }

            // Assign room to offer
            const result = await pool.query(
                `INSERT INTO offer_hotels (offer_id, room_id)
                 VALUES ($1, $2)
                 RETURNING id`,
                [offerId, room_id]
            );

            res.status(201).json({
                id: result.rows[0].id,
                message: 'Room assigned to offer successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

// Remove room assignment from offer
router.delete('/hotels/:assignmentId',
    authMiddleware,
    requirePermission('manage_business'),
    async (req: AuthRequest, res, next) => {
        try {
            const { assignmentId } = req.params;

            const result = await pool.query(
                'DELETE FROM offer_hotels WHERE id = $1 RETURNING id',
                [assignmentId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Assignment not found' });
            }

            res.json({ message: 'Room unassigned from offer successfully' });
        } catch (error) {
            next(error);
        }
    }
);

// Get available rooms (not yet assigned to this offer)
router.get('/:offerId/available-rooms',
    authMiddleware,
    async (req: AuthRequest, res, next) => {
        try {
            const { offerId } = req.params;
            console.log(`[DEBUG] Fetching available rooms for Offer: ${offerId}`);

            // 1. Get raw count (Debug)
            const countAll = await pool.query('SELECT COUNT(*) FROM rooms');
            // 2. Get active count (Debug) - using robust status check
            const countActive = await pool.query("SELECT COUNT(*) FROM rooms WHERE (status IS NULL OR UPPER(status) = 'ACTIVE' OR status = '')");

            console.log(`[DEBUG] Diagnostic: Total Rooms in DB: ${countAll.rows[0].count}, Active (Relaxed): ${countActive.rows[0].count}`);

            const result = await pool.query(
                `SELECT 
                    r.id,
                    r.hotel_name,
                    r.room_number,
                    r.capacity,
                    r.gender,
                    r.price,
                    r.pricing,
                    r.status
                 FROM rooms r
                 WHERE (r.status IS NULL OR UPPER(r.status) = 'ACTIVE' OR r.status = '')
                 AND r.id NOT IN (
                     SELECT room_id FROM offer_hotels WHERE offer_id = $1
                 )
                 ORDER BY r.hotel_name, r.room_number ASC`,
                [offerId]
            );

            const rooms = result.rows.map(row => ({
                id: row.id,
                hotel_name: row.hotel_name,
                room_number: row.room_number,
                capacity: row.capacity,
                gender: row.gender,
                price: parseFloat(row.price),
                infant_price: row.pricing?.infant || 0,
                child_price: row.pricing?.child || 0,
                adult_price: row.pricing?.adult || parseFloat(row.price) || 0
            }));

            // Pass debug info to client
            res.json({
                rooms,
                debug: {
                    totalInDb: parseInt(countAll.rows[0].count),
                    activeInDb: parseInt(countActive.rows[0].count),
                    foundAvailable: rooms.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
