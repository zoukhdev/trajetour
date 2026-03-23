import axios from 'axios';

async function test_api() {
    try {
        const subdomain = 'badrlive' + Date.now();
        console.log(`Testing with subdomain: ${subdomain}`);
        const res = await axios.post('https://trajetour.com/api/master/register-agency', {
            name: 'badr test live',
            subdomain: subdomain,
            ownerEmail: 'testlive@test.com',
            password: 'password123',
            phone: '12345678',
            address: 'Test',
            contactName: 'Test',
            plan: 'Standard',
            paymentMethod: 'Espèces'
        });
        console.log('✅ Success:', res.data);
    } catch (e: any) {
        console.error('❌ Error response:', e.response?.data || e.message);
    }
}

test_api();
