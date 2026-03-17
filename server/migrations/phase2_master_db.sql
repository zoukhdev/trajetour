-- Phase 2: Create Agencies Table for Multi-Tenancy
-- This should be run on the main "Umbrella" database (Neon)

CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'agency1' for agency1.wrtour.com
    db_url TEXT NOT NULL, -- The specific Neon connection string for this agency
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    owner_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by subdomain (crucial for every request)
CREATE INDEX IF NOT EXISTS idx_agencies_subdomain ON agencies(subdomain);

-- Initial seeding for testing (Optional)
-- INSERT INTO agencies (name, subdomain, db_url) VALUES ('Demo Agency', 'demo', 'postgresql://...');
