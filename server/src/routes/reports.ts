import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get payment reports
router.get('/payments',
    authMiddleware,
    requirePermission('view_financials'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            const { startDate, endDate, agencyId } = req.query;

            // Date range validation
            const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
            const end = endDate ? new Date(endDate as string) : new Date();

            let agencyFilter = '';
            const params: any[] = [start, end];

            // Agency filter
            if (req.user?.role === 'agent') {
                // Agents can only see their own data
                agencyFilter = 'AND o.agency_id = $3';
                params.push(req.user.agencyId);
            } else if (agencyId) {
                // Admins can filter by specific agency
                agencyFilter = 'AND o.agency_id = $3';
                params.push(agencyId);
            }

            // 1. Overall Summary
            const summaryQuery = `
                SELECT 
                    COUNT(DISTINCT p.id) as total_payments,
                    COUNT(DISTINCT CASE WHEN p.is_validated = true THEN p.id END) as validated_count,
                    COUNT(DISTINCT CASE WHEN p.is_validated IS NULL THEN p.id END) as pending_count,
                    COUNT(DISTINCT CASE WHEN p.is_validated = false THEN p.id END) as rejected_count,
                    COALESCE(SUM(CASE WHEN p.is_validated = true THEN p.amount_dzd END), 0) as total_validated_dzd,
                    COALESCE(SUM(CASE WHEN p.is_validated IS NULL THEN p.amount_dzd END), 0) as total_pending_dzd,
                    COUNT(DISTINCT o.id) as total_orders,
                    COUNT(DISTINCT c.id) as total_clients
                FROM payments p
                JOIN orders o ON p.order_id = o.id
                JOIN clients c ON o.client_id = c.id
                WHERE p.created_at >= $1 AND p.created_at <= $2
                ${agencyFilter}
            `;

            const summaryResult = await client.query(summaryQuery, params);
            const summary = summaryResult.rows[0];

            // 2. Payment Method Breakdown
            const methodQuery = `
                SELECT 
                    p.method,
                    COUNT(*) as count,
                    COALESCE(SUM(CASE WHEN p.is_validated = true THEN p.amount_dzd END), 0) as total_validated,
                    COALESCE(SUM(CASE WHEN p.is_validated IS NULL THEN p.amount_dzd END), 0) as total_pending,
                    COALESCE(SUM(p.amount_dzd), 0) as total_amount
                FROM payments p
                JOIN orders o ON p.order_id = o.id
                WHERE p.created_at >= $1 AND p.created_at <= $2
                ${agencyFilter}
                GROUP BY p.method
                ORDER BY total_amount DESC
            `;

            const methodResult = await client.query(methodQuery, params);

            // 3. Daily Trend (last 30 days or date range)
            const trendQuery = `
                SELECT 
                    DATE(p.created_at) as date,
                    COUNT(*) as payment_count,
                    COALESCE(SUM(CASE WHEN p.is_validated = true THEN p.amount_dzd END), 0) as validated_amount,
                    COALESCE(SUM(CASE WHEN p.is_validated IS NULL THEN p.amount_dzd END), 0) as pending_amount
                FROM payments p
                JOIN orders o ON p.order_id = o.id
                WHERE p.created_at >= $1 AND p.created_at <= $2
                ${agencyFilter}
                GROUP BY DATE(p.created_at)
                ORDER BY date ASC
            `;

            const trendResult = await client.query(trendQuery, params);

            // 4. Top Clients by Payment Volume
            const topClientsQuery = `
                SELECT 
                    c.full_name,
                    c.type,
                    COUNT(DISTINCT p.id) as payment_count,
                    COALESCE(SUM(CASE WHEN p.is_validated = true THEN p.amount_dzd END), 0) as total_paid
                FROM payments p
                JOIN orders o ON p.order_id = o.id
                JOIN clients c ON o.client_id = c.id
                WHERE p.created_at >= $1 AND p.created_at <= $2
                ${agencyFilter}
                GROUP BY c.id, c.full_name, c.type
                ORDER BY total_paid DESC
                LIMIT 10
            `;

            const topClientsResult = await client.query(topClientsQuery, params);

            // 5. If admin, get agency breakdown
            let agencyBreakdown = [];
            if (req.user?.role === 'admin' && !agencyId) {
                const agencyQuery = `
                    SELECT 
                        a.name as agency_name,
                        COUNT(DISTINCT p.id) as payment_count,
                        COALESCE(SUM(CASE WHEN p.is_validated = true THEN p.amount_dzd END), 0) as total_validated
                    FROM payments p
                    JOIN orders o ON p.order_id = o.id
                    LEFT JOIN agencies a ON o.agency_id = a.id
                    WHERE p.created_at >= $1 AND p.created_at <= $2
                    GROUP BY a.id, a.name
                    ORDER BY total_validated DESC
                `;

                const agencyResult = await client.query(agencyQuery, [start, end]);
                agencyBreakdown = agencyResult.rows;
            }

            res.json({
                dateRange: {
                    start: start.toISOString(),
                    end: end.toISOString()
                },
                summary: {
                    totalPayments: parseInt(summary.total_payments),
                    validatedCount: parseInt(summary.validated_count),
                    pendingCount: parseInt(summary.pending_count),
                    rejectedCount: parseInt(summary.rejected_count),
                    totalValidatedDZD: parseFloat(summary.total_validated_dzd),
                    totalPendingDZD: parseFloat(summary.total_pending_dzd),
                    totalOrders: parseInt(summary.total_orders),
                    totalClients: parseInt(summary.total_clients)
                },
                methodBreakdown: methodResult.rows.map(row => ({
                    method: row.method,
                    count: parseInt(row.count),
                    totalValidated: parseFloat(row.total_validated),
                    totalPending: parseFloat(row.total_pending),
                    totalAmount: parseFloat(row.total_amount)
                })),
                dailyTrend: trendResult.rows.map(row => ({
                    date: row.date,
                    paymentCount: parseInt(row.payment_count),
                    validatedAmount: parseFloat(row.validated_amount),
                    pendingAmount: parseFloat(row.pending_amount)
                })),
                topClients: topClientsResult.rows.map(row => ({
                    name: row.full_name,
                    type: row.type,
                    paymentCount: parseInt(row.payment_count),
                    totalPaid: parseFloat(row.total_paid)
                })),
                agencyBreakdown: agencyBreakdown.map((row: any) => ({
                    agencyName: row.agency_name || 'Direct',
                    paymentCount: parseInt(row.payment_count),
                    totalValidated: parseFloat(row.total_validated)
                }))
            });

        } catch (error) {
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
