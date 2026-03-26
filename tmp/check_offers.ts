import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const { Pool } = pkg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkOffers() {
    try {
        const res = await pool.query('SELECT title, image_url FROM offers');
        console.log('--- OFFERS IN DATABASE ---');
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkOffers();
