const Jimp = require('jimp');
const path = require('path');

async function removeWhiteBackground(filename) {
    const filePath = path.join(__dirname, 'public', 'images', 'satellites', filename);
    const image = await Jimp.read(filePath);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        
        if (r > 240 && g > 240 && b > 240) {
            this.bitmap.data[idx + 3] = 0;
        } else if (r > 220 && g > 220 && b > 220) {
            const alpha = Math.round(((255 - r) / 35) * 255);
            this.bitmap.data[idx + 3] = Math.min(255, alpha);
        }
    });
    
    await image.writeAsync(filePath);
    console.log('Done! White background removed from', filename);
}

removeWhiteBackground('galileo.png').catch(console.error);
