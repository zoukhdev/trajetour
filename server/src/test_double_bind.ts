import { defaultPool } from './config/database.js';

async function testInsert() {
    const client = await defaultPool.connect();
    try {
        await client.query('BEGIN');
        const name = 'test-sql-debug-' + Date.now();
        const subdomain = 'test-sub-' + Date.now();
        const ownerEmail = 'test@test.com';
        const plan = 'Standard';
        const contactName = 'Test';
        const phone = '12345678';
        const address = 'Test';
        const paymentMethod = 'Espèces';
        const paymentProofUrl = null;

        const result = await client.query(
            `INSERT INTO agencies (name, subdomain, db_url, owner_email, plan, subscription, type, status, contact_name, phone, address, payment_method, payment_proof_url)
             VALUES ($1, $2, '', $3, $4, $4, 'Agence', 'PENDING', $5, $6, $7, $8, $9)
             RETURNING id`,
            [name, subdomain, ownerEmail, plan, contactName, phone, address, paymentMethod, paymentProofUrl]
        );
        console.log('✅ INSERT SUCCESSFUL, ID:', result.rows[0].id);
        await client.query('ROLLBACK');
    } catch (e: any) {
        console.error('❌ SQL ERROR:', e.message);
        await client.query('ROLLBACK');
    } finally {
        client.release();
        await defaultPool.end();
    }
}

testInsert();
