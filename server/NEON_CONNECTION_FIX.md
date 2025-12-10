# 🔍 Neon Database Connection Issue

## Error
```
SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

## Cause
The connection string has special characters in the password that need URL encoding.

## Solution

Your current connection string:
```
postgresql://neondb_owner:npg_pMWw8Foc1CIQ@ep-ancient-cake-agf81841-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

Please go to your Neon dashboard and:

### Option 1: Get the Connection String (Recommended)
1. Go to your Neon project dashboard
2. Click on "Connection Details"
3. **Select "Pooled connection"**
4. Click "Copy" next to the connection string
5. Replace the DATABASE_URL in `.env` with the copied string

### Option 2: Check Password
The password `npg_pMWw8Foc1CIQ` might have special characters. If Option 1 doesn't work:
1. Go to Neon dashboard
2. Go to Settings → Reset Password
3. Generate a new, simpler password
4. Update the connection string in `.env`

Once you have the correct connection string, update it in `server/.env` and I'll continue with the migration!
