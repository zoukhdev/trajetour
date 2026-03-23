import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { testConnection, pool } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
// Registered routes
// TRIGGER_RESTART: 2026-01-05
import authRoutes from './routes/auth.js';
import clientsRoutes from './routes/clients.js';
import ordersRoutes from './routes/orders.js';
import paymentsRoutes from './routes/payments.js';
import roomsRoutes from './routes/rooms.js';
import offersRoutes from './routes/offers.js';
import agencyRoutes from './routes/agencies.js';
import expenseRoutes from './routes/expenses.js';
import userRoutes from './routes/users.js';
import transactionRoutes from './routes/transactions.js';
import bankAccountRoutes from './routes/bankAccounts.js';

import suppliersRouter from './routes/suppliers.js';
import supplierContractsRoutes from './routes/supplierContracts.js';
import auditLogsRouter from './routes/auditLogs.js';
import reportsRoutes from './routes/reports.js';
import notificationsRoutes from './routes/notifications.js';
import offerHotelsRoutes from './routes/offerHotels.js';
import passengersRoutes from './routes/passengers.js';
import masterRoutes from './routes/master.js';
import subscriptionRoutes from './routes/subscriptions.js';
import settingsRoutes from './routes/settings.js';

const app = express();

// Debug Middleware: Log Origin
app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log(`📨 Request from Origin: ${origin || 'Unknown'} -> ${req.method} ${req.path}`);
    next();
});

// ...




// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: true,
    credentials: true
}));

import { tenantMiddleware } from './middleware/tenant.js';

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Tenant/Subdomain resolution (MUST be before routes)
app.use(tenantMiddleware);

// Health check
app.get('/api/health', async (req, res) => {
    const dbConnected = await testConnection();
    res.json({
        status: 'ok',
        database: dbConnected ? 'connected' : 'disconnected',
        environment: config.nodeEnv
    });
});

