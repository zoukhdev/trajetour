const axios = require('axios');
const NEON_API_KEY = "EV[1:6kXo+qa0d8Huke0+1BFwDBtPGeBMOGY4:st/h6FC/673/RaCDPQF5YJcZr1Qs4OndyigZYcKTXGqgdyCedesvD1+2L9PGAa4W2ZVAR9hAEJl8ZvfI4g7FBlcIluTyyB8hGBmuEf3PMevbc5rYsw==]";
const NEON_PROJECT_ID = "soft-band-79793991";

async function test() {
    try {
        console.log("Listing branches...");
        const res = await axios.get(
            `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`,
            { headers: { Authorization: `Bearer ${NEON_API_KEY}`, Accept: 'application/json' } }
        );
        const branch = res.data.branches[0];
        console.log("Found branch:", branch.id);
        
        console.log("Getting roles...");
        const rolesRes = await axios.get(
            `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branch.id}/roles`,
            { headers: { Authorization: `Bearer ${NEON_API_KEY}`, Accept: 'application/json' } }
        );
        const role = rolesRes.data.roles[0].name;
        console.log("Found role:", role);
        
        console.log("Revealing password...");
        const passRes = await axios.get(
            `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branch.id}/roles/${role}/reveal_password`,
            { headers: { Authorization: `Bearer ${NEON_API_KEY}`, Accept: 'application/json' } }
        );
        console.log("Password:", passRes.data.password ? "Revealed!" : "Empty");
    } catch(err) {
        if (err.response) {
            console.error(err.response.status, err.response.data);
        } else {
            console.error(err.message);
        }
    }
}
test();
