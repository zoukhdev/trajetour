import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const { Pool } = pkg;
const masterPool = new Pool({
    connectionString: process.env.MASTER_DATABASE_URL || process.env.DATABASE_URL
});

async function findAgencyDb() {
    try {
        const res = await masterPool.query('SELECT name, subdomain, db_url FROM agencies WHERE subdomain = $1', ['mustaphavoyage']);
        console.log('--- AGENCY INFO ---');
        console.table(res.rows);
        
        if (res.rows[0]?.db_url) {
            const tenantPool = new Pool({ connectionString: res.rows[0].db_url });
            const offersRes = await tenantPool.query('SELECT title, image_url FROM offers');
            console.log('\n--- OFFERS IN TENANT DB ---');
            console.table(offersRes.rows);
            await tenantPool.end();
        }
    } catch (e) {
        console.error(e);
    } finally {
        await masterPool.end();
    }
}

findAgencyDb();
