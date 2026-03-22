import axios from 'axios';
import FormData from 'form-data';

async function test_form() {
    try {
        const form = new FormData();
        form.append('name', 'badr');
        form.append('subdomain', 'badroran' + Date.now());
        form.append('contactName', 'Test');
        form.append('ownerEmail', 'test@test.com');
        form.append('phone', '12345678');
        form.append('password', 'password123');
        form.append('address', 'Test');
        form.append('plan', 'Standard');
        form.append('paymentMethod', 'Espèces');

        const res = await axios.post('http://localhost:3001/api/master/register-agency', form, {
            headers: form.getHeaders()
        });
        console.log('✅ Success:', res.data);
    } catch (e: any) {
        console.error('❌ Error response:', e.response?.data || e.message);
    }
}

test_form();
