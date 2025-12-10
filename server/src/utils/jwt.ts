import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export interface JWTPayload {
    id: string;
    email: string;
    role: string;
    permissions: string[];
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(
        payload,
        config.jwt.secret,
        { expiresIn: '7d' } // Hardcoded to avoid type issues
    );
}

export function verifyToken(token: string): JWTPayload {
    try {
        return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}
