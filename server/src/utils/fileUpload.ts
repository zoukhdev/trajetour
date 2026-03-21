import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';
import streamifier from 'streamifier';

// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
});

// Use Memory Storage
const storage = multer.memoryStorage();

export const upload = multer({ storage: storage });

export const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        // Detect PDF by checking the first 4 bytes for '%PDF' header
        const isPDF = buffer.slice(0, 4).toString() === '%PDF';

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image', // Needs to be image to allow format conversion
                ...(isPDF && { format: 'jpg' }) // Force PDF to JPG
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

export const deleteFile = async (publicId: string) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
    }
};
