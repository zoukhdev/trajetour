import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { upload, uploadToCloudinary } from '../utils/fileUpload.js';
import { logAudit } from '../services/auditLog.js';

const router = express.Router();

/**
 * Handle document upload (Passport or Photo) for a passenger within an order
 */
router.post('/:orderId/:passengerId/upload',
    authMiddleware,
    upload.single('file'),
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { orderId, passengerId } = req.params;
            const { type } = req.body; // 'passport' or 'photo'

            if (!req.file) {
                throw new AppError(400, 'No file provided');
            }

            if (!['passport', 'photo'].includes(type)) {
                throw new AppError(400, 'Invalid document type. Must be passport or photo.');
            }

            // 1. Fetch the order
            const orderRes = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
            if (orderRes.rows.length === 0) throw new AppError(404, 'Order not found');
            const order = orderRes.rows[0];

            // 2. Check ownership/permissions
            if (req.user?.role === 'agent' && order.agency_id !== req.user.agencyId) {
                throw new AppError(403, 'Unauthorized: Order does not belong to your agency');
            }

            // 3. Upload to Cloudinary
            const folder = type === 'passport' ? 'trajetour/passports' : 'trajetour/passenger-photos';
            const uploadResult = await uploadToCloudinary(req.file.buffer, folder);

            // 4. Update the passenger in the JSONB array
            const passengers = order.passengers || [];
            const passengerIndex = passengers.findIndex((p: any) => p.id === passengerId);

            if (passengerIndex === -1) {
                throw new AppError(404, 'Passenger not found in this order');
            }

            // Update the specific passenger object
            const docField = type === 'passport' ? 'passportScanUrl' : 'photoUrl';
            passengers[passengerIndex][docField] = uploadResult.secure_url;

            await client.query(
                'UPDATE orders SET passengers = $1 WHERE id = $2',
                [JSON.stringify(passengers), orderId]
            );

            await logAudit(client, {
                userId: req.user!.id,
                action: `UPLOAD_${type.toUpperCase()}`,
                entityType: 'order',
                entityId: orderId,
                changes: { passengerId, [docField]: uploadResult.secure_url },
                ipAddress: req.ip
            });

            await client.query('COMMIT');

            res.status(200).json({
                message: `${type === 'passport' ? 'Passport' : 'Photo'} uploaded successfully`,
                url: uploadResult.secure_url,
                passengerId
            });

        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

/**
 * Update passenger details
 */
router.put('/:orderId/:passengerId',
    authMiddleware,
    async (req: AuthRequest, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { orderId, passengerId } = req.params;
            const updateData = req.body;

            const orderRes = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
            if (orderRes.rows.length === 0) throw new AppError(404, 'Order not found');
            const order = orderRes.rows[0];

            if (req.user?.role === 'agent' && order.agency_id !== req.user.agencyId) {
                throw new AppError(403, 'Unauthorized');
            }

            const passengers = order.passengers || [];
            const idx = passengers.findIndex((p: any) => p.id === passengerId);
            if (idx === -1) throw new AppError(404, 'Passenger not found');

            // Merge updateData
            passengers[idx] = { ...passengers[idx], ...updateData };

            await client.query(
                'UPDATE orders SET passengers = $1 WHERE id = $2',
                [JSON.stringify(passengers), orderId]
            );

            await client.query('COMMIT');
            res.json({ message: 'Passenger updated successfully', passenger: passengers[idx] });

        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
