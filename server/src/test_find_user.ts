import { masterPool } from './config/tenantPool.js';

async function findUser() {
    try {
        console.log("Looking for user badrrio990@gmail.com...");
        const res = await masterPool.query("SELECT * FROM users WHERE email='badrrio990@gmail.com'");
        if (res.rows.length === 0) {
            console.log("❌ User not found.");
            return;
        }
        console.log("✅ User found:", res.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        masterPool.end();
    }
}

findUser();
