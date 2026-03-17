async function registerUsers() {
    try {
        // Register Client
        const clientRes = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'Test',
                lastName: 'Customer',
                email: 'customer@test.com',
                phone: '0555555555',
                password: 'Password123!'
            })
        });
        const clientData = await clientRes.json();
        console.log('Client Registration:', clientData);

        // Register Agency
        const agencyRes = await fetch('http://localhost:3001/api/auth/register-agency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agencyName: 'Test Agency',
                contactName: 'Agency Contact',
                email: 'agency@test.com',
                phone: '0666666666',
                address: '123 Agency St',
                password: 'Password123!'
            })
        });
        const agencyData = await agencyRes.json();
        console.log('Agency Registration:', agencyData);

    } catch (e) {
        console.error(e);
    }
}
registerUsers();
