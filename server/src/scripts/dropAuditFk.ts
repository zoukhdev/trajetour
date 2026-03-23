import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    try {
        console.log('Dropping audit_logs_user_id_fkey from master DB...');
        await client.query('ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey');
        console.log('Dropped FK constraint successfully.');
    } catch (e) {
        console.error('Error dropping FK:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
