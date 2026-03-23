import fetch from 'node-fetch';

async function testRegister() {
    const data = {
        name: "test-agency-xyz",
        subdomain: "test-xyz-99",
        ownerEmail: "testxyz99@test.com",
        plan: "Basic",
        password: "Password123!",
        paymentMethod: "Bank Transfer",
        contactName: "John Doe",
        phone: "1234567890",
        address: "123 Test St"
    };

    try {
        const res = await fetch('https://trajetour.com/api/master/register-agency', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", json);
    } catch (e) {
        console.error(e);
    }
}

testRegister();
