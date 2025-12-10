# Full-Stack Implementation Guide
## Wahat Alrajaa Tour Management System

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Client (Vite)                      │
│  - TypeScript, TailwindCSS                                  │
│  - JWT in HTTP-only cookies                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS/REST API
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              Node.js/Express API Server                     │
│  - JWT Auth Middleware                                      │
│  - Zod Validation                                           │
│  - Error Handling                                           │
│  - Audit Logging                                            │
└─────────────────┬───────────────────────────────────────────┘
                  │ SQL Queries
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   PostgreSQL Database                       │
│  - Users, Clients, Orders, Payments                         │
│  - Audit Logs                                               │
│  - Indexes for Performance                                  │
└─────────────────────────────────────────────────────────────┘

External Services:
- AWS S3 (File Storage with Pre-signed URLs)
- Redis (Optional: Caching & Sessions)
```

---

## 2. Implementation Roadmap

### Phase 1: Backend Foundation (Week 1-2)
1. Setup Node.js/Express server
2. Configure PostgreSQL database
3. Implement JWT authentication
4. Create core API endpoints

### Phase 2: Security & Validation (Week 2-3)
5. Add Zod validation
6. Implement error handling
7. Setup CORS and security headers
8. Add audit logging

### Phase 3: Performance & Testing (Week 3-4)
9. Implement pagination
10. Add code splitting
11. Setup testing framework
12. Optimize queries

### Phase 4: Advanced Features (Week 4-6)
13. File storage with S3
14. Customer portal
15. GraphQL implementation
16. Web Workers for heavy tasks

---

## 3. Code Implementation

### A. Backend Setup

#### Project Structure
```
server/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── clients.ts
│   │   ├── orders.ts
│   │   └── users.ts
│   ├── models/
│   │   └── schema.sql
│   ├── services/
│   │   ├── auditLog.ts
│   │   └── s3.ts
│   ├── utils/
│   │   └── jwt.ts
│   └── server.ts
├── package.json
└── tsconfig.json
```

#### Database Schema
```sql
-- PostgreSQL Schema
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'caisser')),
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('Individual', 'Entreprise')),
    passport_number VARCHAR(50),
    passport_expiry DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    agency_id UUID,
    items JSONB NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Payé', 'Non payé', 'Partiel')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    exchange_rate DECIMAL(10,4) NOT NULL,
    amount_dzd DECIMAL(12,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    is_validated BOOLEAN DEFAULT NULL,
    payment_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    changes JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

#### Server Configuration
```typescript
// server/src/config/env.ts
import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'wahat_tour',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'change-this-secret',
        expiresIn: '7d'
    },
    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        s3Bucket: process.env.AWS_S3_BUCKET
    }
};

// server/src/config/database.ts
import { Pool } from 'pg';
import { config } from './env';

export const pool = new Pool(config.database);

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    process.exit(-1);
});
```

#### JWT Authentication Middleware
```typescript
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        permissions: string[];
    };
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, config.jwt.secret) as {
            id: string;
            role: string;
            permissions: string[];
        };

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const requirePermission = (permission: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.role === 'admin' || req.user.permissions.includes(permission)) {
            next();
        } else {
            res.status(403).json({ error: 'Insufficient permissions' });
        }
    };
};
```

#### Zod Validation Schemas
```typescript
// server/src/middleware/validation.ts
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const clientSchema = z.object({
    fullName: z.string().min(2).max(255),
    mobileNumber: z.string().regex(/^\+?[0-9]{10,15}$/),
    type: z.enum(['Individual', 'Entreprise']),
    passportNumber: z.string().optional(),
    passportExpiry: z.string().optional()
});

export const orderSchema = z.object({
    clientId: z.string().uuid(),
    agencyId: z.string().uuid().optional(),
    items: z.array(z.object({
        description: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        amount: z.number().positive()
    })).min(1),
    totalAmount: z.number().positive(),
    notes: z.string().optional()
});

export const paymentSchema = z.object({
    orderId: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.enum(['DZD', 'EUR', 'USD', 'SAR']),
    exchangeRate: z.number().positive(),
    method: z.enum(['Cash', 'CCP', 'Baridimob', 'Bank Transfer']),
    paymentDate: z.string().datetime()
});

export const validate = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors
                });
            } else {
                next(error);
            }
        }
    };
};
```

#### Authentication Routes
```typescript
// server/src/routes/auth.ts
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { config } from '../config/env';
import { z } from 'zod';
import { validate } from '../middleware/validation';

const router = express.Router();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            'SELECT id, email, password_hash, role, permissions FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                permissions: user.permissions
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: config.nodeEnv === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            }
        });
    } catch (error) {
        next(error);
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

export default router;
```

#### Orders API with Pagination
```typescript
// server/src/routes/orders.ts
import express from 'express';
import { pool } from '../config/database';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { orderSchema } from '../middleware/validation';
import { logAudit } from '../services/auditLog';

const router = express.Router();

router.get('/',
    authMiddleware,
    requirePermission('manage_business'),
    async (req, res, next) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const countResult = await pool.query('SELECT COUNT(*) FROM orders');
            const total = parseInt(countResult.rows[0].count);

            const result = await pool.query(
                `SELECT o.*, c.full_name as client_name,
                        json_agg(p.*) as payments
                 FROM orders o
                 LEFT JOIN clients c ON o.client_id = c.id
                 LEFT JOIN payments p ON o.id = p.order_id
                 GROUP BY o.id, c.full_name
                 ORDER BY o.created_at DESC
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );

            res.json({
                data: result.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post('/',
    authMiddleware,
    requirePermission('manage_business'),
    validate(orderSchema),
    async (req, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { clientId, agencyId, items, totalAmount, notes } = req.body;

            const result = await client.query(
                `INSERT INTO orders (client_id, agency_id, items, total_amount, status, created_by, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [clientId, agencyId, JSON.stringify(items), totalAmount, 'Non payé', req.user?.id, notes]
            );

            const order = result.rows[0];

            await logAudit(client, {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'order',
                entityId: order.id,
                changes: order,
                ipAddress: req.ip
            });

            await client.query('COMMIT');
            res.status(201).json(order);
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
);

export default router;
```

#### Audit Logging Service
```typescript
// server/src/services/auditLog.ts
import { PoolClient } from 'pg';

interface AuditLogEntry {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: any;
    ipAddress?: string;
}

export async function logAudit(
    client: PoolClient,
    entry: AuditLogEntry
): Promise<void> {
    await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
            entry.userId,
            entry.action,
            entry.entityType,
            entry.entityId,
            JSON.stringify(entry.changes),
            entry.ipAddress
        ]
    );
}
```

#### S3 File Storage with Pre-signed URLs
```typescript
// server/src/services/s3.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env';

const s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId!,
        secretAccessKey: config.aws.secretAccessKey!
    }
});

export async function generateUploadUrl(
    fileName: string,
    fileType: string,
    userId: string
): Promise<{ uploadUrl: string; fileKey: string }> {
    const fileKey = `uploads/${userId}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: fileKey,
        ContentType: fileType
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600 // 1 hour
    });

    return { uploadUrl, fileKey };
}

export async function generateDownloadUrl(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: fileKey
    });

    return await getSignedUrl(s3Client, command, {
        expiresIn: 3600 // 1 hour
    });
}
```

#### Error Handler Middleware
```typescript
// server/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error:', err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
            ...(config.nodeEnv === 'development' && { stack: err.stack })
        });
    }

    // Database errors
    if (err.name === 'QueryFailedError') {
        return res.status(500).json({ error: 'Database query failed' });
    }

    // Default error
    res.status(500).json({
        error: 'Internal server error',
        ...(config.nodeEnv === 'development' && { message: err.message, stack: err.stack })
    });
};
```

#### Main Server Setup
```typescript
// server/src/server.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import ordersRoutes from './routes/orders';
import clientsRoutes from './routes/clients';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.nodeEnv === 'production'
        ? 'https://yourdomain.com'
        : 'http://localhost:5173',
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/clients', clientsRoutes);

