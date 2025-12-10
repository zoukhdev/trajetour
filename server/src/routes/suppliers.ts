import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { z } from 'zod'; // Assuming zod is used, or manual validation

const router = express.Router();

const supplierSchema = z.object({
    name: z.string().min(1),
    contact_person: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    service_type: z.string().optional()
});

// GET /api/suppliers
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM suppliers ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// POST /api/suppliers
router.post('/', authMiddleware, requirePermission('admin'), async (req, res, next) => {
    try {
        const { name, contact_person, phone, email, address, service_type } = req.body;
        // Simple validation or zod
        if (!name) return res.status(400).json({ error: "Name is required" });

        const result = await pool.query(
            `INSERT INTO suppliers (name, contact_person, phone, email, address, service_type)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [name, contact_person, phone, email, address, service_type]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// PUT /api/suppliers/:id
router.put('/:id', authMiddleware, requirePermission('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, contact_person, phone, email, address, service_type } = req.body;

        const result = await pool.query(
            `UPDATE suppliers
             SET name = $1, contact_person = $2, phone = $3, email = $4, address = $5, service_type = $6
             WHERE id = $7
             RETURNING *`,
            [name, contact_person, phone, email, address, service_type, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: "Supplier not found" });
        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/suppliers/:id
router.delete('/:id', authMiddleware, requirePermission('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Supplier not found" });
        res.status(200).json({ message: "Supplier deleted" });
    } catch (error) {
        next(error);
    }
});

export default router;
