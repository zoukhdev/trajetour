import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_pMWw8Foc1CIQ@ep-ancient-cake-agf81841-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});


async function check() {
    try {
        console.log('--- 🛡️ Master Database Inspector ---');
        
        const approvals = await pool.query('SELECT * FROM agency_approvals');
        console.log(`\n📄 Agency Approvals (${approvals.rows.length}):`);
        console.log(approvals.rows);

        const agencies = await pool.query('SELECT id, name, subdomain FROM agencies');
        console.log(`\n🏢 Agencies (${agencies.rows.length}):`);
        console.log(agencies.rows);

        if (approvals.rows.length > 0) {
            const first = approvals.rows[0];
            console.log(`\n💡 Left Join check:`);
            const joined = await pool.query(`
                SELECT aa.*, a.name as agency_name 
                FROM agency_approvals aa
                LEFT JOIN agencies a ON aa.agency_id = a.id
            `);
            console.log(joined.rows);
        }

    } catch (e) {
        console.error('❌ Error Inspecting:', e);
    } finally {
        pool.end();
    }
}

check();
