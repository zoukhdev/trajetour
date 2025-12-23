import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export function errorHandler(
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error('Error:', err);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            ...(config.nodeEnv === 'development' && { stack: err.stack })
        });
        return;
    }

    // Database errors
    if (err.name === 'QueryFailedError' || (err as any).code?.startsWith('23')) {
        console.error('❌ Database Error (400):', err); // DEBUG LOG
        res.status(400).json({ error: 'Database operation failed', details: err.message });
        return;
    }

    // Default error - DEBUG MODE FORCED
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        stack: err.stack,
        details: (err as any).details || (err as any).detail // Catch Postgres details
    });
}

export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({ error: 'Route not found' });
}
