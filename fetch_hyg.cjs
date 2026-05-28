const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');
const path = require('path');

const GZ_FILE = 'hyg_repo/hyg/v3/hyg_v38.csv.gz';
const OUT_FILE = 'public/data/hyg_stars.json';

// Simple B-V to RGB approximation
function bvToRgb(bv) {
    let t, r, g, b;
    
    if (bv < -0.40) bv = -0.40;
    if (bv > 2.00) bv = 2.00;
    
    if (bv >= -0.40 && bv < 0.00) {
        t = (bv + 0.40) / 0.40;
        r = 0.61 + (0.11 * t) + (0.1 * t * t);
        g = 0.70 + (0.07 * t) + (0.1 * t * t);
        b = 1.0;
    } else if (bv >= 0.00 && bv < 0.40) {
        t = bv / 0.40;
        r = 0.83 + (0.17 * t);
        g = 0.87 + (0.11 * t);
        b = 1.0;
    } else if (bv >= 0.40 && bv < 1.60) {
        t = (bv - 0.40) / 1.20;
        r = 1.0;
        g = 0.98 - (0.16 * t);
        b = 1.0 - (0.47 * t) - (0.53 * t * t);
    } else if (bv >= 1.60 && bv <= 2.00) {
        t = (bv - 1.60) / 0.40;
        r = 1.0;
        g = 0.82 - (0.5 * t * t);
        b = 0.0;
    }

    return [
        Math.max(0, Math.min(255, Math.round(r * 255))),
        Math.max(0, Math.min(255, Math.round(g * 255))),
        Math.max(0, Math.min(255, Math.round(b * 255)))
    ];
}

function processGZ() {
    console.log('Processing HYG v38 GZ...');
    const outData = [];
    
    const readStream = fs.createReadStream(GZ_FILE);
    const gunzip = zlib.createGunzip();
    
    const rl = readline.createInterface({
        input: readStream.pipe(gunzip),
        crlfDelay: Infinity
    });

    let isHeader = true;

    rl.on('line', (line) => {
        const cols = line.split(',');
        
        if (isHeader) {
            isHeader = false;
            return;
        }

        // Get indices
        const id = parseInt(cols[0], 10);
        if (id === 0) return; // Skip Sun

        const proper = cols[6]; // proper name
        const bf = cols[5]; // bayer-flamsteed
        let name = proper;
        if (!name || name.trim() === '') name = bf;
        if (!name || name.trim() === '') name = 'HIP ' + cols[1]; // HIP id

        // x=17, y=18, z=19, mag=13, ci=16
        const x = parseFloat(cols[17]);
        const y = parseFloat(cols[18]);
        const z = parseFloat(cols[19]);
        const mag = parseFloat(cols[13]);
        const ci = parseFloat(cols[16]);
        const spect = cols[15]; // spectral type e.g., "G2V"

        if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(mag)) return;

        const rgb = bvToRgb(isNaN(ci) ? 0 : ci); 

        // Extract first letter of spectral type
        let type = 'G'; // fallback
        if (spect && spect.length > 0) {
            const first = spect.charAt(0).toUpperCase();
            if (['O', 'B', 'A', 'F', 'G', 'K', 'M'].includes(first)) {
                type = first;
            }
        }

        // Format: [id, x, y, z, mag, r, g, b, name, type]
        outData.push([id, x, y, z, mag, rgb[0], rgb[1], rgb[2], name, type]);
    });

    rl.on('close', () => {
        console.log("Processed " + outData.length + " stars.");
        if (!fs.existsSync('public/data')) fs.mkdirSync('public/data', { recursive: true });
        fs.writeFileSync(OUT_FILE, JSON.stringify(outData));
        console.log("Saved to " + OUT_FILE);
    });
}

processGZ();
