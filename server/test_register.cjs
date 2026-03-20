const axios = require('axios');

async function testRegister() {
  const uniqueId = Date.now();
  const payload = {
    name: `Test Agency ${uniqueId}`,
    subdomain: `testagency${uniqueId}`,
    ownerEmail: `test${uniqueId}@example.com`,
    phone: '0555123456',
    address: '15 Rue Test, Alger',
    contactName: 'Test User',
    password: 'TestPass123!',
    plan: 'Basic'
  };

  console.log('📤 Sending registration request with subdomain:', payload.subdomain);

  try {
    const res = await axios.post('https://trajetour.com/api/master/register-agency', payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000  // 60 second timeout
    });
    console.log('✅ SUCCESS! Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.log('❌ FAILED! Status:', err.response.status);
      console.log('Error body:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('❌ Request error:', err.message);
    }
  }
}

testRegister();
