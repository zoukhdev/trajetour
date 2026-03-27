# Trajetour - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Setup & Installation](#setup--installation)
8. [Development](#development)
9. [Deployment](#deployment)
10. [Mobile Application](#mobile-application)
11. [User Roles & Permissions](#user-roles--permissions)
12. [Troubleshooting](#troubleshooting)

---

## 🌟 Project Overview

**Trajetour Management System** is a comprehensive full-stack web and mobile application designed for managing travel agency operations, specifically focused on Omra, Haj, and organized tours.

### Purpose
- Manage clients, bookings, and travel orders
- Track payments and financial transactions
- Handle multi-currency operations (DZD, EUR, USD, SAR)
- Generate detailed reports and analytics
- Manage agencies, suppliers, and hotel rooms
- Mobile-first design with Android application

### Key Metrics
- **Backend Routes:** 12 comprehensive API endpoints
- **Database Tables:** 14 entities
- **Frontend Pages:** 35+ pages
- **Supported Currencies:** 4 (DZD, EUR, USD, SAR)
- **User Roles:** 3 (Admin, Staff, Caisser)

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI Framework |
| **TypeScript** | 5.9.3 | Type Safety |
| **Vite** | 7.2.4 | Build Tool |
| **React Router** | 7.10.1 | Routing |
| **Tailwind CSS** | 3.4.17 | Styling |
| **Axios** | 1.13.2 | HTTP Client |
| **Recharts** | 3.5.1 | Data Visualization |
| **jsPDF** | 3.0.4 | PDF Generation |
| **Lucide React** | 0.555.0 | Icons |

### Mobile (Capacitor)
| Technology | Version | Purpose |
|------------|---------|---------|
| **@capacitor/core** | 7.4.4 | Native Bridge |
| **@capacitor/android** | 7.4.4 | Android Platform |
| **@capacitor/app** | 7.1.0 | App Lifecycle |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | ≥18.0.0 | Runtime |
| **Express** | 4.18.2 | Web Framework |
| **TypeScript** | 5.3.3 | Type Safety |
| **PostgreSQL** | 8.11.3 | Database (via Neon) |
| **bcrypt** | 5.1.1 | Password Hashing |
| **JWT** | 9.0.2 | Authentication |
| **Helmet** | 7.1.0 | Security Headers |
| **CORS** | 2.8.5 | Cross-Origin Requests |
| **Zod** | 3.22.4 | Validation |
| **Cloudinary** | 2.0.1 | Image Storage |
| **Multer** | 1.4.5-lts.1 | File Upload |

### Infrastructure
- **Database:** Neon PostgreSQL (Serverless)
- **Backend Hosting:** Render
- **File Storage:** Cloudinary
- **Version Control:** Git

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Web App     │  │  Android     │  │   iOS        │     │
│  │  (React)     │  │  (Capacitor) │  │ (Future)     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         └──────────────────┴──────────────────┘             │
│                          │                                  │
│                    Axios HTTP Client                        │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER                                │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐    │
│  │  Express Server (Node.js + TypeScript)             │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │    │
│  │  │ Middleware  │  │   Routes    │  │  Services │  │    │
│  │  │ - Auth      │  │ - 12 APIs   │  │           │  │    │
│  │  │ - CORS      │  │             │  │           │  │    │
│  │  │ - Validation│  │             │  │           │  │    │
│  │  └─────────────┘  └─────────────┘  └───────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐         ┌──────────────────────┐      │
│  │  Neon           │         │   Cloudinary         │      │
│  │  PostgreSQL     │         │   (Image Storage)    │      │
│  │  - 14 Tables    │         └──────────────────────┘      │
│  │  - Triggers     │                                        │
│  │  - Indexes      │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
client/src/
├── components/        # Reusable UI components
│   ├── Modal.tsx
│   ├── PassengerForm.tsx
│   ├── ExchangeRateManager.tsx
│   └── DataMigration.tsx
├── context/          # React Context (State Management)
│   ├── AuthContext.tsx
│   ├── DataContext.tsx        # Central data management
│   ├── LanguageContext.tsx    # i18n
│   └── ExchangeRateContext.tsx
├── pages/            # Route pages (35+)
│   ├── Dashboard.tsx
│   ├── Orders/
│   ├── Clients/
│   ├── Agencies/
│   └── ...
├── services/         # API integration
│   └── api.ts
└── types/            # TypeScript definitions
    └── index.ts
```

### Backend Architecture

```
server/src/
├── routes/           # API endpoints (12)
│   ├── auth.ts
│   ├── clients.ts
│   ├── orders.ts
│   ├── payments.ts
│   ├── offers.ts
│   ├── rooms.ts
│   ├── agencies.ts
│   ├── expenses.ts
│   ├── transactions.ts
│   ├── bankAccounts.ts
│   ├── users.ts
│   └── suppliers.ts
├── middleware/       # Request processing
│   ├── auth.ts
│   ├── errorHandler.ts
│   └── validation.ts
├── models/           # Database schema
│   └── schema.sql
├── config/           # Configuration
│   ├── database.ts
│   └── env.ts
└── server.ts         # Main application
```

---

## ✨ Features

### 1. **Client Management**
- Create and manage individual and enterprise clients
- Track client information, passports, and expiry dates
- Client history and booking records

### 2. **Order Management**
- Create orders for Omra, Haj, organized tours, visas
- Multi-item orders with passengers
- Hotel room assignments
- Order status tracking (Paid, Unpaid, Partial)
- Order history and modifications

### 3. **Payment System**
- Multi-currency support (DZD, EUR, USD, SAR)
- Real-time exchange rate conversion
- Multiple payment methods (Cash, CCP, Baridimob, Bank Transfer)
- Payment validation workflow
- Partial payment tracking

### 4. **Financial Management**
- Bank account management (Caisse & Bank accounts)
- Dynamic balance calculation from transactions
- Transaction tracking (income/expenses)
- Expense categorization (Bureau, Salaire, Transport, Autre)
- Multi-currency account support

### 5. **Offers & Packages**
- Create travel packages and offers
- Room pricing configuration
- Capacity management
- Inclusions & exclusions
- Draft/Active/Archived status

### 6. **Room Management**
- Hotel room allocation
- Gender-based room assignment (MEN, WOMEN, MIXED)
- Occupancy tracking
- Room pricing by age group (Adult, Child, Infant)

### 7. **Agency Management**
- Partner agency tracking
- Credit system for agencies
- Subscription tiers (Standard, Premium, Gold)
- Agency-specific invoicing

### 8. **Reporting & Analytics**
- Financial reports
- Sales analytics
- Payment tracking
- Transaction history
- Exportable reports (PDF)

### 9. **User Management**
-  Multi-role system (Admin, Staff, Caisser)
- Permission-based access control
- User activity tracking

### 10. **Internationalization**
- Multi-language support (French/Arabic)
- RTL support for Arabic
- Currency localization

### 11. **Mobile Application**
- Android APK generation via Capacitor
- Responsive design
- Offline-first capabilities (planned)

---

## 🗄️ Database Schema

### Core Tables

#### 1. **users**
User accounts and authentication
```sql
- id: UUID (PK)
- username: VARCHAR(100) UNIQUE
- email: VARCHAR(255) UNIQUE
- password_hash: VARCHAR(255)
- role: VARCHAR(20) ['admin', 'staff', 'caisser']
- permissions: JSONB
- avatar: TEXT
```

#### 2. **clients**
Customer database
```sql
- id: UUID (PK)
- full_name: VARCHAR(255)
- mobile_number: VARCHAR(20)
- type: VARCHAR(20) ['Individual', 'Entreprise']
- passport_number: VARCHAR(50)
- passport_expiry: DATE
```

#### 3. **agencies**
Partner agencies
```sql
- id: UUID (PK)
- name: VARCHAR(255)
- type: VARCHAR(20) ['Agence', 'Rabbateur']
- subscription: VARCHAR(20) ['Standard', 'Premium', 'Gold']
- credit_start: DECIMAL(12,2)
- current_credit: DECIMAL(12,2)
```

#### 4. **orders**
Travel bookings
```sql
- id: UUID (PK)
- client_id: UUID (FK → clients)
- agency_id: UUID (FK → agencies)
- items: JSONB
- passengers: JSONB
- hotels: JSONB
- total_amount: DECIMAL(12,2)
- status: VARCHAR(20) ['Payé', 'Non payé', 'Partiel']
```

#### 5. **payments**
Payment records
```sql
- id: UUID (PK)
- order_id: UUID (FK → orders)
- amount: DECIMAL(12,2)
- currency: VARCHAR(3) ['DZD', 'EUR', 'USD', 'SAR']
- exchange_rate: DECIMAL(10,4)
- amount_dzd: DECIMAL(12,2)
- method: VARCHAR(50)
- is_validated: BOOLEAN
- payment_date: TIMESTAMP
```

#### 6. **transactions**
Financial transactions
```sql
- id: UUID (PK)
- type: VARCHAR(10) ['IN', 'OUT']
- amount: DECIMAL(12,2)
- currency: VARCHAR(3)
- amount_dzd: DECIMAL(12,2)
- source: VARCHAR(50) ['Order', 'Expense']
- reference_id: UUID
- account_id: UUID (FK → bank_accounts)
- payment_id: UUID (FK → payments)
```

#### 7. **bank_accounts**
Bank and cash accounts
```sql
- id: UUID (PK)
- name: VARCHAR(255)
- type: VARCHAR(20) ['Caisse', 'Bank']
- balance: DECIMAL(12,2)
- currency: VARCHAR(3)
- account_number: VARCHAR(100)
- is_default: BOOLEAN
```

#### 8. **expenses**
Business expenses
```sql
- id: UUID (PK)
- designation: VARCHAR(255)
- category: VARCHAR(50) ['Bureau', 'Salaire', 'Transport', 'Autre']
- amount: DECIMAL(12,2)
- currency: VARCHAR(3)
- amount_dzd: DECIMAL(12,2)
- account_id: UUID
```

#### 9. **offers**
Travel packages
```sql
- id: UUID (PK)
- title: VARCHAR(255)
- type: VARCHAR(50) ['Omra', 'Haj', 'Voyage Organisé', 'Visa', 'Autre']
- destination: VARCHAR(255)
- price: DECIMAL(12,2)
- start_date: DATE
- end_date: DATE
- hotel: VARCHAR(255)
- transport: VARCHAR(50)
- capacity: INTEGER
- room_pricing: JSONB
- status: VARCHAR(20) ['Active', 'Draft', 'Archived']
```

#### 10. **rooms**
Hotel room inventory
```sql
- id: UUID (PK)
- offer_id: UUID (FK → offers)
- hotel_name: VARCHAR(255)
- room_number: VARCHAR(50)
- capacity: INTEGER
- gender: VARCHAR(20) ['MEN', 'WOMEN', 'MIXED']
- price: DECIMAL(12,2)
- status: VARCHAR(20)
```

#### 11. **suppliers**
Service providers
```sql
- id: UUID (PK)
- name: VARCHAR(255)
- contact_person: VARCHAR(255)
- phone: VARCHAR(20)
- email: VARCHAR(255)
- service_type: VARCHAR(100)
```

#### 12. **discounts**
Promotional discounts
```sql
- id: UUID (PK)
- title: VARCHAR(255)
- reference: VARCHAR(50) UNIQUE
- type: VARCHAR(20) ['Percentage', 'Amount']
- value: DECIMAL(10,2)
- start_date: DATE
- end_date: DATE
- active: BOOLEAN
```

#### 13. **taxes**
Tax configurations
```sql
- id: UUID (PK)
- reference: VARCHAR(50) UNIQUE
- name: VARCHAR(255)
- type: VARCHAR(20) ['Percentage', 'Amount']
- value: DECIMAL(10,2)
- active: BOOLEAN
```

#### 14. **audit_logs**
System audit trail
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- action: VARCHAR(50)
- entity_type: VARCHAR(50)
- entity_id: UUID
- changes: JSONB
- ip_address: INET
```

### Database Features
- ✅ UUID primary keys for all tables
- ✅ Automatic timestamps (created_at, updated_at)
- ✅ Foreign key constraints with CASCADE/SET NULL
- ✅ Check constraints for enums
- ✅ Indexes on frequently queried columns
- ✅ Triggers for automatic updated_at updates
- ✅ JSONB for flexible data structures

---

## 🔌 API Endpoints

### Base URL
- **Development:** `http://localhost:3001/api`
- **Production:** `https://your-render-url.onrender.com/api`

### Authentication

#### POST /auth/login
Login user
```json
Request:
{
  "email": "admin@wrtour.com",
  "password": "password123"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "admin@wrtour.com",
    "role": "admin"
  }
}
```

### Clients

#### GET /clients?page=1&limit=50
Get all clients (paginated)

#### GET /clients/:id
Get client by ID

#### POST /clients
Create new client
```json
{
  "fullName": "John Doe",
  "mobileNumber": "+213555123456",
  "type": "Individual",
  "passportNumber": "AB123456",
  "passportExpiry": "2025-12-31"
}
```

#### PUT /clients/:id
Update client

#### DELETE /clients/:id
Delete client

### Orders

#### GET /orders?page=1&limit=50
Get all orders

#### GET /orders/:id
Get order by ID

#### POST /orders
Create new order
```json
{
  "clientId": "uuid",
  "agencyId": "uuid",
  "items": [{
    "offerId": "uuid",
    "quantity": 1,
    "price": 250000
  }],
  "passengers": [],
  "hotels": [],
  "totalAmount": 250000,
  "status": "Non payé"
}
```

#### PUT /orders/:id
Update order

### Payments

#### POST /payments
Create payment
```json
{
  "orderId": "uuid",
  "amount": 100000,
  "currency": "DZD",
  "exchangeRate": 1.0,
  "method": "Cash",
  "paymentDate": "2025-12-12T10:00:00Z",
  "accountId": "uuid"
}
```

#### PUT /payments/:id/validate
Validate payment
```json
{
  "isValidated": true
}
```

### Offers

#### GET /offers
Get all offers

#### POST /offers
Create offer

#### PUT /offers/:id
Update offer

####DELETE /offers/:id
Delete offer

### Rooms

#### GET /rooms?offerId=uuid
Get rooms by offer

#### POST /rooms
Create room

#### PUT /rooms/:id
Update room

#### DELETE /rooms/:id
Delete room

### Agencies

#### GET /agencies?page=1&limit=50
Get all agencies

#### POST /agencies
Create agency

#### PUT /agencies/:id
Update agency

#### DELETE /agencies/:id
Delete agency

### Expenses

#### GET /expenses?page=1&limit=50
Get all expenses

#### POST /expenses
Create expense

#### PUT /expenses/:id
Update expense

#### DELETE /expenses/:id
Delete expense

### Transactions

#### GET /transactions?page=1&limit=100
Get all transactions

#### POST /transactions
Create transaction

#### DELETE /transactions/:id
Delete transaction

### Bank Accounts

#### GET /bank-accounts
Get all bank accounts

#### POST /bank-accounts
Create bank account

#### PUT /bank-accounts/:id
Update bank account

#### DELETE /bank-accounts/:id
Delete bank account

### Users

#### GET /users?page=1&limit=50
Get all users

#### POST /users
Create user

#### PUT /users/:id
Update user

#### DELETE /users/:id
Delete user

### Suppliers

#### GET /suppliers
Get all suppliers

#### POST /suppliers
Create supplier

#### PUT /suppliers/:id
Update supplier

#### DELETE /suppliers/:id
Delete supplier

### Health Check

#### GET /health
Check API health and database connection
```json
Response:
{
  "status": "ok",
  "database": "connected",
  "environment": "production"
}
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js:** ≥18.0.0
- **npm:** ≥9.0.0
- **PostgreSQL:** Neon database account
- **Git:** Latest version

### Environment Variables

#### Client (.env.local)
```bash
VITE_API_URL=http://localhost:3001/api
```

#### Server (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Application
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:5173
```

### Installation Steps

#### 1. Clone Repository
```bash
git clone https://github.com/your-username/WRtour.git
cd WRtour
```

#### 2. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

#### 3. Database Setup

Create a Neon PostgreSQL database and run the schema:
```bash
cd server
psql $DATABASE_URL < src/models/schema.sql
```

Or use the auto-migration on server startup (recommended).

#### 4. Start Development Servers

**Backend (Terminal 1):**
```bash
cd server
npm run dev
```
Server runs on `http://localhost:3001`

**Frontend (Terminal 2):**
```bash
cd client
npm run dev
```
Client runs on `http://localhost:5173`

#### 5. Default Login
```
Email: zoukh@trajetour.com
Password: Zoukh@2026
```

---

## 💻 Development

### Available Scripts

#### Client
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

#### Server
```bash
npm run dev          # Start development server (with watch)
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run db:migrate   # Run database migrations
```

### Code Structure

#### Adding a New API Route
1. Create route file in `server/src/routes/`
2. Define endpoints and validation
3. Register route in `server/src/server.ts`

Example:
```typescript
// server/src/routes/example.ts
import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  // Logic here
});

export default router;
```

```typescript
// server/src/server.ts
import exampleRoutes from './routes/example.js';
app.use('/api/example', exampleRoutes);
```

#### Adding a New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`

Example:
```tsx
// client/src/App.tsx
import ExamplePage from './pages/ExamplePage';

<Route path="/example" element={<ExamplePage />} />
```

### State Management

The application uses **React Context API** for global state:

**DataContext** (`client/src/context/DataContext.tsx`):
- Manages all business data (clients, orders, payments, etc.)
- Provides CRUD operations
- Syncs with backend API
- Dynamic balance calculation via useMemo

**AuthContext** (`client/src/context/AuthContext.tsx`):
- User authentication state
- Login/logout functionality
- JWT token management

**ExchangeRateContext** (`client/src/context/ExchangeRateContext.tsx`):
- Currency conversion rates
- Real-time rate updates

---

## 🌐 Deployment

### Backend Deployment (Render)

#### Configuration
File: `server/render.yaml`

#### Steps
1. Connect GitHub repository to Render
2. Create new Web Service
3. Set environment variables
4. Deploy from `main` branch

#### Environment Variables (Required)
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `CLIENT_URL` - Frontend URL (for CORS)
- `NODE_ENV=production`

#### Auto-Deploy
Render automatically deploys on push to `main` branch.

### Frontend Deployment (Vercel/Netlify)

#### Build Settings
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

#### Environment Variables
- `VITE_API_URL` - Backend API URL

### Database (Neon)

1. Create Neon project: https://neon.tech
2. Copy connection string
3. Add to `DATABASE_URL` environment variable
4. Server auto-runs migrations on startup

---

## 📱 Mobile Application

### Android APK Generation

#### Setup
1. Ensure Capacitor is configured:
```bash
cd client
npx cap init
```

2. Build web app:
```bash
npm run build
```

3. Sync with Capacitor:
```bash
npx cap sync android
```

4. Open in Android Studio:
```bash
npx cap open android
```

5. Build APK in Android Studio:
   - Build → Generate Signed Bundle / APK
   - Select APK
   - Configure signing
   - Build

### Capacitor Configuration

File: `client/capacitor.config.ts`
```typescript
{
  appId: 'com.wahatalrajaa.tour',
  appName: 'Wahat Alrajaa Tour',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
}
```

### Mobile Features
- ✅ Offline-capable (PWA)
- ✅ Native Android app
- ✅ Responsive design
- ✅ Touch-optimized UI
- 🔜 Push notifications (planned)
- 🔜 iOS support (planned)

---

## 👥 User Roles & Permissions

### Role Hierarchy

#### 1. **Admin**
Full system access
- Manage users
- Manage all business entities
- View all reports
- Configure system settings
- Approve payments
- Manage agencies and suppliers

#### 2. **Staff**
Operational access
- Create/edit orders
- Manage clients
- Record payments
- View reports (limited)
- Cannot manage users or settings

#### 3. **Caisser**
Financial access
- Record payments
- View transactions
- Access financial reports
- Cannot create orders or manage clients

### Permission System

Permissions are stored as JSONB array in `users` table:
```json
{
  "permissions": [
    "manage_users",
    "manage_business",
    "manage_financials",
    "view_reports"
  ]
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error
**Problem:** `⚠️ Database connection failed`

**Solution:**
- Verify `DATABASE_URL` is correct
- Check Neon database is running
- Ensure SSL mode is enabled: `?sslmode=require`
- Check firewall/network settings

#### 2. CORS Error
**Problem:** `Access-Control-Allow-Origin` error

**Solution:**
- Add frontend URL to `CLIENT_URL` environment variable
- Verify CORS configuration in `server/src/server.ts`
- Check browser console for exact origin

#### 3. JWT Token Invalid
**Problem:** `401 Unauthorized`

**Solution:**
- Ensure `JWT_SECRET` matches between environments
- Clear browser localStorage
- Re-login to get fresh token

#### 4. Build Failures
**Problem:** TypeScript compilation errors

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
npx tsc --build --clean
```

#### 5. Payment Validation Not Working
**Problem:** Payments not updating order status

**Solution:**
- Check transaction creation in DataContext
- Verify payment webhook/callback
- Check browser console for errors
- Ensure `accountId` is provided

### Debug Mode

Enable detailed logging:
```bash
# Server
NODE_ENV=development npm run dev

# Client
npm run dev
```

Check logs in:
- Browser Console (F12)
- Server terminal output
- Render deployment logs (if deployed)

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| **Total Lines of Code** | ~15,000+ |
| **API Endpoints** | 12 routes |
| **Database Tables** | 14 tables |
| **React Components** | 50+ components |
| **Pages** | 35+ pages |
| **Dependencies (Frontend)** | 18 packages |
| **Dependencies (Backend)** | 15 packages |

---

## 📝 Additional Notes

### Security Considerations
- ✅ Passwords hashed with bcrypt
- ✅ JWT token authentication
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (React escapes by default)

### Performance Optimizations
- ✅ Database indexes on frequently queried columns
- ✅ React Context with useMemo for complex calculations
- ✅ Pagination on large data sets
- ✅ Lazy loading routes (future)
- ✅ Image optimization via Cloudinary

### Future Enhancements
- 🔜 Real-time updates with WebSockets
- 🔜 Email notifications
- 🔜 SMS integration
- 🔜 Advanced reporting with filters
- 🔜 Export to Excel
- 🔜 Multi-language admin panel
- 🔜 Customer portal
- 🔜 iOS application

---

## 📞 Support

For issues or questions:
- **GitHub Issues:** [Create an issue](https://github.com/your-username/WRtour/issues)
- **Email:** aimen@wrtour.com

---

## 📄 License

MIT License - See LICENSE file for details

---

**Version:** 1.0.0  
**Last Updated:** December 12, 2025  
**Maintained By:** Wahat Alrajaa Tour Development Team
