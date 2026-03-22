import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_pMWw8Foc1CIQ@ep-ancient-cake-agf81841-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

const sql = `
-- Create Agency Approvals Table (for Upgrade Requests Point 2)
CREATE TABLE IF NOT EXISTS agency_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('UPGRADE_PLAN', 'CUSTOM_DOMAIN', 'OTHER')),
    current_value TEXT,
    requested_value TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support Tickets (Help Desk Point 4)
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PENDING', 'CLOSED')),
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support Messages (nested replies)
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_master_staff BOOLEAN DEFAULT FALSE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agency_approvals_status ON agency_approvals(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
`;

async function run() {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
        await client.query(sql);
        console.log('✅ Tables created successfully!');
    } catch (e) {
        console.error('❌ Failed creating tables:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
