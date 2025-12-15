
import { pool } from '../config/database.js';
import { generateShortId } from '../utils/idGenerator.js';

const migrate = async () => {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting Short ID Migration...');
        await client.query('BEGIN');

        // 1. Add Columns if they don't exist
        console.log('📊 Adding columns...');
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS code VARCHAR(10);
            ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS code VARCHAR(10);
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS reference VARCHAR(10);
        `);

        // 2. Backfill Users
        console.log('👤 Backfilling Users...');
        const users = await client.query('SELECT id FROM users WHERE code IS NULL');
        for (const user of users.rows) {
            const code = generateShortId();
            await client.query('UPDATE users SET code = $1 WHERE id = $2', [code, user.id]);
        }

        // 3. Backfill Bank Accounts
        console.log('💰 Backfilling Bank Accounts...');
        const accounts = await client.query('SELECT id FROM bank_accounts WHERE code IS NULL');
        for (const account of accounts.rows) {
            const code = generateShortId();
            await client.query('UPDATE bank_accounts SET code = $1 WHERE id = $2', [code, account.id]);
        }

        // 4. Backfill Orders
        console.log('📦 Backfilling Orders...');
        const orders = await client.query('SELECT id FROM orders WHERE reference IS NULL');
        for (const order of orders.rows) {
            const ref = generateShortId();
            await client.query('UPDATE orders SET reference = $1 WHERE id = $2', [ref, order.id]);
        }

        // 5. Add Constraints
        console.log('🔒 Adding Unique Constraints...');
        await client.query(`
            DROP INDEX IF EXISTS idx_users_code;
            CREATE UNIQUE INDEX idx_users_code ON users(code);
            
            DROP INDEX IF EXISTS idx_bank_accounts_code;
            CREATE UNIQUE INDEX idx_bank_accounts_code ON bank_accounts(code);
            
            DROP INDEX IF EXISTS idx_orders_reference;
            CREATE UNIQUE INDEX idx_orders_reference ON orders(reference);
        `);

        await client.query('COMMIT');
        console.log('✅ Migration Completed Successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
};

migrate();
