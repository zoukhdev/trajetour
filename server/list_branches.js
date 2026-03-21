import axios from 'axios';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });

const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;
const NEON_API_KEY = process.env.NEON_API_KEY;

async function run() {
    try {
        const branchesRes = await axios.get(
            `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`,
            { headers: { 'Authorization': `Bearer ${NEON_API_KEY}` } }
        );
        const branches = branchesRes.data.branches;
        console.log("Branches:");
        branches.forEach(b => console.log(`${b.id}: ${b.name} (Primary: ${b.primary})`));
    } catch(e) {
        console.error(e.response?.data || e.message);
    }
}
run();
