
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_pMWw8Foc1CIQ@ep-ancient-cake-agf81841-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function seedOrder() {
    try {
        // Get the user ID
        const userRes = await pool.query("SELECT id FROM users WHERE email = 'djamel.1767532933180@example.com'");
        if (userRes.rows.length === 0) {
            console.error('User not found!');
            return;
        }
        const userId = userRes.rows[0].id;
        console.log('Found User ID:', userId);

        // Check if client exists for this user, if not create one
        let clientRes = await pool.query("SELECT id FROM clients WHERE user_id = $1", [userId]);
        let clientId;

        if (clientRes.rows.length === 0) {
            console.log('Creating client profile...');
            const newClient = await pool.query(`
                INSERT INTO clients (first_name, last_name, email, mobile_number, user_id, type)
                VALUES ('Djamel', 'Brahimi', 'djamel.1767532933180@example.com', '0555667788', $1, 'Individual')
                RETURNING id;
             `, [userId]);
            clientId = newClient.rows[0].id;
        } else {
            clientId = clientRes.rows[0].id;
        }
        console.log('Client ID:', clientId);

        // Create an Order
        // Removing 'type' and 'payment_status', adding 'items'
        const orderRes = await pool.query(`
            INSERT INTO orders (client_id, total_amount, status, items)
            VALUES ($1, 50000, 'Non payé', $2)
            RETURNING id;
        `, [clientId, JSON.stringify([{ type: 'omrah', name: 'Pack Omrah' }])]);

        console.log('Created Order ID:', orderRes.rows[0].id);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

seedOrder();
