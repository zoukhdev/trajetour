const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('https://trajetour.com/api/auth/login', {
            email: 'admin@wahat-tour.com',
            password: 'Admin123!'
        });
        console.log("Status:", res.status);
        console.log("Headers:", res.headers['set-cookie']);
    } catch(err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
test();
