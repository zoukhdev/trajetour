import { pool } from '../config/database.js';
import bcrypt from 'bcrypt';

async function createAdminUser() {
    try {
        console.log('🔍 Checking users table schema...');

        // Check table structure
        const schemaResult = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);

        console.log('📋 Users table columns:');
        schemaResult.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });

        console.log('\n🔄 Creating admin user...');

        // Hash password
        const hashedPassword = await bcrypt.hash('Zoukh@2026', 10);

        // Permissions as JSON string
        const permissions = JSON.stringify(['manage_users', 'manage_business', 'manage_financials', 'view_reports']);

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
                'zoukh@trajetour.com',
                hashedPassword,
                'Zoukh',
                'admin',
                permissions
            ]
        );

        console.log('\n✅ Admin user created successfully!');
        console.log('━'.repeat(50));
        console.log('📧 Email:', result.rows[0].email);
        console.log('👤 Username:', result.rows[0].username);
        console.log('🔑 Role:', result.rows[0].role);
        console.log('━'.repeat(50));
        console.log('   Email: zoukh@trajetour.com');
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
