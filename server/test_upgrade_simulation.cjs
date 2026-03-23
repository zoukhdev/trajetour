const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_URL = 'https://api.trajetour.com/api';

async function simulate() {
  try {
    console.log('1. Logging in as Master Admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'aimen@trajetour.com',
      password: 'Aimen@2025',
    }, {
      headers: {
        'X-Tenant-Id': 'default'
      }
    });

    const tokenRaw = loginRes.data.token || loginRes.headers['set-cookie']?.join(';');
    console.log('✅ Logged in successfully. Raw cookie:', tokenRaw);
    let token = loginRes.data.token;
    if (!token && loginRes.headers['set-cookie']) {
       const tkStr = loginRes.headers['set-cookie'].find(c => c.startsWith('token='));
       if (tkStr) token = tkStr.split(';')[0].split('=')[1];
    }
    console.log('✅ Extracted Token:', token ? token.substring(0, 15) + '...' : 'NONE');

    console.log('\n2. Sending POST /subscriptions/upgrade with X-Tenant-Id: westtravel');
    const upgradeRes = await axios.post(`${API_URL}/subscriptions/upgrade`, {
      requestedPlan: 'Premium',
      notes: 'Diagnostic test from agent'
    }, {
      headers: {
        'Cookie': `token=${token}`,
        'X-Tenant-Id': 'westtravel',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Upgrade Response Status:', upgradeRes.status);
    console.log('✅ Upgrade Response Data:', upgradeRes.data);

    // Now query the DB to prove it was inserted
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const dbRes = await pool.query(`SELECT * FROM agency_approvals WHERE notes = 'Diagnostic test from agent'`);
    console.log('\n3. DB Records found:', dbRes.rows.length);
    console.table(dbRes.rows);
    await pool.end();

  } catch (err) {
    if (err.response) {
      console.error('❌ API Error:', err.response.status, err.response.data);
    } else {
      console.error('❌ Error:', err.message);
    }
  }
}

simulate();
