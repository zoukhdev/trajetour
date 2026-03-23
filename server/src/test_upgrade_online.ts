import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const token = fs.readFileSync('token.txt', 'utf-8').trim();

async function trigger() {
    console.log("Triggering /upgrade update on live server with token...");
    try {
        const res = await fetch('https://trajetour.com/api/subscriptions/upgrade', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Tenant-Id': 'oranoran'
            },
            body: JSON.stringify({
                requestedPlan: 'Premium',
                notes: 'AI Automation Upgrade Diagnostic Trigger'
            })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text);
    } catch (e: any) {
        console.error("Fetch Exception:", e.message);
    }
}

trigger();
