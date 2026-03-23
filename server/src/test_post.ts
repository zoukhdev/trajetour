import fetch from 'node-fetch';
import fs from 'fs';

const token = fs.readFileSync('token.txt', 'utf8').replace(/\s+/g, '').trim();

async function triggerUpgrade() {
    console.log("Triggering /upgrade on live node with full cleaned token...");
    try {
        const response = await fetch('https://oranoran.trajetour.com/api/subscriptions/upgrade', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Tenant-Id': 'oranoran'
            },
            body: JSON.stringify({
                requestedPlan: 'Premium',
                notes: 'Trigger diagnostics on code execution location'
            })
        });

        const status = response.status;
        const text = await response.text();

        console.log(`Status: ${status}`);
        console.log(`Response: ${text}`);

    } catch (e) {
        console.error("❌ Request failed:", e);
    }
}

triggerUpgrade();
