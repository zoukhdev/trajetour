# 🚀 Backend Setup Guide - Quick Start

## Step 1: Create `.env` File

```bash
cd server
cp .env.example .env
```

Then edit `.env` with your credentials:

### Get Neon Database URL:
1. Go to https://neon.tech
2. Create free account
3. Create new project
4. Copy connection string
5. Paste into `DATABASE_URL`

### Get Cloudinary Credentials:
1. Go to https://cloudinary.com
2. Create free account  
3. Get: Cloud Name, API Key, API Secret
4. Add to `.env`

### Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Step 2: Install Dependencies

```bash
cd server
npm install
```

## Step 3: Run Database Migration

```bash
npm run db:migrate
```

This will:
- Create all tables
- Create indexes
- Seed admin user

## Step 4: Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## Step 5: Test

Visit: http://localhost:3001/api/health

Should see: `{"status":"ok", "database":"connected"}`

---

## ⚡ Quick Test Login

**Endpoint:** POST http://localhost:3001/api/auth/login

**Body:**
```json
{
  "email": "zoukh@trajetour.com",
  "password": "your-admin-password-from-env"
}
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "zoukh@trajetour.com",
    "role": "admin"
  }
}
```

---

## 🐳 Docker Deployment (Railway)

```bash
# Railway will automatically detect Dockerfile
railway up
```

---

## 📝 Next Steps

After server is running:
1. Update client `.env` with API URL
2. Install client dependencies
3. Run client app
4. Test login flow

See `DEPLOYMENT.md` for production deployment.
