import { pool } from './src/config/database.js';

async function getUsers() {
    try {
        const agencyRes = await pool.query("SELECT email FROM users WHERE role = 'agency' LIMIT 1");
        const clientRes = await pool.query("SELECT email FROM users WHERE role = 'client' LIMIT 1");
        
        console.log("Agency exists:", agencyRes.rows);
        console.log("Client exists:", clientRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

getUsers();
