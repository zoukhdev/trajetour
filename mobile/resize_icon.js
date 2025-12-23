const sharp = require('sharp');
const path = require('path');

const inputPath = String.raw`C:\Users\zoukh\.gemini\antigravity\brain\ae960bea-f9c1-4e01-8fbc-9ab90ffc41a4\uploaded_image_1766149778938.png`;
const outputPath = path.join(__dirname, 'assets', 'adaptive-icon-padded.png');

async function resizeIcon() {
    try {
        const canvasSize = 1024;
        const iconSize = 600; // 60% of canvas

        // Create transparent canvas
        const background = { r: 255, g: 255, b: 255, alpha: 0 };

        await sharp(inputPath)
            .resize(iconSize, iconSize, { fit: 'contain', background: background })
            .toBuffer()
            .then(data => {
                return sharp({
                    create: {
                        width: canvasSize,
                        height: canvasSize,
                        channels: 4,
                        background: background
                    }
                })
                    .composite([{ input: data, gravity: 'center' }])
                    .png()
                    .toFile(outputPath);
            });

        console.log('✅ Created padded icon at:', outputPath);
    } catch (error) {
        console.error('❌ Error resizing icon:', error);
    }
}

resizeIcon();