// Error handling
app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
```

---

### B. Client-Side Implementation

#### React Error Boundary
```typescript
// client/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // Log to error tracking service (e.g., Sentry)
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">
                            Something went wrong
                        </h1>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
```

#### Code Splitting with React Router
```typescript
// client/src/App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const OrderList = lazy(() => import('./pages/Orders/OrderList'));
const ClientList = lazy(() => import('./pages/Clients/ClientList'));

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
);

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/orders" element={<OrderList />} />
                        <Route path="/clients" element={<ClientList />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
```

#### Client-Side Validation with Zod
```typescript
// client/src/schemas/client.ts
import { z } from 'zod';

export const clientFormSchema = z.object({
    fullName: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(255, 'Name too long'),
    mobileNumber: z.string()
        .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
    type: z.enum(['Individual', 'Entreprise']),
    passportNumber: z.string().optional(),
    passportExpiry: z.string().optional()
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

// Usage in form component
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const ClientForm = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
        resolver: zodResolver(clientFormSchema)
    });

    const onSubmit = async (data: ClientFormData) => {
        try {
            await api.post('/clients', data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <input {...register('fullName')} />
            {errors.fullName && <span>{errors.fullName.message}</span>}
        </form>
    );
};
```

#### Optimized Filtering with useMemo
```typescript
// client/src/pages/Orders/OrderList.tsx
import { useMemo, useState } from 'react';

const OrderList = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = order.clientName
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || 
                order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    return (
        <div>
            <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
            />
            {/* Render filteredOrders */}
        </div>
    );
};
```

#### Skeleton Loading Component
```typescript
// client/src/components/SkeletonLoader.tsx
export const TableSkeleton = () => (
    <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4 p-4 border-b">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
        ))}
    </div>
);
```

---

### C. Testing Setup

#### Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html']
        }
    }
});

// src/test/setup.ts
import '@testing-library/jest-dom';

// src/utils/calculations.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTotal, calculateDiscount } from './calculations';

describe('Order Calculations', () => {
    it('should calculate order total correctly', () => {
        const items = [
            { quantity: 2, unitPrice: 100, amount: 200 },
            { quantity: 1, unitPrice: 50, amount: 50 }
        ];
        expect(calculateTotal(items)).toBe(250);
    });

    it('should apply percentage discount correctly', () => {
        const total = 1000;
        const discount = { type: 'Percentage', value: 10 };
        expect(calculateDiscount(total, discount)).toBe(900);
    });
});
```

