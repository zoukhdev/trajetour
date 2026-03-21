import axios from 'axios';
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';

dotenv.config({ path: '.env' });

const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;
const NEON_API_KEY = process.env.NEON_API_KEY;
const branchId = "br-small-truth-agpw0dvy";
const roleName = "authenticator";
const endpointHost = "ep-soft-mode-a2bgi220.c-2.eu-central-1.aws.neon.tech";

async function run() {
    console.log("Resetting password...");
    try {
        const passRes = await axios.post(
            `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branchId}/roles/${roleName}/reset_password`,
            {},
            { headers: { 'Authorization': `Bearer ${NEON_API_KEY}`, 'Accept': 'application/json' } }
        );
        console.log("Neon response keys:", Object.keys(passRes.data));
        console.log("role password nested:", passRes.data.role?.password);
        console.log("flat password:", passRes.data.password);

        const rolePassword = passRes.data.role?.password || passRes.data.password;
        const dbUrl = `postgres://${roleName}:${rolePassword}@${endpointHost}/neondb?sslmode=require`;
        console.log("New DB URL:", dbUrl);

        // try to connect
        const { Pool } = pg;
        const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
        try {
            const res = await pool.query("SELECT 1 as test");
            console.log("Connected successfully! Test =", res.rows[0].test);
        } catch(err) {
            console.error("Connection failed:", err.message);
        } finally {
            pool.end();
        }
    } catch(err) {
        console.error("Error calling Neon:", err.response?.data || err.message);
    }
}
run();
