import axios from 'axios';
import FormData from 'form-data';

async function test_api() {
    try {
        const form = new FormData();
        const subdomain = 'badrliveform' + Date.now();
        console.log(`Testing with subdomain: ${subdomain}`);
        form.append('name', 'badr test live form');
        form.append('subdomain', subdomain);
        form.append('ownerEmail', 'testliveform@test.com');
        form.append('password', 'password123');
        form.append('phone', '12345678');
        form.append('address', 'Test');
        form.append('contactName', 'Test');
        form.append('plan', 'Standard');
        form.append('paymentMethod', 'Espèces');

        const res = await axios.post('https://trajetour.com/api/master/register-agency', form, {
            headers: form.getHeaders()
        });
        console.log('✅ Success:', res.data);
    } catch (e: any) {
        console.error('❌ Error response:', e.response?.data || e.message);
    }
}

test_api();
