
const fetch = require('node-fetch'); // Assuming node-fetch or native fetch in recent node

async function test() {
    try {
        const res = await fetch('http://localhost:3001/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Mock auth headers if needed? Middleware 'authMiddleware' checks token? 
                // Wait, I need a token if the route is protected!
            },
            body: JSON.stringify({
                username: "testagent_api",
                email: "testagent_api@test.com",
                password: "password123",
                role: "agent",
                permissions: []
            })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', data);
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