// TEMPORARY: Migration Route for V2 Schema
app.get('/api/migrate-v2', async (req, res) => {
    try {
        console.log('🔄 Starting V2 migration from API...');
        const client = await pool.connect();
        try {
            await client.query(`
                ALTER TABLE orders 
                ADD COLUMN IF NOT EXISTS passengers JSONB DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS hotels JSONB DEFAULT '[]'::jsonb;
            `);
            res.send('✅ Schema updated successfully: Added passengers and hotels columns.');
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('❌ Migration failed:', error);
        res.status(500).send('Migration failed: ' + error.message);
    }
});

// TEMPORARY: Migration Route for Rooms
app.get('/api/migrate-rooms', async (req, res) => {
    try {
        console.log('🔄 Starting Rooms migration from API...');
        // Dynamically import to ensure fresh execution or just run query
        // We will run the query directly here for simplicity as the script is standalone
        const { migrate } = await import('./scripts/createRoomsTable.js');
        await migrate();
        res.send('✅ Rooms table created successfully.');
    } catch (error: any) {
        console.error('❌ Migration failed:', error);
        res.status(500).send('Migration failed: ' + error.message);
    }
});

// TEMPORARY: Migration Route for Client Auth
app.get('/api/migrate-auth', async (req, res) => {
    try {
        console.log('🔄 Starting Client Auth migration from API...');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Add user_id to clients
            await client.query(`
                ALTER TABLE clients 
                ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
            `);

            // 2. Update users role check to include 'client'
            // Need to drop constraint and re-add it. Constraint name is likely 'users_role_check'
            await client.query(`
                ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
            `);
            await client.query(`
                ALTER TABLE users ADD CONSTRAINT users_role_check 
                CHECK (role IN ('admin', 'staff', 'caisser', 'agent', 'client'));
            `);

            await client.query('COMMIT');
            res.send('✅ Client Auth migration successful: Added user_id to clients and updated role check.');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('❌ Migration failed:', error);
        res.status(500).send('Migration failed: ' + error.message);
    }
});

// TEMPORARY: Migration Route for Master Multi-Tenancy (Agencies Table)
app.get('/api/migrate-master', async (req, res) => {
    try {
        console.log('🔄 Starting Master DB migration (Agencies Table)...');
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS agencies (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    subdomain VARCHAR(100) UNIQUE NOT NULL,
                    db_url TEXT NOT NULL,
                    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
                    owner_email VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_agencies_subdomain ON agencies(subdomain);
            `);
            res.send('✅ Master DB migration successful: Agencies table and subdomain index created.');
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('❌ Migration failed:', error);
        res.status(500).send('Migration failed: ' + error.message);
    }
});

// TEMPORARY: Migration Route for Agency Auth
app.get('/api/migrate-agency-auth', async (req, res) => {
    try {
        console.log('🔄 Starting Agency Auth Migration...');
        const client = await pool.connect();
        try {
            // 1. Add user_id to agencies if not exists
            await client.query(`
                ALTER TABLE agencies 
                ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
            `);

            // 2. Update Role Check Constraint
            await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
            await client.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'staff', 'caisser', 'agent', 'client'))`);

            console.log('✅ Agency Auth Schema Migration Completed');
            res.send('Agency Auth Schema Migration Completed');
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('❌ Migration Failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// EMERGENCY: Force Create Admin User
app.get('/api/seed-admin', async (req, res) => {
    try {
        console.log('👤 Starting Manual Admin Seeding...');
        const bcrypt = (await import('bcrypt')).default; // Dynamic import for safety
        const hashedPassword = await bcrypt.hash('Aimen@2025', 10);
        const permissions = JSON.stringify(['manage_users', 'manage_business', 'manage_financials', 'view_reports']);

        await pool.query(
            `INSERT INTO users (email, password_hash, username, role, permissions) 
             VALUES ($1, $2, $3, $4, $5::jsonb)
             ON CONFLICT (email) 
             DO UPDATE SET password_hash = EXCLUDED.password_hash, permissions = EXCLUDED.permissions`,
            ['aimen@trajetour.com', hashedPassword, 'Aimen', 'admin', permissions]
        );

        console.log('✅ Admin user created/updated successfully.');
        res.status(200).json({
            success: true,
            message: 'Admin User (aimen@trajetour.com) Created/Reset Successfully!',
            password: 'Aimen@2025'
        });
    } catch (error: any) {
        console.error('❌ One-time seeding failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// TEMPORARY: Fix Rooms Schema - Add price and pricing columns
app.get('/api/fix-rooms-schema', async (req, res) => {
    try {
        console.log('🔄 Starting Rooms Schema Fix from API...');
        const client = await pool.connect();
        try {
            // Check current columns
            const columnsResult = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'rooms'
                ORDER BY ordinal_position;
            `);

            console.log('📋 Current rooms table columns:', columnsResult.rows);

            // Add missing columns
            await client.query(`
                ALTER TABLE rooms 
                ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{"adult": 0, "child": 0, "infant": 0}'::jsonb;
            `);

            console.log('✅ Columns added successfully');

            // Migrate existing data
            await client.query(`
                UPDATE rooms 
                SET pricing = jsonb_build_object(
                    'adult', COALESCE(price, 0), 
                    'child', 0, 
                    'infant', 0
                )
                WHERE pricing IS NULL 
                   OR pricing = '{}'::jsonb 
                   OR NOT (pricing ? 'adult' AND pricing ? 'child' AND pricing ? 'infant');
            `);

            console.log('✅ Data migration completed');

            // Verify final schema
            const finalColumnsResult = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'rooms'
                ORDER BY ordinal_position;
            `);

            res.json({
                success: true,
                message: '✅ Rooms schema fixed successfully!',
                before: columnsResult.rows,
                after: finalColumnsResult.rows
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('❌ Migration failed:', error);
        res.status(500).json({
            success: false,
            message: 'Migration failed: ' + error.message,
            error: error.stack
        });
    }
});

// DEBUG ROUTE - Check DB Schema
app.get('/api/debug/schema', async (req, res) => {
    try {
        const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
        const constraints = await pool.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'users'::regclass");

        res.json({
            columns: cols.rows,
            constraints: constraints.rows,
            env: process.env.NODE_ENV,
            dbUrl: process.env.DATABASE_URL ? 'Set' : 'Missing'
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.get('/api/debug-env', (req, res) => {
    res.json({
        databaseUrl: config.databaseUrl,
        masterDatabaseUrl: config.masterDatabaseUrl
    });
});

app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/offers', offerHotelsRoutes); // Hotel management for offers (Specific first)
app.use('/api/offers', offersRoutes);      // Generic offers CRUD (General second)
app.use('/api/agencies', agencyRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/suppliers', supplierContractsRoutes); // Handle /api/suppliers/:id/contracts
app.use('/api/supplier-contracts', supplierContractsRoutes);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/passengers', passengersRoutes);
app.use('/api/master', masterRoutes);
// Note: Other routes (users, agencies, expenses, etc.) follow the same pattern
// They need to be created following the clients.ts template

// Serve static files from React build (production only)
if (config.nodeEnv === 'production') {
    const path = await import('path');
    const fs = await import('fs');

    // Safer path resolution for Render/Container environments
    // Assumes server is started from the 'server' directory
    const clientBuildPath = path.join(process.cwd(), '../client/dist');

    console.log(`📂 Resolved Client Build Path: ${clientBuildPath}`);
    if (fs.existsSync(clientBuildPath)) {
        console.log('✅ Client dist folder found.');
    } else {
        console.error('❌ Client dist folder NOT found at:', clientBuildPath);
        // Fallback or attempt to find it 
        // console.log('Current CWD:', process.cwd());
    }

    // Serve static files with proper caching
    // disable 'index' so that requests to / fall through to the catch-all
    // where we explicitly set no-cache headers for index.html
    app.use(express.static(clientBuildPath, {
        maxAge: '1y',
        etag: true,
        index: false
    }));

    // Catch-all for client-side routing
    app.get('*', (req, res, next) => {
        // Log all requests hitting catch-all to debug static files
        // console.log(`⚠️ Catch-all hit: ${req.method} ${req.path}`);

        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return next();
        }

        // STATIC ASSET FALLBACK: 
        // Logic to prevent returning HTML for missing assets
        const isAsset = req.path.startsWith('/assets/') ||
            req.path.includes('.css') ||
            req.path.includes('.js') ||
            req.path.includes('.png') ||
            req.path.includes('.jpg') ||
            req.path.includes('.ico');

        if (isAsset) {
            console.error(`❌ 404 Asset Not Found (Fallthrough): ${req.path}`);
            return res.status(404).send('Asset not found');
        }

        // Serve index.html for SPA routing
        // DISABLE CACHE to prevent stale index.html pointing to old assets
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        console.log(`📄 Serving index.html for: ${req.path}`);
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
} else {
    // 404 handler for development
    app.use(notFoundHandler);
}

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${config.nodeEnv}`);
    console.log(`🌐 Client URL: ${config.clientUrl}`);
    console.log(`🔑 JWT Secret Present: ${!!config.jwt.secret}`);
    console.log(`💾 Database URL Present: ${!!config.databaseUrl}`);

    try {
        if (config.databaseUrl) {
            const url = new URL(config.databaseUrl);
            console.log(`🔍 Debug: DB Hostname detected as: '${url.hostname}'`);
        } else {
            console.log('⚠️ Debug: DATABASE_URL is empty.');
        }
    } catch (e) {
        console.error('❌ Debug: Could not parse DATABASE_URL. Is it a valid URI?');
    }

    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('⚠️  Database connection failed!');
    } else {
        // Auto-run migrations (Inline for reliability)
        try {
            console.log('🔄 Auto-running database migrations...');
            
            // 0. Ensure master agencies table has all multi-tenant + registration workflow columns
            try {
                await pool.query(`
                    ALTER TABLE agencies 
                    ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100) UNIQUE,
                    ADD COLUMN IF NOT EXISTS db_url TEXT,
                    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING',
                    ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'Basic',
                    ADD COLUMN IF NOT EXISTS subscription VARCHAR(50) DEFAULT 'Standard',
                    ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS neon_branch_id VARCHAR(100),
                    ADD COLUMN IF NOT EXISTS db_provisioned_at TIMESTAMP WITH TIME ZONE,
                    ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE,
                    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
                    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
                    ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
                    ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
                    ADD COLUMN IF NOT EXISTS address TEXT;
                `);
                // Fix status CHECK constraint to include all valid statuses
                await pool.query(`ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_status_check;`);
                await pool.query(`ALTER TABLE agencies ADD CONSTRAINT agencies_status_check CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING', 'REJECTED'));`);
                console.log('✅ Agencies table master schema verified.');
            } catch (err: any) {
                console.warn('⚠️ Agencies migration warning (non-fatal):', err.message);
            }

            // 0b. Auto-create agency_approvals table (required for upgrade plan workflow)
            try {
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS agency_approvals (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
                        type VARCHAR(50) NOT NULL DEFAULT 'UPGRADE_PLAN',
                        current_value TEXT,
                        requested_value TEXT,
                        status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
                        notes TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                `);
                await pool.query(`CREATE INDEX IF NOT EXISTS idx_agency_approvals_agency_id ON agency_approvals(agency_id);`);
                await pool.query(`CREATE INDEX IF NOT EXISTS idx_agency_approvals_status ON agency_approvals(status);`);
                console.log('✅ agency_approvals table verified.');
            } catch (err: any) {
                console.warn('⚠️ agency_approvals migration warning (non-fatal):', err.message);
            }

            // 1. Ensure Rooms Table Exists and has columns
            await pool.query(`
                    CREATE TABLE IF NOT EXISTS rooms (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        offer_id VARCHAR(255),
                        hotel_name VARCHAR(255) NOT NULL,
                        room_number VARCHAR(50) NOT NULL,
                        capacity INTEGER NOT NULL DEFAULT 4,
                        gender VARCHAR(20) CHECK (gender IN ('MEN', 'WOMEN', 'MIXED')) NOT NULL,
                        status VARCHAR(20) DEFAULT 'ACTIVE',
                        price DECIMAL(12,2) DEFAULT 0,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                `);

            // Add columns safely if they miss
            await pool.query(`
                    ALTER TABLE rooms 
                    ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS offer_id VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{"adult": 0, "child": 0, "infant": 0}'::jsonb;
                `);

            // Migrate existing price to adult price in pricing JSONB
            await pool.query(`
                    UPDATE rooms 
                    SET pricing = jsonb_build_object(
                        'adult', COALESCE(price, 0), 
                        'child', 0, 
                        'infant', 0
                    )
                    WHERE pricing IS NULL 
                       OR pricing = '{}'::jsonb 
                       OR NOT (pricing ? 'adult' AND pricing ? 'child' AND pricing ? 'infant');
                `);
            console.log('✅ Rooms table schema verified (price and pricing columns added).');

            // 3. Update Orders Table columns check
            await pool.query(`
                ALTER TABLE orders 
                ADD COLUMN IF NOT EXISTS passengers JSONB DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS hotels JSONB DEFAULT '[]'::jsonb;
            `);
            console.log('✅ Orders table columns verified.');

            // 4. Ensure Admin User Exists
            try {
                const bcrypt = (await import('bcrypt')).default;
                const hashedPassword = await bcrypt.hash('Aimen@2025', 10);
                const permissions = JSON.stringify(['manage_users', 'manage_business', 'manage_financials', 'view_reports']);

                await pool.query(
                    `INSERT INTO users (email, password_hash, username, role, permissions) 
                     VALUES ($1, $2, $3, $4, $5::jsonb)
                     ON CONFLICT (email) 
                     DO UPDATE SET password_hash = EXCLUDED.password_hash, permissions = EXCLUDED.permissions`,
                    ['aimen@trajetour.com', hashedPassword, 'Aimen', 'admin', permissions]
                );
                console.log('✅ Admin user verified/created (aimen@trajetour.com).');
            } catch (authErr) {
                console.error('⚠️ Failed to create admin user:', authErr);
            }

            // 4b. Update Users Table: add 'code' column and update 'role' constraint
            try {
                // Add code column if missing
                await pool.query(`
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS code VARCHAR(50),
                    ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL;
                `);
                await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_agency_id ON users(agency_id);`);

                // Update role constraint (Drop old one and add new one)
                // We attempt to drop standard names, if it fails then we catch individually
                try {
                    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
                } catch (e) { /* ignore */ }

                await pool.query(`
                    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'staff', 'caisser', 'agent', 'client'));
                `);

                console.log('✅ Users table schema updated (added code column and agent role).');
            } catch (err) {
                console.error('⚠️ Failed to update users table schema:', err);
            }
        } catch (err) {
            console.error('❌ Database migration failed:', err);
        }

            // 5. Update Offers Table columns check
            try {
                await pool.query(`
                    ALTER TABLE offers 
                    ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS inclusions JSONB DEFAULT '{}'::jsonb,
                    ADD COLUMN IF NOT EXISTS room_pricing JSONB DEFAULT '[]'::jsonb,
                    ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL;
                `);
                await pool.query(`CREATE INDEX IF NOT EXISTS idx_offers_agency_id ON offers(agency_id);`);
                console.log('✅ Offers table columns verified.');
            } catch (err) {
            console.error('❌ Offers table migration failed:', err);
        }

          // 4. Update Clients Table
        try {
            await pool.query(`
                ALTER TABLE clients 
                ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL;
            `);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);`);
            console.log('✅ Clients table verified.');
        } catch (err) {
            console.error('❌ Clients table migration failed:', err);
        }

        // 10. Create/Update offer_hotels table for age-based pricing from rooming list
        try {
            await pool.query(`
                -- Drop and recreate for clean structure
                DROP TABLE IF EXISTS offer_hotels CASCADE;
                
                CREATE TABLE offer_hotels (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
                    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(offer_id, room_id)
                );

                CREATE INDEX IF NOT EXISTS idx_offer_hotels_offer_id ON offer_hotels(offer_id);
                CREATE INDEX IF NOT EXISTS idx_offer_hotels_room_id ON offer_hotels(room_id);
            `);

            console.log('✅ Offer hotels table created/updated to link with rooming list');
        } catch (error) {
            console.error('❌ Offer hotels migration error:', error);
        }

        // 6. Update Payments Table checks
        try {
            await pool.query(`
                ALTER TABLE payments 
                ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES bank_accounts(id);
            `);
            console.log('✅ Payments table columns verified (account_id).');

            // 7. Update Transactions Table
            await pool.query(`
                ALTER TABLE transactions 
                ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
            `);
            console.log('✅ Transactions table columns verified (payment_id).');
        } catch (err) {
            console.error('❌ Payments/Transactions table migration failed:', err);
        }

        // 8.5. Add Audit Trail columns to payments table
        try {
            await pool.query(`
                ALTER TABLE payments 
                ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES users(id),
                ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;
            `);
            console.log('✅ Payments audit trail columns verified (validated_by, validated_at).');
        } catch (err) {
            console.error('❌ Payments audit trail migration failed:', err);
        }

        // 8. Create supplier_contracts table
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS supplier_contracts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
                    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('Rooms', 'Visa', 'Transportation', 'Flight', 'Food')),
                    date_purchased DATE NOT NULL DEFAULT CURRENT_DATE,
                    contract_value DECIMAL(12,2) NOT NULL,
                    payment_currency VARCHAR(3) NOT NULL CHECK (payment_currency IN ('DZD', 'EUR', 'USD', 'SAR')),
                    exchange_rate DECIMAL(10,4) NOT NULL DEFAULT 1.0,
                    contract_value_dzd DECIMAL(12,2) NOT NULL,
                    details JSONB NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create indexes if they don't exist
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_supplier_contracts_supplier ON supplier_contracts(supplier_id);
                CREATE INDEX IF NOT EXISTS idx_supplier_contracts_type ON supplier_contracts(contract_type);
                CREATE INDEX IF NOT EXISTS idx_supplier_contracts_date ON supplier_contracts(date_purchased DESC);
            `);

            console.log('✅ Supplier contracts table and indexes verified.');
        } catch (err) {
            console.error('❌ Supplier contracts table migration failed:', err);
        }
    }


});

export default app;
