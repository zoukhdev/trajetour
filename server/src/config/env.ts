import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database (Neon PostgreSQL)
    databaseUrl: process.env.DATABASE_URL || '',

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
        expiresIn: '7d'
    },

    // Cloudinary
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || ''
    },

    // CORS
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

    // Admin
    admin: {
        email: process.env.ADMIN_EMAIL || 'admin@trajetour.com',
        password: process.env.ADMIN_PASSWORD || 'admin123'
    }
};

// Validate required environment variables
if (!config.databaseUrl && config.nodeEnv === 'production') {
    throw new Error('DATABASE_URL is required in production');
}

if (!config.jwt.secret || config.jwt.secret === 'dev-secret-change-in-production') {
    console.warn('⚠️  WARNING: Using default JWT secret. Please set JWT_SECRET in production!');
}
