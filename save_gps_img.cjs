const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const urls = [
  'https://www.lockheedmartin.com/content/dam/lockheed-martin/space/photo/gps-iii/GPS-III-render-1920x1080.png',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/GPS_Block_III_artist_concept.jpg/1200px-GPS_Block_III_artist_concept.jpg',
  'https://www.gps.gov/multimedia/images/GPS-III-rendering.jpg',
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    protocol.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        reject(new Error(`Status: ${response.statusCode} for ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function tryAll() {
  for (const url of urls) {
    try {
      console.log('Trying:', url);
      const ext = url.includes('.png') ? '.png' : '.jpg';
      const dest = path.join(__dirname, 'public', 'images', 'satellites', 'gps_raw' + ext);
      await download(url, dest);
      const stat = fs.statSync(dest);
      console.log('Downloaded! Size:', stat.size, 'bytes to', dest);
      if (stat.size > 10000) {
        console.log('SUCCESS');
        break;
      }
    } catch(e) {
      console.log('Failed:', e.message);
    }
  }
}

tryAll();
