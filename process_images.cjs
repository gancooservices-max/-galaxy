const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const dir = path.join(__dirname, 'public', 'images', 'satellites');

async function processImages() {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        try {
            console.log('Processing', file);
            const image = await Jimp.read(filePath);
            
            // Crop the right half (to remove the AI generated planet)
            const w = image.bitmap.width;
            const h = image.bitmap.height;
            
            // Only crop if it's the 1024x1024 AI generated image
            if (w === 1024 && h === 1024) {
                image.crop(Math.floor(w * 0.4), 0, Math.floor(w * 0.6), h);
            }
            
            // Make black transparent
            image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
                const red = this.bitmap.data[idx + 0];
                const green = this.bitmap.data[idx + 1];
                const blue = this.bitmap.data[idx + 2];
                // If it's very dark (almost black)
                if (red < 15 && green < 15 && blue < 15) {
                    this.bitmap.data[idx + 3] = 0; // Alpha to 0
                }
            });
            
            await image.writeAsync(filePath);
            console.log('Saved', file);
        } catch (e) {
            console.error('Failed to process', file, e);
        }
    }
}

processImages();
