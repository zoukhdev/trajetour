import { pool } from './src/config/database.js';

async function queryAgencies() {
    try {
        const result = await pool.query(`
            SELECT 
                a.id, 
                a.name, 
                a.email, 
                a.phone, 
                u.email as user_email, 
                u.role 
            FROM agencies a 
            LEFT JOIN users u ON a.user_id = u.id 
            ORDER BY a.created_at DESC 
            LIMIT 10
        `);

        console.log('\n=== EXISTING AGENCIES ===\n');
        if (result.rows.length === 0) {
            console.log('No agencies found in database.');
        } else {
            result.rows.forEach((agency, index) => {
                console.log(`${index + 1}. ${agency.name}`);
                console.log(`   Email: ${agency.user_email || agency.email}`);
                console.log(`   Phone: ${agency.phone}`);
                console.log(`   Role: ${agency.role}`);
                console.log('   ---');
            });
        }

        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('Error querying agencies:', err);
        process.exit(1);
    }
}

queryAgencies();
