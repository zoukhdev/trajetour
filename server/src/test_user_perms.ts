import { defaultPool as pool } from './config/database.js';

async function fetchUser() {
    try {
        const res = await pool.query("SELECT role, permissions FROM users WHERE username = 'zoukh_p' OR email = 'admin@wahat-tour.com'");
        console.log("Admin:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

fetchUser();
