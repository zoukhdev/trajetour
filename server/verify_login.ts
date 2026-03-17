
import axios from 'axios';

async function verifyLogin() {
    try {
        const response = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'djamel.1767532933180@example.com',
            password: 'Password123!'
        });
        console.log('Login Successful!');
        console.log('Token:', response.data.token ? 'Yes' : 'No');
        console.log('User:', response.data.user);
        // Print cookies
        console.log('Headers:', response.headers);
    } catch (error: any) {
        console.error('Login Failed:', error.response?.status, error.response?.data);
    }
}

verifyLogin();
