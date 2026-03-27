# 🚀 Quick Setup Steps

## Step 1: Get Your Credentials

### From Neon (PostgreSQL):
1. Go to your Neon dashboard
2. Click on your project
3. Go to "Connection Details" or "Dashboard"
4. Copy the **Connection String** (starts with `postgresql://`)
   - It looks like: `postgresql://username:password@ep-xxx.region.neon.tech/database?sslmode=require`

### From Cloudinary:
1. Go to your Cloudinary dashboard
2. Look for "Product Environment Credentials" or "Dashboard"
3. Copy these three values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

## Step 2: Create .env File

```bash
cd server
copy .env.example .env
```

Then open `.env` file and fill in:

```env
NODE_ENV=development
PORT=3001

# Paste your Neon connection string here
DATABASE_URL=postgresql://username:password@ep-xxx.region.neon.tech/database?sslmode=require

# Generate a random JWT secret (or use the one below)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Paste your Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Client URL (keep as is for now)
CLIENT_URL=http://localhost:5173

# Admin credentials (you can change these)
ADMIN_EMAIL=zoukh@trajetour.com
ADMIN_PASSWORD=Zoukh@2026
```

---

## Step 3: Install Dependencies

```bash
npm install
```

---

## Step 4: Run Database Migration

```bash
npm run db:migrate
```

This will:
- Create all database tables
- Create indexes
- Create your admin user

---

## Step 5: Start the Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on port 3001
📍 Environment: development
🌐 Client URL: http://localhost:5173
✅ Connected to Neon PostgreSQL database
✅ Database connection test successful
```

---

## Step 6: Test the API

Open a new terminal and run:

```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "environment": "development"
}
```

---

## Step 7: Test Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"zoukh@trajetour.com\",\"password\":\"Zoukh@2026\"}"
```

Should return user info and set a cookie.

---

## ✅ Done!

Your backend is now running on: **http://localhost:3001**

Next steps:
- Keep server running
- Update client to connect to API
- Create remaining route files (optional)
