import { pool } from './config/database.js';

async function checkRooms() {
    try {
        console.log("--- START DEBUG ---");
        const res = await pool.query('SELECT id, hotel_name, room_number, status, offer_id FROM rooms');
        console.log(`Total Rooms: ${res.rows.length}`);

        if (res.rows.length === 0) {
            console.log("Table 'rooms' is empty.");
        } else {
            console.log("Printing all rooms:");
            res.rows.forEach(r => {
                console.log(`- Room: ${r.room_number}, Hotel: ${r.hotel_name}, Status: '${r.status}', Offer: ${r.offer_id}`);
            });
        }

        // Also check if status column exists properly
        const schema = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'status'");
        console.log("Status column type:", schema.rows[0]?.data_type);

        console.log("--- END DEBUG ---");
    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        process.exit();
    }
}

checkRooms();
