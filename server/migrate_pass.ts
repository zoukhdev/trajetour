import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const masterPool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log("Updating Master DB...");
        await masterPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);`);
        await masterPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMP;`);
        
        const res = await masterPool.query(`SELECT subdomain, db_url FROM agencies WHERE db_url IS NOT NULL`);
        console.log(`Found ${res.rows.length} agency databases to update.`);
        
        for (const row of res.rows) {
            console.log(`Updating agency: ${row.subdomain}`);
            const agencyPool = new Pool({ connectionString: row.db_url });
            try {
                await agencyPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);`);
                await agencyPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMP;`);
            } catch (err: any) {
                console.error(`Error updating ${row.subdomain}:`, err.message);
            } finally {
                await agencyPool.end();
            }
        }
        console.log("SUCCESS!");
    } catch (e) {
        console.error("FATAL ERROR:", e);
    } finally {
        await masterPool.end();
    }
}
run();
