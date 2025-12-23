
import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    console.log('🔌 Connecting to DB...');
    try {
        const client = await pool.connect();
        console.log('✅ Connected.');

        // 1. Check Columns
        const cols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log('📊 Columns in users table:', cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));

        const hasCode = cols.rows.some(c => c.column_name === 'code');
        console.log(`🧐 'code' column exists? ${hasCode ? 'YES' : 'NO'}`);

        // 2. Check Constraints
        const constraints = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) 
            FROM pg_constraint 
            WHERE conrelid = 'users'::regclass
        `);
        console.log('🔒 Constraints:', constraints.rows);

        // 3. Try Insert
        console.log('🧪 Attempting to insert test agent user...');
        try {
            await client.query('BEGIN');
            const testEmail = `test_agent_${Date.now()}@test.com`;
            // Note: We use raw SQL here similar to the route to see if it fails
            const res = await client.query(`
                INSERT INTO users (username, email, password_hash, role, permissions, code)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, ['test_agent', testEmail, 'hash', 'agent', '[]', 'TEST_CODE']);
            console.log('✅ Insert SUCCESS! ID:', res.rows[0].id);
            await client.query('ROLLBACK'); // Don't actually keep it
            console.log('🔄 Rolled back test user.');
        } catch (insertErr) {
            console.error('❌ Insert FAILED:', insertErr);
            await client.query('ROLLBACK');
        }

        client.release();
    } catch (err) {
        console.error('❌ Check Failed:', err);
    } finally {
        await pool.end();
    }
}

run();
