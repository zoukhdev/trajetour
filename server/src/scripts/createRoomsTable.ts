import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const migrate = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting Rooms Table Migration...');

        // 1. Create Rooms Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
                hotel_name VARCHAR(255) NOT NULL,
                room_number VARCHAR(50) NOT NULL,
                capacity INTEGER NOT NULL DEFAULT 4,
                gender VARCHAR(20) CHECK (gender IN ('MEN', 'WOMEN', 'MIXED')) NOT NULL,
                status VARCHAR(20) DEFAULT 'ACTIVE',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Rooms table created.');

        // 2. Add Index for performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_rooms_offer_id ON rooms(offer_id);
            CREATE INDEX IF NOT EXISTS idx_rooms_hotel_name ON rooms(hotel_name);
        `);

        console.log('✅ Indexes created.');

    } catch (err) {
        console.error('❌ Migration failed:', err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
};

if (require.main === module) {
    migrate().catch(console.error);
}

export { migrate };
