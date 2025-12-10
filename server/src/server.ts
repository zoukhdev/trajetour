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

import suppliersRouter from './routes/suppliers.js';

const app = express();

// Debug Middleware: Log Origin
app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log(`📨 Request from Origin: ${origin || 'Unknown'} -> ${req.method} ${req.path}`);
    next();
});

// ...

app.use('/api/suppliers', suppliersRouter);


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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/offers', offersRoutes);

// Note: Other routes (users, agencies, expenses, etc.) follow the same pattern
// They need to be created following the clients.ts template

// Serve static files from React build (production only)
if (config.nodeEnv === 'production') {
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const clientBuildPath = path.join(__dirname, '../../client/dist');
    console.log('📂 Serving static files from:', clientBuildPath);

    // Serve static files with proper caching
    app.use(express.static(clientBuildPath, {
        maxAge: '1y',
        etag: true
    }));

    // Catch-all for client-side routing
    app.get('*', (req, res, next) => {
        // Log all requests hitting catch-all to debug static files
        if (req.path.includes('assets') || req.path.includes('.css') || req.path.includes('.js')) {
            console.log(`⚠️ Catch-all hit for asset: ${req.path}`);
        }

        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return next();
        }

        // STATIC ASSET FALLBACK: 
        // If request is for /assets/ and wasn't handled by express.static, 
        // it means the file is missing. Return 404 immediately.
        // This prevents returning index.html for missing CSS/JS, which causes MIME Type errors.
        if (req.path.startsWith('/assets/')) {
            return res.status(404).send('Asset not found');
        }

        // Asset check extension heuristic (backup)
        if (req.path.includes('.') && !req.path.endsWith('.html')) {
            return res.status(404).send('Asset not found');
        }

        // Serve index.html for SPA routing
        // DISABLE CACHE to prevent stale index.html pointing to old assets
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

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
            // 1. Force Reset Rooms Table (since it's new and causing schema issues)
            await pool.query('DROP TABLE IF EXISTS rooms CASCADE');
            console.log('🗑️ Dropped existing rooms table.');

            // 2. Create Rooms Table with VARCHAR offer_id
            await pool.query(`
                CREATE TABLE rooms (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    offer_id VARCHAR(255),
                    hotel_name VARCHAR(255) NOT NULL,
                    room_number VARCHAR(50) NOT NULL,
                    capacity INTEGER NOT NULL DEFAULT 4,
                    gender VARCHAR(20) CHECK (gender IN ('MEN', 'WOMEN', 'MIXED')) NOT NULL,
                    status VARCHAR(20) DEFAULT 'ACTIVE',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Rooms table recreated with VARCHAR offer_id.');

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
    }

    // Debug Static Files
    if (config.nodeEnv === 'production') {
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const fs = await import('fs');

        // Resolve paths
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // Assuming server is running from /dist/server.js, we need to go up to root then into client/dist
        const clientBuildPath = path.resolve(__dirname, '../../client/dist');

        console.log(`📂 Resolved Client Build Path: ${clientBuildPath}`);

        if (fs.existsSync(clientBuildPath)) {
            console.log('✅ Client dist folder found.');
            console.log('📂 Contents of dist:', fs.readdirSync(clientBuildPath));
            const assetsPath = path.join(clientBuildPath, 'assets');
            if (fs.existsSync(assetsPath)) {
                console.log('📂 Contents of dist/assets:', fs.readdirSync(assetsPath));
            } else {
                console.error('⚠️ assets folder NOT found in dist');
            }
        } else {
            console.error('❌ Client Build Path DOES NOT EXIST at:', clientBuildPath);
        }

        // Serve static files
        app.use(express.static(clientBuildPath, {
            maxAge: '1y',
            etag: true
        }));
    }
});

export default app;
