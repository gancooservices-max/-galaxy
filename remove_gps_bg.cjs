const Jimp = require('jimp');
const path = require('path');

async function removeWhiteBackground() {
    const filePath = path.join(__dirname, 'public', 'images', 'satellites', 'gps.png');
    const image = await Jimp.read(filePath);
    
    // Remove white/near-white background
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        
        // If pixel is white or near-white, make it transparent
        if (r > 240 && g > 240 && b > 240) {
            this.bitmap.data[idx + 3] = 0; // fully transparent
        } else if (r > 220 && g > 220 && b > 220) {
            // Semi-transparent for near-white (anti-aliasing)
            const alpha = Math.round(((255 - r) / 35) * 255);
            this.bitmap.data[idx + 3] = Math.min(255, alpha);
        }
    });
    
    await image.writeAsync(filePath);
    console.log('Done! White background removed from gps.png');
}

removeWhiteBackground().catch(console.error);