---

### D. Web Worker for PDF Generation
```typescript
// client/src/workers/pdf.worker.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

self.onmessage = (event: MessageEvent) => {
    const { type, data } = event.data;

    if (type === 'GENERATE_INVOICE') {
        const pdf = new jsPDF();
        
        pdf.text('Invoice', 20, 20);
        autoTable(pdf, {
            head: [['Item', 'Quantity', 'Price', 'Total']],
            body: data.items.map((item: any) => [
                item.description,
                item.quantity,
                item.unitPrice,
                item.amount
            ]),
            startY: 30
        });

        const pdfBlob = pdf.output('blob');
        self.postMessage({ type: 'PDF_READY', blob: pdfBlob });
    }
};

// Usage in component
const generatePDF = () => {
    const worker = new Worker(new URL('./workers/pdf.worker.ts', import.meta.url));
    
    worker.postMessage({
        type: 'GENERATE_INVOICE',
        data: { items: order.items }
    });

    worker.onmessage = (event) => {
        if (event.data.type === 'PDF_READY') {
            const url = URL.createObjectURL(event.data.blob);
            window.open(url);
        }
    };
};
```

---

## 4. Customer Portal Architecture

```
customer-portal/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── MyOrders.tsx
│   │   └── MyPayments.tsx
│   ├── App.tsx
│   └── main.tsx

// Separate subdomain: portal.yourdomain.com
// Read-only access to client's own data
// JWT-based authentication for clients
```

---

## 5. GraphQL Implementation (Proof of Concept)

```typescript
// server/src/graphql/schema.ts
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

const typeDefs = `#graphql
  type Report {
    period: String!
    revenue: Float!
    expenses: Float!
    netProfit: Float!
    topClients: [ClientSummary!]!
    paymentMethods: [PaymentMethodBreakdown!]!
  }

  type Query {
    reports(startDate: String!, endDate: String!): Report!
  }
`;

const resolvers = {
    Query: {
        reports: async (_: any, { startDate, endDate }: any) => {
            // Single optimized query instead of multiple REST calls
            const result = await pool.query(`
                SELECT 
                    SUM(o.total_amount) as revenue,
                    SUM(e.amount_dzd) as expenses,
                    json_agg(DISTINCT c.*) as top_clients
                FROM orders o
                LEFT JOIN expenses e ON e.created_at BETWEEN $1 AND $2
                LEFT JOIN clients c ON o.client_id = c.id
                WHERE o.created_at BETWEEN $1 AND $2
            `, [startDate, endDate]);

            return result.rows[0];
        }
    }
};
```

---

## 6. Deployment Checklist

```bash
# Environment variables (.env.production)
NODE_ENV=production
JWT_SECRET=strong-random-secret
DB_HOST=your-db-host
AWS_S3_BUCKET=your-bucket

# Database migration
npm run migrate:up

# Build
npm run build

# Start
npm start
```

---

**Implementation Time: 4-6 weeks**  
**Developer Resources: 2-3 developers**

This guide provides production-ready code for secure, scalable implementation.
