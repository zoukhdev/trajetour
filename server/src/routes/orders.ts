import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, orderSchema } from '../middleware/validation.js';
import { logAudit } from '../services/auditLog.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Helper Validation Function
const validateRoomAssignments = async (client: any, passengers: any[], ignoreOrderId?: string) => {
    const roomCounts: Record<string, number> = {};
    const passengerGenders: Record<string, string[]> = {};

    for (const p of passengers) {
        if (p.assignedRoomId) {
            roomCounts[p.assignedRoomId] = (roomCounts[p.assignedRoomId] || 0) + 1;
            if (p.gender) {
                if (!passengerGenders[p.assignedRoomId]) passengerGenders[p.assignedRoomId] = [];
                passengerGenders[p.assignedRoomId].push(p.gender);
            }
        }
    }

    for (const [roomId, count] of Object.entries(roomCounts)) {
        // Fetch room details
        const roomRes = await client.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
        if (roomRes.rows.length === 0) throw new AppError(400, `Room ID ${roomId} not found`);
        const room = roomRes.rows[0];

        if (room.status !== 'ACTIVE') throw new AppError(400, `Room ${room.room_number} is not active`);

        // Gender Check
        // Passenger gender: 'Homme' | 'Femme'
        // Room gender: 'MEN' | 'WOMEN' | 'MIXED'
        const genders = passengerGenders[roomId] || [];
        for (const g of genders) {
            if (room.gender === 'MEN' && g === 'Femme') {
                throw new AppError(400, `Room ${room.room_number} is MEN only, but passenger is Femme`);
            }
            if (room.gender === 'WOMEN' && g === 'Homme') {
                throw new AppError(400, `Room ${room.room_number} is WOMEN only, but passenger is Homme`);
            }
        }

        // Capacity Check
        let query = `
            SELECT COUNT(*) 
            FROM orders o, jsonb_array_elements(o.passengers) p
            WHERE (p->>'assignedRoomId')::uuid = $1
            AND o.status != 'Cancelled'
        `;
        const params: any[] = [roomId];
        if (ignoreOrderId) {
            query += ` AND o.id != $2`;
            params.push(ignoreOrderId);
        }

        const occupancyRes = await client.query(query, params);
        const currentOccupied = parseInt(occupancyRes.rows[0].count);

        if (currentOccupied + count > room.capacity) {
            throw new AppError(400, `Room ${room.room_number} is full. Capacity: ${room.capacity}, Occupied: ${currentOccupied}, New: ${count}`);
        }
    }
};

// Helper to map DB columns (snake_case) to API model (camelCase)
const mapOrderResponse = (row: any) => ({
    id: row.id,
    clientId: row.client_id,
    agencyId: row.agency_id,
    items: row.items,
    passengers: row.passengers || [],
    hotels: row.hotels || [],
    totalAmount: parseFloat(row.total_amount),
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.created_by,
    notes: row.notes,
    // Fields from joins
    clientName: row.client_name,
    clientMobile: row.client_mobile,
    payments: row.payments || []
});

// Get all orders with pagination and related data
router.get('/',
    authMiddleware,
    requirePermission('manage_business'),
    async (req: AuthRequest, res, next) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const countResult = await pool.query('SELECT COUNT(*) FROM orders');
            const total = parseInt(countResult.rows[0].count);

            const result = await pool.query(
                `SELECT o.*, 
                        c.full_name as client_name,
                        c.mobile_number as client_mobile,
                        COALESCE(
                            json_agg(
                                json_build_object(
                                    'id', p.id,
                                    'amount', p.amount::float8,
                                    'currency', p.currency,
                                    'amountDZD', p.amount_dzd::float8,
                                    'exchangeRateUsed', p.exchange_rate::float8,
                                    'method', p.method,
                                    'isValidated', p.is_validated,
                                    'paymentDate', p.payment_date
                                )
                            ) FILTER (WHERE p.id IS NOT NULL), 
                            '[]'
                        ) as payments
                 FROM orders o
                 LEFT JOIN clients c ON o.client_id = c.id
                 LEFT JOIN payments p ON o.id = p.order_id
                 GROUP BY o.id, c.full_name, c.mobile_number
                 ORDER BY o.created_at DESC
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );

            res.json({
                data: result.rows.map(mapOrderResponse),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get single order
router.get('/:id',
    authMiddleware,
    requirePermission('manage_business'),
    async (req, res, next) => {
        try {
            const result = await pool.query(
                `SELECT o.*, 
                        c.full_name as client_name,
                        COALESCE(
                            json_agg(
                                json_build_object(
                                    'id', p.id,
                                    'amount', p.amount::float8,
                                    'currency', p.currency,
                                    'amountDZD', p.amount_dzd::float8,
                                    'exchangeRateUsed', p.exchange_rate::float8,
                                    'method', p.method,
                                    'isValidated', p.is_validated,
                                    'paymentDate', p.payment_date
                                )
                            ) FILTER (WHERE p.id IS NOT NULL), 
                            '[]'
                        ) as payments
                 FROM orders o
                 LEFT JOIN clients c ON o.client_id = c.id
                 LEFT JOIN payments p ON o.id = p.order_id
                 WHERE o.id = $1
                 GROUP BY o.id, c.full_name`,
                [req.params.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }

            res.json(mapOrderResponse(result.rows[0]));
        } catch (error) {
            next(error);
        }
    }
);

// Create order
router.post('/',
    authMiddleware,
    requirePermission('manage_business'),
    validate(orderSchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { clientId, agencyId, items, passengers, hotels, totalAmount, notes } = req.body;

            console.log('📦 Create Order Request:', JSON.stringify({ clientId, agencyId, totalAmount, passengersCount: passengers?.length, hotelCount: hotels?.length }, null, 2));

            // Validate Room Assignments
            if (passengers && passengers.length > 0) {
                await validateRoomAssignments(client, passengers);
            }

            const result = await client.query(
                `INSERT INTO orders (
                    client_id, agency_id, 
                    items, passengers, hotels, 
                    total_amount, status, created_by, notes
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [
                    clientId,
                    agencyId || null,
                    JSON.stringify(items),
                    JSON.stringify(passengers || []),
                    JSON.stringify(hotels || []),
                    totalAmount,
                    'Non payé',
                    req.user!.id,
                    notes
                ]
            );

            const order = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'order',
                entityId: order.id,
                changes: order,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.status(201).json(mapOrderResponse(order));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

// Update order
router.put('/:id',
    authMiddleware,
    requirePermission('manage_business'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { items, passengers, hotels, totalAmount, notes, status } = req.body;

            // Validate Room Assignments
            if (passengers && passengers.length > 0) {
                await validateRoomAssignments(client, passengers, req.params.id);
            }

            const result = await client.query(
                `UPDATE orders 
                 SET items = $1, passengers = $2, hotels = $3, 
                     total_amount = $4, notes = $5, status = $6
                 WHERE id = $7
                 RETURNING *`,
                [
                    JSON.stringify(items),
                    JSON.stringify(passengers || []),
                    JSON.stringify(hotels || []),
                    totalAmount,
                    notes,
                    status,
                    req.params.id
                ]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Order not found' });
            }

            const order = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'order',
                entityId: order.id,
                changes: order,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json(mapOrderResponse(order));
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
