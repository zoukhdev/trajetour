
import 'dotenv/config';
import http from 'http';
import jwt from 'jsonwebtoken';

const token = jwt.sign({
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'admin@test.com',
    role: 'admin',
    permissions: ['manage_users']
}, process.env.JWT_SECRET as string, { expiresIn: '1h' });

const data = JSON.stringify({
    username: "testagent_api",
    email: "testagent_api@test.com",
    password: "password123",
    role: "agent",
    permissions: []
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/users',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`,
        'Content-Length': data.length
    }
};

console.log('🚀 Sending request...');
const req = http.request(options, res => {
    console.log(`Status: ${res.statusCode}`);
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        console.log('Response:', body);
    });
});

req.on('error', error => {
    console.error('❌ Request Error:', error);
});

req.write(data);
req.end();
