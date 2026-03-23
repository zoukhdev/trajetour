import pkg from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pkg;

const tenantDbUrl = "postgres://neondb_owner:npg_80dOQjAUeqvS@ep-autumn-hill-aga6aim8.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

// Use directly the one in .env if dotenv fails or hardcode it
const jwtSecret = process.env.JWT_SECRET || '7a9f3e8c2b5d1a6e4f8c9a3b2d7e5f1c8a4b6d9e2f7a3c5b8d1e4f6a9c2b5d8e1f';

async function findUserAndSign() {
    const tenantPool = new Pool({ connectionString: tenantDbUrl });
    try {
        console.log("Searching user inside tenant DB...");
        const res = await tenantPool.query("SELECT * FROM users LIMIT 1");
        if (res.rows.length === 0) return;
        
        const user = res.rows[0];
        console.log("✅ Match User:", user);

        const token = jwt.sign(
            { id: user.id, agencyId: user.agency_id, role: user.role, email: user.email },
            jwtSecret,
            { expiresIn: '1h' }
        );
        console.log(`\n\n✅ Generated JWT:\n${token}\n`);
        console.log(`Use this in Authorization header: Bearer ${token}`);
    } catch (e) {
        console.error("❌ Failed step:", e);
    } finally {
        tenantPool.end();
    }
}

findUserAndSign();
