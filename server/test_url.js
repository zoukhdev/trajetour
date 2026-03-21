import { URL } from 'url';
const dbUrl = "postgresql://neondb_owner:npg_pMWw8Foc1CIQ@ep-ancient-cake-agf81841-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const u = new URL(dbUrl);
console.log("Username from DB_URL:", u.username);
