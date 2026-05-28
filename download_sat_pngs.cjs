const fs = require('fs');
const https = require('https');
const path = require('path');

const satellites = [
    { name: 'iss', query: 'ISS spacecraft model 1.png' },
    { name: 'css', query: 'Tiangong space station.png' },
    { name: 'hubble', query: 'Hubble Space Telescope transparent.png' },
    { name: 'jwst', query: 'James Webb Space Telescope.png' },
    { name: 'chandrayaan3', query: 'Chandrayaan-3 lander.png' },
    { name: 'mangalyaan', query: 'Mars Orbiter Mission spacecraft model.png' },
    { name: 'voyager', query: 'Voyager spacecraft model.png' },
    { name: 'starlink', query: 'Starlink.png' },
    { name: 'gps', query: 'GPS Block III.png' }
];

async function searchWikimedia(query) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json`;
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'NodejsScript/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.query && json.query.search && json.query.search.length > 0) {
                        // Find the first PNG
                        const pngFile = json.query.search.find(s => s.title.toLowerCase().endsWith('.png'));
                        if (pngFile) resolve(pngFile.title);
                        else resolve(json.query.search[0].title);
                    } else {
                        resolve(null);
                    }
                } catch(e) { resolve(null); }
            });
        }).on('error', reject);
    });
}

async function getImageUrl(title) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'NodejsScript/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const pages = json.query.pages;
                    const page = pages[Object.keys(pages)[0]];
                    if (page && page.imageinfo && page.imageinfo.length > 0) {
                        resolve(page.imageinfo[0].url);
                    } else resolve(null);
                } catch(e) { resolve(null); }
            });
        }).on('error', reject);
    });
}

async function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                downloadImage(res.headers.location, filename).then(resolve).catch(reject);
                return;
            }
            const file = fs.createWriteStream(filename);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', reject);
    });
}

async function main() {
    for (const sat of satellites) {
        console.log(`Searching for ${sat.name}...`);
        let title = await searchWikimedia(sat.query);
        if (!title) title = await searchWikimedia(sat.name + ' png');
        if (!title) {
            console.log(`Could not find image for ${sat.name}`);
            continue;
        }
        console.log(`Found title: ${title}`);
        const url = await getImageUrl(title);
        if (url) {
            console.log(`Downloading ${url}...`);
            await downloadImage(url, path.join(__dirname, 'public', 'images', 'satellites', sat.name + '.png'));
        }
    }
    console.log('Done!');
}

main();
