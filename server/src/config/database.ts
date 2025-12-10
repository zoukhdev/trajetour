import pkg from 'pg';
import { config } from './env.js';
const { Pool } = pkg;

// Create PostgreSQL pool for Neon
export const pool = new Pool({
    connectionString: config.databaseUrl
    // SSL and other params are included in the connection string
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to Neon PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});

// Helper function to test connection
export async function testConnection(): Promise<boolean> {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection test successful:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
    }
}
