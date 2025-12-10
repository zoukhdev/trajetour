import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Validation Schemas
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

export const clientSchema = z.object({
    fullName: z.string().min(2).max(255),
    // Relaxed mobile number validation to avoid blocking valid numbers
    mobileNumber: z.string().min(5).max(20),
    type: z.enum(['Individual', 'Entreprise']),
    passportNumber: z.string().optional().or(z.literal('')),
    passportExpiry: z.string().optional().or(z.literal(''))
});

export const orderSchema = z.object({
    clientId: z.string().uuid(),
    agencyId: z.string().uuid().optional().or(z.literal('')),
    items: z.array(z.object({
        id: z.string(),
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        amount: z.number()
    })).optional(),
    passengers: z.array(z.any()).optional(), // Helper validation happens in controller
    hotels: z.array(z.any()).optional(),
    totalAmount: z.number(), // Allow 0 if needed (e.g. quote only) or make strict if business rule requires
    notes: z.string().optional()
});

export const paymentSchema = z.object({
    orderId: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.enum(['DZD', 'EUR', 'USD', 'SAR']),
    exchangeRate: z.number().positive(),
    method: z.enum(['Cash', 'CCP', 'Baridimob', 'Bank Transfer']),
    paymentDate: z.string()
});

export const expenseSchema = z.object({
    designation: z.string().min(1).max(255),
    category: z.enum(['Bureau', 'Salaire', 'Transport', 'Autre']),
    amount: z.number().positive(),
    currency: z.enum(['DZD', 'EUR', 'USD', 'SAR']),
    exchangeRate: z.number().positive(),
    expenseDate: z.string(),
    accountId: z.string().uuid().optional()
});

export const userSchema = z.object({
    username: z.string().min(3).max(100),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['admin', 'staff', 'caisser']),
    permissions: z.array(z.string()).optional()
});

export const agencySchema = z.object({
    name: z.string().min(2).max(255),
    type: z.enum(['Agence', 'Rabbateur']),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    subscription: z.enum(['Standard', 'Premium', 'Gold']).optional(),
    creditStart: z.number().default(0),
    currentCredit: z.number().default(0)
});

export const offerSchema = z.object({
    title: z.string().min(1).max(255),
    type: z.enum(['Omra', 'Haj', 'Voyage Organisé', 'Visa', 'Autre']),
    destination: z.string().min(1).max(255),
    price: z.number().positive(),
    startDate: z.string(),
    endDate: z.string(),
    hotel: z.string().optional(),
    transport: z.enum(['Avion', 'Bus', 'Sans Transport']).optional(),
    description: z.string().optional(),
    status: z.enum(['Active', 'Draft', 'Archived']).default('Draft')
});

// Validation Middleware
export function validate(schema: z.ZodSchema) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error('❌ Validation Failed:', JSON.stringify(error.errors, null, 2));
                res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors
                });
            } else {
                next(error);
            }
        }
    };
}
