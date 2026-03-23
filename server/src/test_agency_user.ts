import { defaultPool as pool } from './config/database.js';

async function fetchUser() {
    try {
        const res = await pool.query(`
            SELECT u.email, a.id as agency_id, a.user_id as agency_user_id 
            FROM users u 
            LEFT JOIN agencies a ON u.id = a.user_id 
            WHERE u.email LIKE '%orantrav%' OR a.subdomain = 'orantrav2026'
        `);
        console.log("Admin:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

fetchUser();
