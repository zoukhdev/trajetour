import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { validateContractDetails, supplierContractSchema } from '../middleware/contractValidation.js';

const router = express.Router();

// POST /api/suppliers/:id/contracts - Create new contract for supplier
router.post('/:supplierId/contracts', authMiddleware, requirePermission('admin'), async (req, res, next) => {
    try {
        // Validate request body
        const validatedData = supplierContractSchema.parse({
            ...req.body,
            supplierId: req.params.supplierId
        });

        const { supplierId, contractType, datePurchased, contractValue, paymentCurrency, exchangeRate, details, notes } = validatedData;

        // Validate JSONB details based on contract type
        const validatedDetails = validateContractDetails(contractType, details);

        // Calculate DZD value
        const contractValueDzd = contractValue * exchangeRate;

        // Insert contract
        const contractResult = await pool.query(
            `INSERT INTO supplier_contracts 
             (supplier_id, contract_type, date_purchased, contract_value, payment_currency, exchange_rate, contract_value_dzd, details, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                supplierId,
                contractType,
                datePurchased || new Date().toISOString().split('T')[0],
                contractValue,
                paymentCurrency,
                exchangeRate,
                contractValueDzd,
                JSON.stringify(validatedDetails),
                notes || null
            ]
        );

        const newContract = contractResult.rows[0];

        // Auto-create expense transaction if accountId provided
        if (validatedData.accountId) {
            // Get supplier name for transaction description
            const supplierResult = await pool.query('SELECT name FROM suppliers WHERE id = $1', [supplierId]);
            const supplierName = supplierResult.rows[0]?.name || 'Unknown Supplier';

            await pool.query(
                `INSERT INTO transactions 
                 (type, amount, currency, amount_dzd, source, reference_id, description, transaction_date, account_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    'OUT',
                    contractValue,
                    paymentCurrency,
                    contractValueDzd,
                    'Expense',
                    newContract.id,
                    `Supplier Contract: ${contractType} - ${supplierName}`,
                    datePurchased || new Date().toISOString().split('T')[0],
                    validatedData.accountId
                ]
            );
        }

        res.status(201).json(newContract);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        next(error);
    }
});

// GET /api/suppliers/:id/contracts - Get all contracts for a supplier
router.get('/:supplierId/contracts', authMiddleware, async (req, res, next) => {
    try {
        const { supplierId } = req.params;
        const { type } = req.query;

        let query = 'SELECT * FROM supplier_contracts WHERE supplier_id = $1';
        const params: any[] = [supplierId];

        if (type) {
            query += ' AND contract_type = $2';
            params.push(type);
        }

        query += ' ORDER BY date_purchased DESC, created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// GET /api/supplier-contracts - Get all contracts (with optional filters)
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const { type, supplierId, page = '1', limit = '50' } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        let query = `
            SELECT sc.*, s.name as supplier_name
            FROM supplier_contracts sc
            LEFT JOIN suppliers s ON sc.supplier_id = s.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (type) {
            query += ` AND sc.contract_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (supplierId) {
            query += ` AND sc.supplier_id = $${paramIndex}`;
            params.push(supplierId);
            paramIndex++;
        }

        query += ` ORDER BY sc.date_purchased DESC, sc.created_at DESC`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit as string), offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM supplier_contracts WHERE 1=1';
        const countParams: any[] = [];
        let countParamIndex = 1;

        if (type) {
            countQuery += ` AND contract_type = $${countParamIndex}`;
            countParams.push(type);
            countParamIndex++;
        }

        if (supplierId) {
            countQuery += ` AND supplier_id = $${countParamIndex}`;
            countParams.push(supplierId);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            data: result.rows,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                totalPages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/supplier-contracts/:id - Get specific contract by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT sc.*, s.name as supplier_name, s.contact_person, s.phone
             FROM supplier_contracts sc
             LEFT JOIN suppliers s ON sc.supplier_id = s.id
             WHERE sc.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// PUT /api/supplier-contracts/:id - Update contract
router.put('/:id', authMiddleware, requirePermission('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { contractType, datePurchased, contractValue, paymentCurrency, exchangeRate, details, notes } = req.body;

        // Validate details if contract type or details provided
        let validatedDetails = details;
        if (details && contractType) {
            validatedDetails = validateContractDetails(contractType, details);
        }

        // Calculate DZD value
        const contractValueDzd = contractValue && exchangeRate ? contractValue * exchangeRate : null;

        // Build dynamic update query
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (contractType) {
            updates.push(`contract_type = $${paramIndex}`);
            values.push(contractType);
            paramIndex++;
        }

        if (datePurchased) {
            updates.push(`date_purchased = $${paramIndex}`);
            values.push(datePurchased);
            paramIndex++;
        }

        if (contractValue !== undefined) {
            updates.push(`contract_value = $${paramIndex}`);
            values.push(contractValue);
            paramIndex++;
        }

        if (paymentCurrency) {
            updates.push(`payment_currency = $${paramIndex}`);
            values.push(paymentCurrency);
            paramIndex++;
        }

        if (exchangeRate !== undefined) {
            updates.push(`exchange_rate = $${paramIndex}`);
            values.push(exchangeRate);
            paramIndex++;
        }

        if (contractValueDzd !== null) {
            updates.push(`contract_value_dzd = $${paramIndex}`);
            values.push(contractValueDzd);
            paramIndex++;
        }

        if (validatedDetails) {
            updates.push(`details = $${paramIndex}`);
            values.push(JSON.stringify(validatedDetails));
            paramIndex++;
        }

        if (notes !== undefined) {
            updates.push(`notes = $${paramIndex}`);
            values.push(notes);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        const query = `
            UPDATE supplier_contracts
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        if (error.message?.includes('Validation failed')) {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
});

// DELETE /api/supplier-contracts/:id - Delete contract
router.delete('/:id', authMiddleware, requirePermission('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM supplier_contracts WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.json({ message: 'Contract deleted successfully', contract: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

export default router;
