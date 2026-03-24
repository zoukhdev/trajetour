import { masterPool } from '../config/tenantPool.js';

async function createTicketsTables() {
    try {
        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'open',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("support_tickets table created");

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS support_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
                sender_id UUID,
                role VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("support_messages table created");

    } catch (error) {
        console.error("Error creating tables", error);
    } finally {
        masterPool.end();
    }
}

createTicketsTables();
