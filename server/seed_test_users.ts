import { pool } from './src/config/database.js';
import bcrypt from 'bcrypt';

async function seedTestUsers() {
    try {
        const passwordHash = await bcrypt.hash('Password123!', 10);
        
        // Upsert Agency
        await pool.query(`
            INSERT INTO users (email, password_hash, username, role) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO UPDATE SET password_hash = $2
        `, ['agency@test.com', passwordHash, 'Test Agency', 'agency']);
        
        // Upsert Client
        await pool.query(`
            INSERT INTO users (email, password_hash, username, role) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO UPDATE SET password_hash = $2
        `, ['customer@test.com', passwordHash, 'Test Customer', 'client']);
        
        console.log("Successfully seeded test users!");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

seedTestUsers();
