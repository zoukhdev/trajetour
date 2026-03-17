import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({
    baseURL: 'http://localhost:3001/api',
    jar,
    withCredentials: true
}));

async function seed() {
    try {
        console.log('1. Seeding Admin...');
        await client.get('/seed-admin');

        console.log('2. Logging in...');
        await client.post('/auth/login', {
            email: 'aimen@wrtour.com',
            password: 'Aimen@2025'
        });
        console.log('Logged in successfully.');

        console.log('3. Creating Offers...');

        const offers = [
            {
                title: 'Omrah Ramadan Premium',
                type: 'Omra',
                destination: 'Makkah & Madinah',
                price: 250000,
                startDate: '2024-03-10', // Date strings are accepted by Zod string schema, but ISO preferable
                endDate: '2024-03-25',
                hotel: 'Hilton Convention',
                transport: 'Avion',
                description: 'A premium spiritual journey during the holy month of Ramadan.',
                status: 'Active',
                disponibilite: 45,
                inclusions: { flight: true, visa: true, hotel: true, guide: true },
                roomPricing: [
                    { roomType: 'Quint', price: 250000, capacity: 5 },
                    { roomType: 'Quad', price: 280000, capacity: 4 },
                    { roomType: 'Triple', price: 320000, capacity: 3 },
                    { roomType: 'Double', price: 380000, capacity: 2 }
                ]
            },
            {
                title: 'Hajj 2024 Comfort',
                type: 'Haj',
                destination: 'Mina & Arafat',
                price: 850000,
                startDate: '2024-06-14',
                endDate: '2024-07-01',
                hotel: 'Swissotel Makkah',
                transport: 'Avion',
                description: 'Complete Hajj package with full guidance available.',
                status: 'Active',
                disponibilite: 20,
                inclusions: { flight: true, visa: true, tent: true, food: true },
                roomPricing: [
                    { roomType: 'Quad', price: 850000, capacity: 4 }
                ]
            }
        ];

        for (const offer of offers) {
            try {
                const res = await client.post('/offers', offer);
                console.log(`Created offer: ${res.data.title} (ID: ${res.data.id})`);
            } catch (err) {
                console.error(`Failed to create ${offer.title}:`, err.response?.data || err.message);
            }
        }

        console.log('✅ Seeding complete.');

    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
}

seed();
