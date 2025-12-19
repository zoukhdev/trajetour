import { z } from 'zod';

// Zod schema for Rooms contract details
const roomsDetailsSchema = z.object({
    quantity: z.coerce.number().int().positive({ message: 'Quantity must be a positive integer' }),
    pricePerPersonDzd: z.coerce.number().positive({ message: 'Price per person must be positive' }),
    dateIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    dateOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    cityIn: z.string().min(1, 'City is required'),
    hotelName: z.string().min(1, 'Hotel name is required'),
    roomType: z.enum(['Single', 'Double', 'Triple', 'Quad']).optional(),
    mealsIncluded: z.boolean().optional()
}).refine(data => new Date(data.dateOut) > new Date(data.dateIn), {
    message: 'Check-out date must be after check-in date'
});

// Zod schema for Visa contract details
const visaDetailsSchema = z.object({
    quantity: z.coerce.number().int().positive({ message: 'Quantity must be a positive integer' }),
    pricePerVisa: z.coerce.number().positive({ message: 'Price per visa must be positive' }),
    visaType: z.string().min(1, 'Visa type is required'),
    processingDays: z.coerce.number().int().positive().optional(),
    country: z.string().min(1, 'Country is required')
});

// Zod schema for Transportation contract details
const transportationDetailsSchema = z.object({
    vehicleType: z.enum(['Bus', 'Van', 'Car', 'Minibus']),
    quantity: z.coerce.number().int().positive({ message: 'Quantity must be a positive integer' }),
    pricePerUnit: z.coerce.number().positive({ message: 'Price per unit must be positive' }),
    route: z.string().min(1, 'Route is required'),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    capacity: z.coerce.number().int().positive().optional()
}).refine(data => new Date(data.dateTo) >= new Date(data.dateFrom), {
    message: 'End date must be after or equal to start date'
});

// Zod schema for Flight contract details
const flightDetailsSchema = z.object({
    airline: z.string().min(1, 'Airline is required'),
    ticketQuantity: z.coerce.number().int().positive({ message: 'Ticket quantity must be a positive integer' }),
    pricePerTicket: z.coerce.number().positive({ message: 'Price per ticket must be positive' }),
    departure: z.object({
        airport: z.string().min(3, 'Airport code required (min 3 characters)'),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Date must be in YYYY-MM-DDTHH:MM format')
    }),
    arrival: z.object({
        airport: z.string().min(3, 'Airport code required (min 3 characters)'),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Date must be in YYYY-MM-DDTHH:MM format')
    }),
    flightNumber: z.string().optional(),
    class: z.enum(['Economy', 'Business', 'First']).optional()
}).refine(data => new Date(data.arrival.date) > new Date(data.departure.date), {
    message: 'Arrival must be after departure'
});

// Zod schema for Food contract details
const foodDetailsSchema = z.object({
    mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Catering', 'All Inclusive']),
    quantity: z.coerce.number().int().positive({ message: 'Quantity must be a positive integer' }),
    pricePerMeal: z.coerce.number().positive({ message: 'Price per meal must be positive' }),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    location: z.string().min(1, 'Location is required'),
    dietaryNotes: z.string().optional()
}).refine(data => new Date(data.dateTo) >= new Date(data.dateFrom), {
    message: 'End date must be after or equal to start date'
});

// Map contract types to their schemas
const contractSchemas: Record<string, z.ZodSchema> = {
    'Rooms': roomsDetailsSchema,
    'Visa': visaDetailsSchema,
    'Transportation': transportationDetailsSchema,
    'Flight': flightDetailsSchema,
    'Food': foodDetailsSchema
};

// Main validation function
export const validateContractDetails = (contractType: string, details: any) => {
    const schema = contractSchemas[contractType];

    if (!schema) {
        throw new Error(`Invalid contract type: ${contractType}`);
    }

    try {
        return schema.parse(details);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            throw new Error(`Validation failed for ${contractType} contract: ${JSON.stringify(formattedErrors)}`);
        }
        throw error;
    }
};

// Base contract schema for the main request
export const supplierContractSchema = z.object({
    supplierId: z.string().uuid('Invalid supplier ID'),
    contractType: z.enum(['Rooms', 'Visa', 'Transportation', 'Flight', 'Food']),
    datePurchased: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    contractValue: z.number().positive({ message: 'Contract value must be positive' }),
    paymentCurrency: z.enum(['DZD', 'EUR', 'USD', 'SAR']),
    exchangeRate: z.number().positive({ message: 'Exchange rate must be positive' }).default(1.0),
    details: z.any(), // Will be validated separately based on contract type
    notes: z.string().optional(),
    accountId: z.string().uuid('Invalid account ID').optional() // For transaction creation
});

export type SupplierContractInput = z.infer<typeof supplierContractSchema>;
