// Run this script to create admin user in PRODUCTION database
// Make sure your server/.env has the PRODUCTION DATABASE_URL

import { pool } from '../config/database.js';
import bcrypt from 'bcrypt';

async function createAdminUser() {
    try {
        console.log('🔄 Creating admin user in PRODUCTION database...');
        console.log('📍 Environment:', process.env.NODE_ENV || 'development');

        // Hash password
        const hashedPassword = await bcrypt.hash('Aimen@2025', 10);

        // Insert user
        const result = await pool.query(
            `INSERT INTO users (
                email,
                password_hash,
                username,
                role,
                permissions
            ) VALUES ($1, $2, $3, $4, $5::jsonb)
            ON CONFLICT (username) 
            DO UPDATE SET 
                email = EXCLUDED.email,
                password_hash = EXCLUDED.password_hash,
                permissions = EXCLUDED.permissions
            RETURNING id, email, username, role`,
            [
                'aimen@trajetour.com',
                hashedPassword,
                'Aimen',
                'admin',
                JSON.stringify(['manage_users', 'manage_business', 'manage_financials', 'view_reports'])
            ]
        );

        console.log('\n✅ Admin user created successfully in PRODUCTION!');
        console.log('━'.repeat(50));
        console.log('📧 Email:', result.rows[0].email);
        console.log('👤 Username:', result.rows[0].username);
        console.log('🔑 Role:', result.rows[0].role);
        console.log('━'.repeat(50));
        console.log('   Email: aimen@trajetour.com');
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
        if (error && typeof error === 'object' && 'code' in error) {
            console.error('Error Code:', (error as any).code);
        }
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

createAdminUser();
