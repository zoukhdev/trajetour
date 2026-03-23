import { defaultPool as pool } from './config/database.js';
import fs from 'fs';

async function checkConstraints() {
    try {
        const res = await pool.query("SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE conrelid = 'agencies'::regclass");
        fs.writeFileSync('constraints.json', JSON.stringify(res.rows, null, 2), 'utf-8');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkConstraints();
