const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function seed() {
    const data = JSON.parse(fs.readFileSync('./public/data/hyg_stars.json', 'utf8'));
    // Format: [id, x, y, z, mag, r, g, b, name, type, con, hasProperName]
    const namedStars = data.filter(d => d[11] === 1);
    
    console.log(`Found ${namedStars.length} named stars.`);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'lumora'
    });

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS named_stars (
        star_id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        constellation VARCHAR(10),
        spectral_type VARCHAR(10),
        magnitude FLOAT
      );
    `;
    await connection.query(createTableQuery);

    console.log("Table created/verified. Inserting records...");

    let count = 0;
    for (const star of namedStars) {
        const id = star[0];
        const mag = star[4];
        const name = star[8];
        const type = star[9];
        const con = star[10];

        await connection.query(
            'INSERT IGNORE INTO named_stars (star_id, name, constellation, spectral_type, magnitude) VALUES (?, ?, ?, ?, ?)',
            [id, name, con, type, mag]
        );
        count++;
    }

    console.log(`Successfully inserted/verified ${count} named stars in the database.`);
    await connection.end();
}

seed().catch(console.error);
