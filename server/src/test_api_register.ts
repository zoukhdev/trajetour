import axios from 'axios';

async function test_api() {
    try {
        const res = await axios.post('http://localhost:3001/api/master/register-agency', {
            name: 'badr',
            subdomain: 'badroran',
            ownerEmail: 'test@test.com',
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
