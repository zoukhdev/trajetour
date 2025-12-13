import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { testConnection, pool } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
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
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'capacitor://localhost',      // Capacitor iOS
        'http://localhost',            // Capacitor Android (HTTP)
        'https://localhost',           // Capacitor Android (HTTPS) - REQUIRED!
        'ionic://localhost',           // Ionic Capacitor
        config.clientUrl               // Vercel production URL
    ],
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

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

// TEMPORARY: Migration Route for Transactions Table
app.get('/api/migrate-transactions', async (req, res) => {
    try {
        console.log('🔄 Starting Transactions migration from API...');
        const client = await pool.connect();
        try {
            await client.query(`
                ALTER TABLE transactions 
                ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'DZD',
                ADD COLUMN IF NOT EXISTS amount_dzd DECIMAL(12,2),
                ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE CASCADE;
                
                -- Update existing rows: set amount_dzd = amount if null
                UPDATE transactions SET amount_dzd = amount WHERE amount_dzd IS NULL;
                
                -- Now make amount_dzd NOT NULL
                ALTER TABLE transactions ALTER COLUMN amount_dzd SET NOT NULL;
            `);
            res.send('✅ Transactions table updated successfully: Added currency, amount_dzd, and payment_id columns.');
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('❌ Migration failed:', error);
        res.status(500).send('Migration failed: ' + error.message);
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/suppliers', supplierContractsRoutes); // Handle /api/suppliers/:id/contracts
app.use('/api/supplier-contracts', supplierContractsRoutes);

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
                    ['aimen@wrtour.com', hashedPassword, 'Aimen', 'admin', permissions]
                );
                console.log('✅ Admin user verified/created (aimen@wrtour.com).');
            } catch (authErr) {
                console.error('⚠️ Failed to create admin user:', authErr);
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
                ADD COLUMN IF NOT EXISTS room_pricing JSONB DEFAULT '[]'::jsonb;
            `);
            console.log('✅ Offers table columns verified.');
        } catch (err) {
            console.error('❌ Offers table migration failed:', err);
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
