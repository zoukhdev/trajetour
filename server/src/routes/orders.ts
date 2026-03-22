import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';
import { validate, orderSchema } from '../middleware/validation.js';
import { logAudit } from '../services/auditLog.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateShortId } from '../utils/idGenerator.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

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

// Get all orders with pagination and role-based filtering
router.get('/',
    authMiddleware,
    async (req: AuthRequest, res, next) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const { clientId: queryClientId, agencyId: queryAgencyId } = req.query;

            let filterClause = 'WHERE 1=1';
            const params: any[] = [];

            // Role-based automatic filtering
            const resolvedAgencyId = req.user?.agencyId || (req as any).tenantAgencyId;

            if (resolvedAgencyId) {
                // If user belongs to an agency (via token OR tenant context), strictly enforce scope
                filterClause += ` AND o.agency_id = $${params.length + 1}`;
                params.push(resolvedAgencyId);
            } else if (req.user?.role === 'client') {
                filterClause += ` AND o.client_id = $${params.length + 1}`;
                params.push(req.user.clientId);
            } else if (req.user?.role === 'admin' || req.user?.role === 'staff' || req.user?.permissions.includes('manage_business')) {
                // Admin/Staff/Business Managers with no agency context can filter freely for dashboard operations
                if (queryClientId) {
                    filterClause += ` AND o.client_id = $${params.length + 1}`;
                    params.push(queryClientId);
                }
                if (queryAgencyId) {
                    filterClause += ` AND o.agency_id = $${params.length + 1}`;
                    params.push(queryAgencyId);
                }
            } else {
                // Other roles might need specific filters or manage_business permission
                return res.status(403).json({ error: 'Insufficient permissions to view orders' });
            }

            // Get total count for pagination
            const countResult = await pool.query(`SELECT COUNT(*) FROM orders o ${filterClause}`, params);
            const total = parseInt(countResult.rows[0].count);

            // Add pagination params
            params.push(limit);
            params.push(offset);

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
                 ${filterClause}
                 GROUP BY o.id, c.full_name, c.mobile_number
                 ORDER BY o.created_at DESC
                 LIMIT $${params.length - 1} OFFSET $${params.length}`,
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

// Get orders with missing documents (for agency document tracking) - MUST BE BEFORE /:id route
router.get('/missing-documents',
    authMiddleware,
    async (req: AuthRequest, res, next) => {
        try {
            let filterClause = 'WHERE 1=1';
            const params: any[] = [];

            // Role-based filtering
            if (req.user?.agencyId) {
                filterClause += ` AND o.agency_id = $${params.length + 1}`;
                params.push(req.user.agencyId);
            } else if (req.user?.role !== 'admin' && req.user?.role !== 'staff') {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Only get active orders (not cancelled)
            filterClause += ` AND o.status NOT IN ('Cancelled', 'Completed')`;

            const result = await pool.query(
                `SELECT 
                    o.id,
                    o.reference,
                    o.client_id,
                    o.passengers,
                    o.items,
                    o.created_at,
                    c.full_name as client_name,
                    c.mobile_number as client_mobile
                 FROM orders o
                 LEFT JOIN clients c ON o.client_id = c.id
                 ${filterClause}
                 ORDER BY o.created_at DESC`,
                params
            );

            // Process orders to find missing documents
            const ordersWithMissingDocs = result.rows
                .map(order => {
                    const passengers = order.passengers || [];
                    const items = order.items || [];

                    // Find package start date from items
                    let departureDate = null;
                    if (items.length > 0 && items[0].start_date) {
                        departureDate = new Date(items[0].start_date);
                    }

                    // Calculate days until departure
                    let daysUntilDeparture = null;
                    if (departureDate) {
                        const today = new Date();
                        const diffTime = departureDate.getTime() - today.getTime();
                        daysUntilDeparture = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }

                    // Check for missing documents
                    const missingDocs: string[] = [];

                    for (const passenger of passengers) {
                        // Check which documents are missing
                        if (!passenger.passportNumber || passenger.passportNumber === '') {
                            if (!missingDocs.includes('passport')) missingDocs.push('passport');
                        }
                        if (!passenger.photoUrl || passenger.photoUrl === '') {
                            if (!missingDocs.includes('photo')) missingDocs.push('photo');
                        }

                    }

                    return {
                        id: order.id,
                        reference: order.reference,
                        clientName: order.client_name,
                        clientMobile: order.client_mobile,
                        passengerCount: passengers.length,
                        missingDocuments: missingDocs,
                        daysUntilDeparture,
                        departureDate,
                        createdAt: order.created_at
                    };
                })
                .filter(order => order.missingDocuments.length > 0); // Only return orders with missing docs

            res.json({ orders: ordersWithMissingDocs });
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

            // All authenticated users can view any order (removed IDOR check per business requirement)

            // Fetch related room details for passengers
            let relatedRooms: any[] = [];
            let passengers = orderRow.passengers || [];
            // Ensure all passengers have IDs (for backward compatibility with old data)
            const hasMissingIds = (passengers || []).some((p: any) => !p.id);
            if (hasMissingIds) {
                const enrichedPassengers = (passengers || []).map((p: any) => ({ ...p, id: p.id || crypto.randomUUID() }));
                // Persist back to DB immediately so document uploads work
                await pool.query('UPDATE orders SET passengers = $1 WHERE id = $2', [JSON.stringify(enrichedPassengers), req.params.id]);
                passengers = enrichedPassengers;
            }
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
                passengers, // Use enriched passengers with IDs
                relatedRooms
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

            const { clientId, agencyId, items, passengers, hotels, totalAmount, totalAmountDZD, notes, offerId } = req.body;

            console.log('📦 Create Order Request:', JSON.stringify({ clientId, agencyId, offerId, passengersCount: passengers?.length }, null, 2));

            let serverCalculatedTotal = 0;
            let enrichedPassengers = passengers || [];

            // NEW: Hotel-based age pricing calculation
            if (offerId && passengers && passengers.length > 0) {
                // Import age calculation utilities
                const { enrichPassengersWithPricing, calculateOrderTotal } = await import('../utils/ageCalculation.js');

                // Fetch offer hotels with pricing from linked rooms
                const hotelsResult = await client.query(
                    `SELECT 
                        r.price,
                        r.pricing
                     FROM offer_hotels oh
                     JOIN rooms r ON oh.room_id = r.id
                     WHERE oh.offer_id = $1`,
                    [offerId]
                );

                // Map results to flat format expected by calculation utils
                const offerHotels = hotelsResult.rows.map(row => ({
                    infant_price: row.pricing?.infant || 0,
                    child_price: row.pricing?.child || 0,
                    adult_price: row.pricing?.adult || parseFloat(row.price) || 0
                }));

                if (offerHotels.length > 0) {
                    // Calculate prices based on passenger ages
                    enrichedPassengers = enrichPassengersWithPricing(passengers, offerHotels);
                    serverCalculatedTotal = calculateOrderTotal(passengers, offerHotels);

                    console.log('✅ Using hotel-based age pricing (from rooming list)');
                    console.log(`📊 Price breakdown: ${enrichedPassengers.map((p: any) => `${p.name} (${p.age_category}): ${p.price} DA`).join(', ')}`);
                } else {
                    // Fallback to items pricing if no hotels assigned
                    console.log('⚠️ No hotels assigned to offer, using items pricing');
                    const calculateItemsTotal = (items: any[]): number => {
                        if (!items || !Array.isArray(items)) return 0;
                        return items.reduce((sum, item) => {
                            const price = parseFloat(item.unitPrice || item.price) || 0;
                            const quantity = parseInt(item.quantity) || 1;
                            return sum + (price * quantity);
                        }, 0);
                    };
                    serverCalculatedTotal = calculateItemsTotal(items);
                }
            } else {
                // Legacy: Calculate from items if no offerId or passengers
                const calculateItemsTotal = (items: any[]): number => {
                    if (!items || !Array.isArray(items)) return 0;
                    return items.reduce((sum, item) => {
                        const price = parseFloat(item.unitPrice || item.price) || 0;
                        const quantity = parseInt(item.quantity) || 1;
                        return sum + (price * quantity);
                    }, 0);
                };
                serverCalculatedTotal = calculateItemsTotal(items);
            }

            // Validate client-provided total matches server calculation  
            // Allow 1 DZD tolerance for rounding
            if (totalAmount && Math.abs(serverCalculatedTotal - totalAmount) > 1) {
                throw new AppError(400,
                    `Price mismatch detected. Server calculated: ${serverCalculatedTotal.toFixed(2)} DZD, Client provided: ${totalAmount.toFixed(2)} DZD`
                );
            }

            console.log(`✅ Price validation passed: ${serverCalculatedTotal.toFixed(2)} DZD`);

            // Assign unique IDs to all passengers if they don't have one
            enrichedPassengers = enrichedPassengers.map((p: any) => ({
                ...p,
                id: p.id || crypto.randomUUID()
            }));

            // Validate Room Assignments
            if (enrichedPassengers && enrichedPassengers.length > 0) {
                await validateRoomAssignments(client, enrichedPassengers);
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
                    JSON.stringify(enrichedPassengers),
                    JSON.stringify(hotels || []),
                    serverCalculatedTotal, // Use server-calculated total
                    totalAmountDZD || serverCalculatedTotal,
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

            // Email Notification: "New Booking Confirmed"
            if (process.env.RESEND_API_KEY) {
                try {
                    // Fetch client email and agency name
                    const emailRes = await client.query(`
                        SELECT u.email, c.full_name as client_name, (SELECT name FROM agencies LIMIT 1) as agency_name
                        FROM clients c
                        LEFT JOIN users u ON c.user_id = u.id
                        WHERE c.id = $1
                    `, [clientId]);

                    const clientInfo = emailRes.rows[0];

                    if (clientInfo && clientInfo.email) {
                        const agencyName = clientInfo.agency_name || 'Votre Agence de Voyage';
                        
                        await resend.emails.send({
                            from: `${agencyName} <hello@trajetour.com>`,
                            to: [clientInfo.email],
                            subject: `✅ Confirmation de votre réservation - ${reference}`,
                            html: `
                                <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                                    <div style="text-align: center; margin-bottom: 20px;">
                                        <h2 style="color: #2563EB; margin-bottom: 5px;">Réservation Confirmée !</h2>
                                        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Référence: <strong>${reference}</strong></p>
                                    </div>
                                    <p>Bonjour <strong>${clientInfo.client_name}</strong>,</p>
                                    <p>Nous vous remercions pour votre confiance. Votre réservation avec <strong>${agencyName}</strong> a été enregistrée avec succès.</p>
                                    
                                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                                        <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">Détails de la réservation</h3>
                                        <table style="width: 100%; font-size: 14px;">
                                            <tr>
                                                <td style="padding: 4px 0; color: #475569;">Total du séjour :</td>
                                                <td style="padding: 4px 0; text-align: right; font-weight: bold;">${serverCalculatedTotal.toFixed(2)} DZD</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #475569;">Statut :</td>
                                                <td style="padding: 4px 0; text-align: right;"><span style="color: #d97706; font-weight: bold;">Non payé</span></td>
                                            </tr>
                                        </table>
                                    </div>
                                    
                                    <p style="font-size: 14px; color: #475569; line-height: 1.5;">Veuillez noter que le paiement doit être effectué selon les termes convenus pour finaliser et valider complétement cette réservation.</p>
                                    
                                    <div style="text-align: center; margin-top: 30px; pt-4; border-top: 1px solid #eee;">
                                        <p style="font-size: 13px; color: #94a3b8;">Ce message est généré automatiquement par <a href="https://trajetour.com" style="color: #2563EB; text-decoration: none;">Trajetour</a> pour <strong>${agencyName}</strong>.</p>
                                    </div>
                                </div>
                            `
                        });
                        console.log(`✅ Booking confirmation email sent to ${clientInfo.email}`);
                    }
                } catch (emailErr) {
                    console.error('Failed to send booking confirmation email:', emailErr);
                    // Do not fail the transaction if email fails
                }
            }

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

            // Assign unique IDs to passengers if they don't have one
            const enrichedPassengers = (passengers || []).map((p: any) => ({
                ...p,
                id: p.id || crypto.randomUUID()
            }));

            // Validate Room Assignments
            if (enrichedPassengers && enrichedPassengers.length > 0) {
                await validateRoomAssignments(client, enrichedPassengers, req.params.id);
            }

            const result = await client.query(
                `UPDATE orders 
                 SET items = $1, passengers = $2, hotels = $3, 
                     total_amount = $4, total_amount_dzd = $5, notes = $6, status = $7
                 WHERE id = $8
                 RETURNING *`,
                [
                    JSON.stringify(items),
                    JSON.stringify(enrichedPassengers),
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
