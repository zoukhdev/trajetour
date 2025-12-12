import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all rooms (with filters)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { offerId, hotelName } = req.query;

        let query = `
            SELECT r.*,
            (
                SELECT COUNT(*)
                FROM orders o, jsonb_array_elements(o.passengers) p
                WHERE (p->>'assignedRoomId')::uuid = r.id
                AND o.status != 'Cancelled'
            ) as occupied_count
            FROM rooms r
            WHERE r.status = 'ACTIVE'
        `;
        const params: any[] = [];

        if (offerId) {
            params.push(offerId);
            query += ` AND r.offer_id = $${params.length}`;
        }

        if (hotelName) {
            params.push(hotelName);
            query += ` AND r.hotel_name = $${params.length}`;
        }

        query += ` ORDER BY r.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ message: 'Error fetching rooms' });
    }
});

// Create a new room
router.post('/', authMiddleware, requireRole('staff'), async (req, res) => {
    try {
        const { offerId, hotelName, roomNumber, capacity, gender, price, pricing } = req.body;

        const result = await pool.query(
            `INSERT INTO rooms (offer_id, hotel_name, room_number, capacity, gender, price, pricing)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                offerId || null,
                hotelName,
                roomNumber,
                capacity,
                gender,
                price || 0,
                pricing ? JSON.stringify(pricing) : JSON.stringify({ adult: price || 0, child: 0, infant: 0 })
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error('Error creating room:', error);
        res.status(500).json({ message: 'Error creating room', error: error.message });
    }
});

// Update a room
router.put('/:id', authMiddleware, requireRole('staff'), async (req, res) => {
    try {
        const { id } = req.params;
        const { roomNumber, capacity, gender, status, price, pricing } = req.body;

        const result = await pool.query(
            `UPDATE rooms 
             SET room_number = COALESCE($1, room_number),
                 capacity = COALESCE($2, capacity),
                 gender = COALESCE($3, gender),
                 status = COALESCE($4, status),
                 price = COALESCE($5, price),
                 pricing = COALESCE($6::jsonb, pricing)
             WHERE id = $7
             RETURNING *`,
            [roomNumber, capacity, gender, status, price, pricing ? JSON.stringify(pricing) : null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Error updating room:', error);
        res.status(500).json({ message: 'Error updating room', error: error.message });
    }
});

// Delete a room (Soft Delete)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE rooms SET status = 'OUT_OF_SERVICE' WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json({ message: 'Room marked as out of service' });
    } catch (error: any) {
        console.error('Error deleting room:', error);
        res.status(500).json({ message: 'Error deleting room' });
    }
});

// Debug Route
router.get('/debug-check', async (req, res) => {
    const client = await pool.connect();
    try {
        const dbVersion = await client.query('SELECT version()');
        const tableCheck = await client.query("SELECT to_regclass('public.rooms')");
        const columns = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'rooms'");

        let insertError = null;
        try {
            await client.query('BEGIN');
            // Try inserting a dummy room to see if it fails (e.g. UUID issue)
            await client.query(`
                INSERT INTO rooms (id, offer_id, hotel_name, room_number, capacity, gender, status)
                VALUES ('00000000-0000-0000-0000-000000000000', NULL, 'Debug Hotel', '999', 4, 'MIXED', 'ACTIVE')
            `);
            await client.query('ROLLBACK');
        } catch (err: any) {
            await client.query('ROLLBACK');
            insertError = err.message;
        }

        res.json({
            status: 'Diagnostic',
            version: dbVersion.rows[0].version,
            tableExists: !!tableCheck.rows[0].to_regclass,
            columns: columns.rows,
            insertTestError: insertError || 'None (Insert Test Passed)'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Get occupants for a specific room
router.get('/:id/occupants', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                p->>'firstName' as first_name,
                p->>'lastName' as last_name,
                p->>'passportNumber' as passport_number,
                p->>'gender' as gender,
                p->>'id' as passenger_id,
                o.id as order_id
            FROM orders o, jsonb_array_elements(o.passengers) p
            WHERE (p->>'assignedRoomId')::uuid = $1
            AND o.status != 'Cancelled'
        `;

        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching occupants:', error);
        res.status(500).json({ message: 'Error fetching occupants' });
    }
});

// Transfer passenger to another room
router.post('/transfer', authMiddleware, requireRole('staff'), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { orderId, passengerId, newRoomId } = req.body;

        // 1. Get Order
        const orderRes = await client.query('SELECT passengers FROM orders WHERE id = $1', [orderId]);
        if (orderRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Order not found' });
        }

        let passengers = orderRes.rows[0].passengers;
        const passengerIndex = passengers.findIndex((p: any) => p.id === passengerId);

        if (passengerIndex === -1) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Passenger not found in order' });
        }

        // 2. Check New Room Capacity
        if (newRoomId) {
            const roomRes = await client.query('SELECT capacity, room_number FROM rooms WHERE id = $1', [newRoomId]);
            if (roomRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Target room not found' });
            }
            const room = roomRes.rows[0];

            const occupancyRes = await client.query(`
                SELECT COUNT(*) 
                FROM orders o, jsonb_array_elements(o.passengers) p
                WHERE (p->>'assignedRoomId')::uuid = $1
                AND o.status != 'Cancelled'
            `, [newRoomId]);

            const currentOccupied = parseInt(occupancyRes.rows[0].count);
            // Note: If we are just moving someone IN, we check capacity. 
            // If they were already in this room (idempotent), count is included.
            // But usually we transfer FROM one TO another.
            // We should check if currentOccupied < capacity.

            if (currentOccupied >= room.capacity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: `Room ${room.room_number} is full` });
            }
        }

        // 3. Update Passenger
        passengers[passengerIndex].assignedRoomId = newRoomId;

        // 4. Save Order
        await client.query('UPDATE orders SET passengers = $1 WHERE id = $2', [JSON.stringify(passengers), orderId]);

        await client.query('COMMIT');
        res.json({ message: 'Transfer successful' });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error transferring passenger:', error);
        res.status(500).json({ message: 'Error transferring passenger' });
    } finally {
        client.release();
    }
});

export default router;
