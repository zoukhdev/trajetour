import axios from 'axios';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
    try {
        console.log('Fetching a pending agency...');
        const res = await pool.query("SELECT id, name FROM agencies WHERE status = 'PENDING' LIMIT 1");
        if (res.rows.length === 0) {
            console.log('No pending agencies found in DB.');
            process.exit(0);
        }
        const agency = res.rows[0];
        console.log(`Found pending agency: ${agency.name} (${agency.id})`);

        console.log('Logging in as master admin...');
        const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@wahat-tour.com',
            password: 'Admin123!'
        });
        const cookie = loginRes.headers['set-cookie']?.[0] || '';
        
        console.log('Attempting to approve agency...');
        try {
            const approveRes = await axios.patch(
                `http://localhost:3001/api/master/agencies/${agency.id}/status`,
                { status: 'ACTIVE' },
                { headers: { Cookie: cookie } }
            );
            console.log('Success:', approveRes.status, approveRes.data);
        } catch (error: any) {
            console.error('API Error:');
            if (error.response) {
                console.error(`Status: ${error.response.status}`);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error(error.message);
            }
        }
    } catch (e: any) {
        console.error('Fatal error:', e);
    } finally {
        await pool.end();
    }
}
run();
