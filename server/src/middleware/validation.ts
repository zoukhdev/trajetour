import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Validation Schemas
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});



export const registerAgencySchema = z.object({
    agencyName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8),
    password: z.string().min(6),
    address: z.string().optional(),
    contactName: z.string().min(2)
});

export const registerSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8),
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
    clientId: z.string(),
    agencyId: z.string().nullable().optional(),
    offerId: z.string().uuid().optional(),
    items: z.array(z.object({
        id: z.string(),
        description: z.string(),
        quantity: z.number().nonnegative(),
        unitPrice: z.number().nonnegative(),
        amount: z.number().nonnegative()
    })).optional().default([]),
    passengers: z.array(z.object({
        id: z.string().optional(),
        firstName: z.string(),
        lastName: z.string(),
        birthDate: z.string().optional().or(z.literal('')),
        passportNumber: z.string().optional().or(z.literal('')),
        passportExpiry: z.string().optional().or(z.literal('')),
        gender: z.enum(['Homme', 'Femme']).optional(),
        ageCategory: z.enum(['ADT', 'CHD', 'INF']).optional(),
        assignedRoomId: z.string().uuid().nullable().optional(),
        finalPrice: z.number().nonnegative().optional()
    })).optional().default([]),
    hotels: z.array(z.any()).optional().default([]),
    totalAmount: z.number().nonnegative(),
    totalAmountDZD: z.number().optional(),
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
    role: z.enum(['admin', 'staff', 'caisser', 'agent']),
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

export const multiTenantAgencySchema = z.object({
    name: z.string().min(2).max(255),
    subdomain: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Subdomain must contain only lowercase letters, numbers, and hyphens"),
    dbUrl: z.string().url().optional(),
    ownerEmail: z.string().email().optional(),
    password: z.string().min(6).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    contactName: z.string().optional()
});

export const offerSchema = z.object({
    title: z.string().min(2).max(255),
    type: z.enum(['Omra', 'Haj', 'Voyage Organisé', 'Vols', 'Visa']),
    destination: z.string().min(2),
    price: z.number().nonnegative().default(0),
    startDate: z.string(),
    endDate: z.string(),
    hotel: z.string().optional(),
    transport: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['Active', 'Draft', 'Archived']).optional(),
    disponibilite: z.number().int().nonnegative().optional(),
    inclusions: z.record(z.boolean()).optional(),
    roomPricing: z.array(z.object({
        roomType: z.string(),
        price: z.number().positive(),
        capacity: z.number().int().positive()
    })).optional()
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
