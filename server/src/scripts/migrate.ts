import { pool } from '../config/database.js';
import { config } from '../config/env.js';
import { hashPassword } from '../utils/password.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting database migration...');

        // Read schema file
        const schemaPath = join(__dirname, '..', 'models', 'schema.sql');
        const schema = readFileSync(schemaPath, 'utf8');

        // Execute schema
        await client.query(schema);
        console.log('✅ Database schema created successfully');

        // Create admin user
        const adminPasswordHash = await hashPassword(config.admin.password);

        await client.query(
            `INSERT INTO users (username, email, password_hash, role, permissions)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (email) DO NOTHING`,
            [
                'admin',
                config.admin.email,
                adminPasswordHash,
                'admin',
                JSON.stringify(['manage_users', 'manage_business', 'manage_financials', 'view_reports'])
            ]
        );

        console.log('✅ Admin user created');
        console.log(`📧 Email: ${config.admin.email}`);
        console.log(`🔑 Password: ${config.admin.password}`);
        console.log('\n⚠️  Please change the admin password after first login!');

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        console.error('Error details:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
