import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, orderSchema } from '../middleware/validation.js';
import { logAudit } from '../services/auditLog.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateShortId } from '../utils/idGenerator.js';

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
    reference: row.reference,
    clientId: row.client_id,
    agencyId: row.agency_id,
    items: row.items,
    passengers: row.passengers || [],
    hotels: row.hotels || [],
    totalAmount: parseFloat(row.total_amount),
    totalAmountDZD: row.total_amount_dzd ? parseFloat(row.total_amount_dzd) : parseFloat(row.total_amount),
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

            // SECURITY FIX: IDOR Protection - Filter by ownership
            let whereClause = '';
            let countWhereClause = '';
            const params: any[] = [limit, offset];

            if (req.user?.role !== 'admin') {
                // Non-admins only see orders they created or from their agency
                whereClause = 'WHERE (o.created_by = $3 OR o.agency_id = $4)';
                countWhereClause = 'WHERE (created_by = $1 OR agency_id = $2)';
                params.push(req.user?.id, req.user?.agencyId);
            }

            const countResult = await pool.query(
                `SELECT COUNT(*) FROM orders ${countWhereClause}`,
                req.user?.role !== 'admin' ? [req.user?.id, req.user?.agencyId] : []
            );
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
                                    'paymentDate', p.payment_date,
                                    'accountId', p.account_id
                                )
                            ) FILTER (WHERE p.id IS NOT NULL), 
                            '[]'
                        ) as payments
                 FROM orders o
                 LEFT JOIN clients c ON o.client_id = c.id
                 LEFT JOIN payments p ON o.id = p.order_id
                 ${whereClause}
                 GROUP BY o.id, c.full_name, c.mobile_number
                 ORDER BY o.created_at DESC
                 LIMIT $1 OFFSET $2`,
                params
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
    async (req: AuthRequest, res, next) => {
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
                                    'paymentDate', p.payment_date,
                                    'accountId', p.account_id
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

            const orderRow = result.rows[0];

            // SECURITY FIX: IDOR Protection - Check ownership
            if (req.user?.role !== 'admin') {
                // Non-admins can only view orders they created or that belong to their agency
                if (orderRow.created_by !== req.user?.id &&
                    orderRow.agency_id !== req.user?.agencyId) {
                    console.log(`🚫 IDOR attempt blocked: User ${req.user?.id} tried to access order ${req.params.id} owned by ${orderRow.created_by}`);
                    return res.status(403).json({
                        error: 'Unauthorized to access this order'
                    });
                }
            }

            // Fetch related room details for passengers
            let relatedRooms: any[] = [];
            const passengers = orderRow.passengers || [];
            const roomIds = passengers
                .map((p: any) => p.assignedRoomId)
                .filter((id: string) => id); // Filter valid IDs

            if (roomIds.length > 0) {
                const uniqueIds = [...new Set(roomIds)];
                // Create placeholders like $1, $2 for the IN clause
                const placeholders = uniqueIds.map((_, i) => `$${i + 1}`).join(',');
                const roomsQuery = `SELECT id, room_number, hotel_name, gender, price FROM rooms WHERE id IN (${placeholders})`;
                const roomsRes = await pool.query(roomsQuery, uniqueIds);
                relatedRooms = roomsRes.rows;
            }

            // Enrich response
            const response = {
                ...mapOrderResponse(orderRow),
                relatedRooms // Send map or array
            };

            res.json(response);
            return; // Return early since we handled response
        } catch (error) {
            next(error);
        }
    }
);
/*
            res.json(mapOrderResponse(result.rows[0]));
*/

// Create order
router.post('/',
    authMiddleware,
    requirePermission('manage_business'),
    validate(orderSchema),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { clientId, agencyId, items, passengers, hotels, totalAmount, totalAmountDZD, notes } = req.body;

            console.log('📦 Create Order Request:', JSON.stringify({ clientId, agencyId, totalAmount, totalAmountDZD, passengersCount: passengers?.length, hotelCount: hotels?.length }, null, 2));

            // SECURITY FIX: Server-side price calculation
            const calculateOrderTotal = (items: any[]): number => {
                if (!items || !Array.isArray(items)) return 0;
                return items.reduce((sum, item) => {
                    const price = parseFloat(item.price) || 0;
                    const quantity = parseInt(item.quantity) || 1;
                    return sum + (price * quantity);
                }, 0);
            };

            // Calculate expected total from items
            const serverCalculatedTotal = calculateOrderTotal(items);

            // Validate client-provided total matches server calculation  
            // Allow 1 DZD tolerance for rounding
            if (Math.abs(serverCalculatedTotal - totalAmount) > 1) {
                throw new AppError(400,
                    `Price mismatch detected. Server calculated: ${serverCalculatedTotal.toFixed(2)} DZD, Client provided: ${totalAmount.toFixed(2)} DZD`
                );
            }

            console.log(`✅ Price validation passed: ${serverCalculatedTotal.toFixed(2)} DZD`);

            // Validate Room Assignments
            if (passengers && passengers.length > 0) {
                await validateRoomAssignments(client, passengers);
            }

            const reference = generateShortId();

            const result = await client.query(
                `INSERT INTO orders (
                    client_id, agency_id, 
                    items, passengers, hotels, 
                    total_amount, total_amount_dzd, status, created_by, notes, reference
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 RETURNING *`,
                [
                    clientId,
                    agencyId || null,
                    JSON.stringify(items),
                    JSON.stringify(passengers || []),
                    JSON.stringify(hotels || []),
                    totalAmount,
                    totalAmountDZD || totalAmount,
                    'Non payé',
                    req.user!.id,
                    notes,
                    reference
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

            const { items, passengers, hotels, totalAmount, totalAmountDZD, notes, status } = req.body;

            // Validate Room Assignments
            if (passengers && passengers.length > 0) {
                await validateRoomAssignments(client, passengers, req.params.id);
            }

            const result = await client.query(
                `UPDATE orders 
                 SET items = $1, passengers = $2, hotels = $3, 
                     total_amount = $4, total_amount_dzd = $5, notes = $6, status = $7
                 WHERE id = $8
                 RETURNING *`,
                [
                    JSON.stringify(items),
                    JSON.stringify(passengers || []),
                    JSON.stringify(hotels || []),
                    totalAmount,
                    totalAmountDZD || totalAmount,
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


// Delete order (Admin only)
router.delete('/:id',
    authMiddleware,
    requirePermission('admin'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { id } = req.params;

            // Check if order exists
            const checkResult = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
            if (checkResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Order not found' });
            }

            const order = checkResult.rows[0];

            // 1. Get all payments for this order
            const paymentsResult = await client.query('SELECT id FROM payments WHERE order_id = $1', [id]);
            const paymentIds = paymentsResult.rows.map(p => p.id);

            // 2. If there are payments, get associated transactions to revert balances
            if (paymentIds.length > 0) {
                const transactionsResult = await client.query(
                    'SELECT amount, type, account_id FROM transactions WHERE payment_id = ANY($1::uuid[])',
                    [paymentIds]
                );

                // 3. Revert balances for each transaction
                for (const trans of transactionsResult.rows) {
                    if (trans.account_id) {
                        const revertAmount = trans.type === 'IN' ? -parseFloat(trans.amount) : parseFloat(trans.amount);
                        await client.query(
                            'UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2',
                            [revertAmount, trans.account_id]
                        );
                    }
                }

                // 4. Delete associated transactions
                await client.query(
                    'DELETE FROM transactions WHERE payment_id = ANY($1::uuid[])',
                    [paymentIds]
                );
            }

            // 5. Delete related payments (foreign key constraint)
            await client.query('DELETE FROM payments WHERE order_id = $1', [id]);

            // 6. Delete the order
            await client.query('DELETE FROM orders WHERE id = $1', [id]);

            await logAudit(client, {
                userId: req.user!.id,
                action: 'DELETE',
                entityType: 'order',
                entityId: id,
                changes: { deletedOrder: order, deletedPayments: paymentIds.length },
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.json({
                message: 'Order and associated financial records deleted successfully',
                id,
                deletedPayments: paymentIds.length
            });
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
