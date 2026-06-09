import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Set up multer for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'public/uploads/moments';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


const PORT = process.env.PORT || 3001;

// Admin Credentials (default for dev)
const ADMIN_ID = process.env.ADMIN_ID || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
// Super simple mock token
const ADMIN_TOKEN = 'secret-admin-token-123';

// Global variables
let pool;
let transporter;

async function initEmail() {
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      console.log(`✅ Real SMTP Email account configured for ${process.env.SMTP_USER}.`);
    } else {
      const account = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass
        }
      });
      console.log(`✅ Ethereal Email test account created.`);
    }
  } catch (err) {
    console.error('Failed to create email account. ' + err.message);
  }
}

async function initDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    const dbName = process.env.DB_NAME || 'lumora';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();

    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS registered_stars (
        star_id INT PRIMARY KEY,
        owner_name VARCHAR(255) NOT NULL,
        message TEXT,
        dedicated_by VARCHAR(255) DEFAULT NULL,
        email VARCHAR(255),
        star_name VARCHAR(255),
        unique_id VARCHAR(50),
        secret_key VARCHAR(50),
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        email_sent BOOLEAN DEFAULT FALSE
      );
    `;
    await pool.query(createTableQuery);

    const columnsToAdd = [
      'email VARCHAR(255)',
      'star_name VARCHAR(255)',
      'unique_id VARCHAR(50)',
      'secret_key VARCHAR(50)',
      'email_sent BOOLEAN DEFAULT FALSE',
      'original_name VARCHAR(255)',
      'dedicated_by VARCHAR(255)'
    ];
    for (const col of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE registered_stars ADD COLUMN ${col}`);
      } catch (e) {
        // Ignored, column likely exists
      }
    }

    const createNamedStarsTableQuery = `
      CREATE TABLE IF NOT EXISTS named_stars (
        star_id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        constellation VARCHAR(10),
        spectral_type VARCHAR(10),
        magnitude FLOAT
      );
    `;
    await pool.query(createNamedStarsTableQuery);

    // Create contact_inquiries table for the Contact section
    const createContactInquiriesQuery = `
      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        mobile VARCHAR(50),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Pending'
      );
    `;
    await pool.query(createContactInquiriesQuery);

    // Create custom_stars table for Admin-created stars
    const createCustomStarsQuery = `
      CREATE TABLE IF NOT EXISTS custom_stars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ra FLOAT NOT NULL,
        dec_coord FLOAT NOT NULL,
        distance FLOAT DEFAULT 100,
        magnitude FLOAT DEFAULT 5.0,
        color VARCHAR(20) DEFAULT '#ffffff',
        spectral_type VARCHAR(10) DEFAULT 'G',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createCustomStarsQuery);

    
    // Create published_moments table
    const createPublishedMomentsQuery = `
      CREATE TABLE IF NOT EXISTS published_moments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        star_id INT NOT NULL,
        description TEXT,
        image_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createPublishedMomentsQuery);

    // Create time_capsules table
    const createTimeCapsulesQuery = `
      CREATE TABLE IF NOT EXISTS time_capsules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        star_id INT NOT NULL,
        message TEXT NOT NULL,
        open_on_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createTimeCapsulesQuery);

    // Create star_wishes table
    const createStarWishesQuery = `
      CREATE TABLE IF NOT EXISTS star_wishes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        star_id INT NOT NULL,
        wish_text TEXT NOT NULL,
        passcode VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createStarWishesQuery);

    console.log(`✅ Database '${dbName}' and tables initialized successfully!`);
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}



// Generate PDF Buffer
function generatePDFBuffer(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 0, size: 'A4', layout: 'landscape' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const width = doc.page.width;
      const height = doc.page.height;

      // 1. Ultra Premium Dark Navy Background
      doc.rect(0, 0, width, height).fill('#02040A');

      // 2. Subtle Nebula Effects (Deep purple and blue glows)
      const grad1 = doc.radialGradient(width * 0.2, height * 0.8, 0, width * 0.2, height * 0.8, 400);
      grad1.stop(0, '#1E1B4B', 0.8);
      grad1.stop(1, '#02040A', 0);
      doc.rect(0, 0, width, height).fill(grad1);

      const grad2 = doc.radialGradient(width * 0.8, height * 0.2, 0, width * 0.8, height * 0.2, 500);
      grad2.stop(0, '#0F172A', 0.7);
      grad2.stop(1, '#02040A', 0);
      doc.rect(0, 0, width, height).fill(grad2);
      
      // 3. Realistic Starfield
      for (let i = 0; i < 600; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 1.2;
        const opacity = Math.random() * 0.7 + 0.1;
        const isGold = Math.random() > 0.95;
        doc.circle(x, y, radius)
           .fillColor(isGold ? '#D4AF37' : '#FFFFFF')
           .fillOpacity(opacity)
           .fill();
      }
      doc.fillOpacity(1);

      // 4. Subtle glowing star effect (Lens flare)
      const starX = width * 0.85;
      const starY = height * 0.15;
      const glowGrad = doc.radialGradient(starX, starY, 0, starX, starY, 150);
      glowGrad.stop(0, '#FFFFFF', 1);
      glowGrad.stop(0.1, '#D4AF37', 0.5);
      glowGrad.stop(1, '#02040A', 0);
      doc.circle(starX, starY, 150).fill(glowGrad);
      
      doc.moveTo(starX, starY - 80).lineTo(starX, starY + 80).lineWidth(1).stroke('#FFFFFF');
      doc.moveTo(starX - 80, starY).lineTo(starX + 80, starY).lineWidth(1).stroke('#FFFFFF');
      doc.moveTo(starX - 30, starY - 30).lineTo(starX + 30, starY + 30).lineWidth(0.5).strokeOpacity(0.5).stroke('#FFFFFF');
      doc.moveTo(starX - 30, starY + 30).lineTo(starX + 30, starY - 30).lineWidth(0.5).strokeOpacity(0.5).stroke('#FFFFFF');
      doc.strokeOpacity(1);

      // 5. Luxury Golden Border
      doc.lineWidth(5);
      doc.rect(20, 20, width - 40, height - 40).stroke('#1E293B');
      doc.lineWidth(2);
      doc.rect(28, 28, width - 56, height - 56).stroke('#D4AF37');
      doc.lineWidth(1);
      doc.rect(34, 34, width - 68, height - 68).stroke('#D4AF37');
      
      // Corner ornaments
      const inset = 34;
      doc.circle(inset, inset, 5).fillAndStroke('#02040A', '#D4AF37');
      doc.circle(width - inset, inset, 5).fillAndStroke('#02040A', '#D4AF37');
      doc.circle(inset, height - inset, 5).fillAndStroke('#02040A', '#D4AF37');
      doc.circle(width - inset, height - inset, 5).fillAndStroke('#02040A', '#D4AF37');

      // 6. Typography - Header
      let currentY = 70;
      doc.fontSize(24).font('Times-Bold').fillColor('#D4AF37')
         .text('LUMORA CELESTIAL REGISTRY', 0, currentY, { align: 'center', width: width, characterSpacing: 4 });
      currentY += 35;
      
      doc.fontSize(32).font('Times-Italic').fillColor('#FFFFFF')
         .text('Certificate of Star Dedication', 0, currentY, { align: 'center', width: width });
      currentY += 50;

      // 7. Main Statement
      const statement = "This is to certify that a unique star has been officially named";
      doc.fontSize(14).font('Helvetica').fillColor('#94A3B8')
         .text(statement, 0, currentY, { align: 'center', width: width });
      currentY += 30;

      // 8. Owner Name (Massive Gold)
      doc.fontSize(52).font('Times-BoldItalic').fillColor('#D4AF37')
         .text(data.starName, 0, currentY, { align: 'center', width: width });
      currentY += 65;
      
      doc.fontSize(14).font('Helvetica').fillColor('#94A3B8')
         .text('and recorded within the LUMORA Celestial Registry.', 0, currentY, { align: 'center', width: width });
      currentY += 40;

      // 9. Special Dedication Message
      const message = data.message || "May your dreams shine forever among the stars. This celestial beacon is dedicated to your journey, achievements, and limitless future.";
      doc.fontSize(13).font('Times-Italic').fillColor('#E2E8F0')
         .text(`"${message}"`, 150, currentY, { align: 'center', width: width - 300, lineGap: 5 });

      // 10. Star Details & Mini Map (Bottom Section)
      const bottomY = height - 190;
      
      // -- A. Mini Star Map (Left) --
      const mapX = 120;
      const mapY = bottomY + 50;
      doc.circle(mapX, mapY, 45).lineWidth(1).stroke('#D4AF37');
      // Draw grid inside map
      doc.save();
      doc.circle(mapX, mapY, 45).clip();
      doc.moveTo(mapX - 45, mapY).lineTo(mapX + 45, mapY).lineWidth(0.5).strokeOpacity(0.3).stroke('#FFFFFF');
      doc.moveTo(mapX, mapY - 45).lineTo(mapX, mapY + 45).lineWidth(0.5).strokeOpacity(0.3).stroke('#FFFFFF');
      // Draw fake constellation line
      doc.moveTo(mapX - 20, mapY + 10).lineTo(mapX - 5, mapY - 15).lineTo(mapX + 15, mapY - 5).lineTo(mapX + 25, mapY + 20).lineWidth(1).strokeOpacity(0.8).stroke('#D4AF37');
      doc.circle(mapX - 20, mapY + 10, 1.5).fill('#FFFFFF');
      doc.circle(mapX - 5, mapY - 15, 1.5).fill('#FFFFFF');
      doc.circle(mapX + 15, mapY - 5, 2.5).fill('#FFFFFF'); // The registered star
      doc.circle(mapX + 25, mapY + 20, 1.5).fill('#FFFFFF');
      // Glowing aura around the registered star
      doc.circle(mapX + 15, mapY - 5, 6).fillOpacity(0.3).fill('#D4AF37');
      doc.fillOpacity(1).strokeOpacity(1);
      doc.restore(); // Restore from clipping
      
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#D4AF37').text('STAR MAP', mapX - 40, mapY + 55, { width: 80, align: 'center' });

      // -- B. Details Grid (Center) --
      const detailsX = width / 2 - 130;
      let detY = bottomY;
      
      const constellationsList = ['Orion', 'Andromeda', 'Ursa Major', 'Cassiopeia', 'Cygnus', 'Lyra', 'Pegasus', 'Draco'];
      const constellation = constellationsList[Math.floor((data.coordX || 0) % constellationsList.length)];
      const raStr = `${Math.floor((data.coordX || 0) % 24)}h ${Math.floor((data.coordY || 0) % 60)}m ${((data.coordZ || 0) % 60).toFixed(1)}s`;
      const decStr = `+${Math.floor((data.coordX || 0) % 90)}° ${Math.floor((data.coordY || 0) % 60)}' ${((data.coordZ || 0) % 60).toFixed(1)}"`;
      const distanceStr = `${((data.coordZ || 10) * 3.5).toFixed(0)} Light Years`;
      const visibilityStr = ((data.coordY || 0) % 2 === 0) ? 'Northern Hemisphere' : 'Southern Hemisphere';
      const spectral = data.colorClass ? data.colorClass.split(' ')[1].replace(/[()]/g, '') + '-Type' : 'G-Type';
      const certDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const certId = 'LMR-' + new Date().getFullYear() + '-' + (data.uniqueId || '000000').replace(/[^0-9]/g, '').padStart(6, '0').substring(0, 6);

      const printRow = (label, val, xOffset, yOffset) => {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#94A3B8').text(label + ':', detailsX + xOffset, yOffset);
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF').text(val, detailsX + xOffset + 80, yOffset);
      };

      const dy = 16;
      printRow('Registered To', data.ownerName, 0, detY);
      printRow('Constellation', constellation, 0, detY + dy);
      printRow('Galaxy', 'Milky Way', 0, detY + dy * 2);
      printRow('Distance', distanceStr, 0, detY + dy * 3);
      printRow('Spectral Class', spectral, 0, detY + dy * 4);
      printRow('Visibility', visibilityStr, 0, detY + dy * 5);
      
      printRow('Right Ascension', raStr, 220, detY);
      printRow('Declination', decStr, 220, detY + dy);
      printRow('Registration Date', certDate, 220, detY + dy * 3);
      printRow('Certificate ID', certId, 220, detY + dy * 4);

      // -- C. QR Code Placeholder (Center Right) --
      const qrX = width - 140;
      const qrY = bottomY - 40;
      doc.rect(qrX, qrY, 50, 50).lineWidth(1).stroke('#D4AF37');
      doc.rect(qrX + 5, qrY + 5, 10, 10).fill('#D4AF37');
      doc.rect(qrX + 35, qrY + 5, 10, 10).fill('#D4AF37');
      doc.rect(qrX + 5, qrY + 35, 10, 10).fill('#D4AF37');
      doc.fontSize(6).font('Helvetica').fillColor('#D4AF37').text('VERIFY', qrX, qrY + 55, { width: 50, align: 'center' });

      
      // -- D. Premium Image Stamp & Signature (Right) --
      const sigX = width - 150;
      const sigY = bottomY + 50;

      // Draw real image stamp if exists
      const stampPath = path.join(process.cwd(), 'public/images/stamp.png');
      if (fs.existsSync(stampPath)) {
        doc.save();
        doc.circle(sigX + 20, sigY - 20, 35).clip();
        doc.image(stampPath, sigX - 15, sigY - 55, { width: 70 });
        doc.restore();
      }

      // Draw Dedicated By
      if (data.dedicatedBy) {
        doc.fontSize(12).font('Times-BoldItalic').fillColor('#D4AF37')
           .text('Dedicated By: ' + data.dedicatedBy, sigX - 40, sigY + 25, { align: 'center', width: 120 });
      } else {
        doc.fontSize(10).font('Times-Bold').fillColor('#D4AF37').text('Official LUMORA Registry', sigX - 40, sigY + 25, { align: 'center', width: 120 });
      }

      // 11. Final Quote at Bottom
      doc.fontSize(10).font('Times-Italic').fillColor('#94A3B8')
         .text('"Among billions of stars in the universe, this one now carries your story."', 0, height - 35, { align: 'center', width: width });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Simple Admin Auth Middleware
function requireAdmin(req, res, next) {
  const token = req.headers.authorization;
  if (token === `Bearer ${ADMIN_TOKEN}`) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Invalid admin token.' });
  }
}

/* ==========================================================================
 * PUBLIC PUBLIC ROUTES
 * ========================================================================== */

app.get('/api/stars', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT star_id, owner_name, message, star_name, unique_id, registration_date FROM registered_stars');
    const starMap = {};
    rows.forEach(row => {
      starMap[row.star_id] = {
        owner: row.owner_name,
        message: row.message,
        starName: row.star_name,
        uniqueId: row.unique_id,
        date: row.registration_date
      };
    });
    res.json(starMap);
  } catch (error) {
    console.error('Error fetching registered stars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stars/recent', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT owner_name as name, star_name as star, message FROM registered_stars WHERE email_sent = 1 ORDER BY registration_date DESC LIMIT 5');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching recent stars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stars/custom', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM custom_stars');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching custom stars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/stars/register', async (req, res) => {
  const { starId, ownerName, email, starName, message, originalName, dedicatedBy } = req.body;

  if (starId === undefined || !ownerName || !email || !starName) {
    return res.status(400).json({ error: 'Star ID, Owner Name, Email, and Star Name are required.' });
  }

  try {
    const [existing] = await pool.query('SELECT owner_name FROM registered_stars WHERE star_id = ?', [starId]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'This star is already registered!' });
    }

    const uniqueId = 'STR-' + (Math.floor(Math.random() * 900000) + 100000);
    const secretKey = 'MS-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    await pool.query(
      'INSERT INTO registered_stars (star_id, owner_name, message, email, star_name, unique_id, secret_key, original_name, dedicated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [starId, ownerName.trim(), message ? message.trim() : null, email.trim(), starName.trim(), uniqueId, secretKey, originalName || 'Unknown Star', dedicatedBy || null]
    );

    res.json({ success: true, message: 'Star registered successfully!', uniqueId, secretKey });
  } catch (error) {
    console.error('Error registering star:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/stars/auth', async (req, res) => {
  const { starId, secretKey } = req.body;
  if (starId === undefined || !secretKey) {
    return res.status(400).json({ error: 'Star ID and Secret Key are required.' });
  }

  try {
    const [rows] = await pool.query('SELECT secret_key FROM registered_stars WHERE star_id = ?', [starId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Star not found.' });
    }
    
    if (rows[0].secret_key === secretKey) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'Invalid secret key.' });
    }
  } catch (error) {
    console.error('Error authenticating star:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM registered_stars');
    res.json({ totalRegistrations: rows[0].total });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, mobile, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  try {
    await pool.query(
      'INSERT INTO contact_inquiries (name, email, mobile, subject, message) VALUES (?, ?, ?, ?, ?)',
      [name, email, mobile, subject, message]
    );
    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error saving contact inquiry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.get('/api/moments', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pm.*, rs.star_name, rs.owner_name 
      FROM published_moments pm
      JOIN registered_stars rs ON pm.star_id = rs.star_id
      ORDER BY pm.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching moments' });
  }
});

/* ==========================================================================
 * ADMIN ROUTES
 * ========================================================================== */

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_ID && password === ADMIN_PASS) {
    res.json({ token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin: Get all full registration details
app.get('/api/admin/registrations', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM registered_stars ORDER BY registration_date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching registrations' });
  }
});

// Admin: Get contact inquiries
app.get('/api/admin/inquiries', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contact_inquiries ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inquiries' });
  }
});

// Admin: Mark inquiry as replied
app.post('/api/admin/inquiries/:id/reply', requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE contact_inquiries SET status = "Replied" WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error updating inquiry status' });
  }
});

// Admin: Activate a registration and send email
app.post('/api/admin/registrations/:id/activate', requireAdmin, async (req, res) => {
  try {
    const starId = req.params.id;
    const [rows] = await pool.query('SELECT * FROM registered_stars WHERE star_id = ?', [starId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    const reg = rows[0];
    
    // Allow resending by removing the 'already sent' check
    if (!transporter) {
      return res.status(500).json({ error: 'Email transporter is not configured.' });
    }
    
    // Emotional elements logic
    const sectorNum = (starId * 7) % 99 + 1;
    const sectorChar = String.fromCharCode(65 + (starId % 26));
    const sector = `${sectorChar}-${sectorNum}`;
    const coordX = (starId * 17) % 999;
    const coordY = (starId * 31) % 999;
    const coordZ = (starId * 47) % 999;
    const colors = ['Blue-White (B)', 'White (A)', 'Yellow-White (F)', 'Yellow (G)', 'Orange (K)', 'Red (M)'];
    const colorClass = colors[starId % colors.length];

    const pdfBuffer = await generatePDFBuffer({
      starName: reg.star_name,
      originalName: reg.original_name,
      ownerName: reg.owner_name,
      message: reg.message,
      uniqueId: reg.unique_id,
      secretKey: reg.secret_key,
      sector,
      coordX,
      coordY,
      coordZ,
      colorClass,
      dedicatedBy: reg.dedicated_by
    });
    
    const regDateFormatted = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Formatting the message section if it exists
    const messageSection = reg.message ? `
      <div class="message-section">
        <h3 class="message-title">Dedicated Message</h3>
        <p class="message-text">"${reg.message}"</p>
        <p class="message-subtext">A permanent place among the stars now carries this meaning.</p>
      </div>
    ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Star Registration</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
          
          body { 
            margin: 0; padding: 0; 
            font-family: 'Inter', sans-serif; 
            background-color: #050816; 
            color: #e2e8f0; 
            -webkit-font-smoothing: antialiased;
          }
          .email-wrapper {
            background-color: #050816;
            background-image: 
              radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.15), transparent 25%),
              radial-gradient(circle at 85% 30%, rgba(29, 78, 216, 0.15), transparent 25%);
            padding: 40px 20px;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #0B0E1E; 
            border: 1px solid rgba(251, 191, 36, 0.2); 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
          }
          .header { 
            background: url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop') center/cover;
            padding: 60px 40px; 
            text-align: center; 
            position: relative;
            border-bottom: 2px solid #fbbf24;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(to bottom, rgba(5,8,22,0.3) 0%, #0B0E1E 100%);
          }
          .header-content {
            position: relative;
            z-index: 2;
          }
          .logo { 
            font-family: 'Cinzel', serif;
            font-size: 36px; 
            font-weight: 700; 
            letter-spacing: 10px; 
            color: #ffffff; 
            margin: 0 0 10px 0; 
            text-shadow: 0 4px 20px rgba(0,0,0,0.8);
          }
          .headline { 
            font-family: 'Cinzel', serif;
            color: #fbbf24; 
            font-size: 24px; 
            font-weight: 600;
            margin: 20px 0 10px 0; 
            letter-spacing: 1px;
          }
          .subheadline {
            color: #94a3b8;
            font-size: 15px;
            font-weight: 300;
            margin: 0;
            letter-spacing: 0.5px;
          }
          
          /* 1. Star Snapshot */
          .snapshot-container {
            position: relative;
            margin: -30px auto 30px auto;
            width: 90%;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid rgba(251, 191, 36, 0.4);
            box-shadow: 0 15px 30px rgba(0,0,0,0.6), 0 0 20px rgba(251, 191, 36, 0.2);
            z-index: 10;
          }
          .snapshot-img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            display: block;
          }
          .target-locator {
            position: absolute;
            top: 40%;
            left: 50%;
            width: 60px;
            height: 60px;
            margin-top: -30px;
            margin-left: -30px;
            border: 2px dashed rgba(251, 191, 36, 0.9);
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(251, 191, 36, 0.6), inset 0 0 15px rgba(251, 191, 36, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse 2s infinite;
          }
          .target-locator::before {
            content: '';
            position: absolute;
            width: 10px;
            height: 10px;
            background-color: #fff;
            border-radius: 50%;
            box-shadow: 0 0 10px 4px rgba(255, 255, 255, 0.8), 0 0 20px 8px rgba(251, 191, 36, 0.6);
          }
          .snapshot-overlay {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
            padding: 20px;
            text-align: left;
          }
          .snapshot-badge {
            display: inline-block;
            background: #fbbf24;
            color: #000;
            font-size: 10px;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }
          .snapshot-name {
            font-family: 'Cinzel', serif;
            font-size: 24px;
            color: #fff;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.8);
          }

          .content { 
            padding: 0 40px 40px 40px; 
          }
          
          /* 2. Secret Star Key Card */
          .key-card {
            background: linear-gradient(135deg, #111827 0%, #030712 100%);
            border: 1px solid rgba(251, 191, 36, 0.3);
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            position: relative;
            overflow: hidden;
          }
          .key-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 2px;
            background: linear-gradient(90deg, transparent, #fbbf24, transparent);
          }
          .key-label {
            color: #94a3b8;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 5px;
          }
          .key-id {
            color: #fff;
            font-family: monospace;
            font-size: 16px;
            letter-spacing: 2px;
            margin-bottom: 20px;
          }
          .key-value {
            font-family: monospace;
            color: #fbbf24;
            font-size: 26px;
            letter-spacing: 5px;
            font-weight: bold;
            background: rgba(251, 191, 36, 0.1);
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px dashed rgba(251, 191, 36, 0.4);
            margin: 15px 0;
          }
          .key-warning {
            color: #cbd5e1;
            font-size: 12px;
            font-style: italic;
          }

          /* 4. Star Coordinates */
          .coords-box {
            display: flex;
            justify-content: space-between;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .coord-item {
            text-align: center;
            flex: 1;
          }
          .coord-item:not(:last-child) {
            border-right: 1px solid rgba(255,255,255,0.1);
          }
          .coord-label {
            color: #94a3b8;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }
          .coord-val {
            color: #60a5fa;
            font-family: monospace;
            font-size: 15px;
          }

          /* 5. Ownership Seal & Details */
          .details-card {
            background: rgba(255,255,255,0.02);
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
            position: relative;
          }
          .seal {
            position: absolute;
            top: -20px; right: 20px;
            width: 70px; height: 70px;
            background: radial-gradient(circle, #fbbf24 0%, #b45309 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5), inset 0 0 0 3px rgba(255,255,255,0.2);
            border: 2px solid #0B0E1E;
          }
          .seal-inner {
            border: 1px dashed rgba(255,255,255,0.5);
            width: 56px; height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-size: 8px;
            text-transform: uppercase;
            font-weight: bold;
            color: #fff;
            line-height: 1.2;
          }

          /* General details table */
          .detail-row {
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
          
          /* 6. Personalized Message */
          .message-section {
            background: rgba(251, 191, 36, 0.05);
            border-left: 4px solid #fbbf24;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 0 8px 8px 0;
          }
          .message-title {
            color: #fbbf24;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 10px 0;
          }
          .message-text {
            color: #fff;
            font-size: 16px;
            font-style: italic;
            line-height: 1.6;
            margin: 0 0 10px 0;
          }
          .message-subtext {
            color: #94a3b8;
            font-size: 12px;
            margin: 0;
          }

          /* 10. Digital Plaque */
          .plaque {
            background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
            border: 2px solid #fbbf24;
            border-radius: 4px;
            padding: 30px;
            text-align: center;
            margin-bottom: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            position: relative;
          }
          .plaque::before {
            content: '';
            position: absolute;
            top: 5px; left: 5px; right: 5px; bottom: 5px;
            border: 1px solid rgba(251, 191, 36, 0.3);
          }
          .plaque-title {
            color: #94a3b8;
            font-size: 12px;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
          }
          .plaque-star {
            font-family: 'Cinzel', serif;
            color: #fbbf24;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
          }
          .plaque-owner-label {
            color: #64748b;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            position: relative;
            z-index: 1;
          }
          .plaque-owner {
            color: #fff;
            font-size: 18px;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
          }
          .plaque-date {
            color: #fbbf24;
            font-size: 12px;
            letter-spacing: 2px;
            position: relative;
            z-index: 1;
          }

          /* 8. Mobile Wallpaper Download Area */
          .wallpaper-box {
            border: 1px dashed rgba(255,255,255,0.2);
            border-radius: 12px;
            padding: 20px;
            display: flex;
            align-items: center;
            margin-bottom: 40px;
            background: rgba(0,0,0,0.2);
          }
          .wallpaper-thumb {
            width: 80px;
            height: 120px;
            border-radius: 6px;
            object-fit: cover;
            border: 2px solid #fbbf24;
            margin-right: 20px;
          }
          .wallpaper-info h4 {
            color: #fff;
            margin: 0 0 5px 0;
            font-size: 16px;
          }
          .wallpaper-info p {
            color: #94a3b8;
            font-size: 13px;
            margin: 0 0 10px 0;
          }
          .wallpaper-link {
            display: inline-block;
            color: #fbbf24;
            text-decoration: none;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #fbbf24;
          }

          .cta-container {
            text-align: center;
            margin: 40px 0;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 18px 45px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            letter-spacing: 1px;
            text-transform: uppercase;
            box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4), 0 0 20px rgba(245, 158, 11, 0.2);
          }
          .special-message {
            font-family: 'Cinzel', serif;
            font-size: 18px;
            line-height: 1.8;
            color: #fbbf24;
            text-align: center;
            font-style: italic;
            padding: 0 20px;
          }
          .footer { 
            background: #020617; 
            padding: 40px 30px; 
            text-align: center; 
            border-top: 1px solid rgba(255,255,255,0.05);
          }
          .footer p {
            font-size: 12px;
            color: #64748b;
            margin: 5px 0;
          }
          .cert-preview {
            border: 2px solid rgba(251, 191, 36, 0.3);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin-bottom: 30px;
            background: url('https://www.transparenttextures.com/patterns/stardust.png') rgba(251, 191, 36, 0.05);
          }
          .cert-text {
            color: #fbbf24;
            font-size: 14px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="header">
              <div class="header-content">
                <h1 class="logo">LUMORA</h1>
                <div class="headline">Your Star Has Been Successfully Registered</div>
                <p class="subheadline">A unique place in the universe now carries your chosen name.</p>
              </div>
            </div>
            
            <!-- 1. Star Snapshot -->
            <div class="snapshot-container">
              <img class="snapshot-img" src="https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=800&auto=format&fit=crop" alt="Your Star in the Cosmos">
              
              <!-- Located Star Highlight -->
              <div class="target-locator"></div>

              <div class="snapshot-overlay">
                <span class="snapshot-badge">Your Registered Star</span>
                <h2 class="snapshot-name">${reg.star_name}</h2>
              </div>
            </div>
            
            <div class="content">
              
              <!-- 2. Secret Star Key Card -->
              <div class="key-card">
                <div class="key-label">Star Registry ID</div>
                <div class="key-id">${reg.unique_id}</div>
                <div class="key-label">Secret Star Key</div>
                <div class="key-value">${reg.secret_key}</div>
                <div class="key-warning">Keep this key safe. It is the unique identifier of your registered star.</div>
              </div>
              
              <!-- 4. Star Coordinates -->
              <div class="coords-box">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td class="coord-item" width="50%">
                      <div class="coord-label">Galaxy Sector</div>
                      <div class="coord-val">${sectorChar}-${sectorNum}</div>
                    </td>
                    <td class="coord-item" width="50%" style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 10px;">
                      <div class="coord-label">Coordinates</div>
                      <div class="coord-val">X:${coordX} Y:${coordY} Z:${coordZ}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- 5. Ownership Seal & Details -->
              <div class="details-card">
                <div class="seal">
                  <div class="seal-inner">Officially<br>Registered</div>
                </div>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
                  <tr>
                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); width: 40%; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">⭐ Star Name</td>
                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; font-family: 'Cinzel', serif; color: #fbbf24; font-size: 18px; font-weight: bold;">${reg.star_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">🔍 Original Name</td>
                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; color: #cbd5e1; font-size: 14px; font-style: italic;">${reg.original_name || 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">👤 Owned By</td>
                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; color: #fff; font-size: 16px;">${reg.owner_name}</td>
                  </tr>
                  <!-- 7. Registration Anniversary -->
                  <tr>
                    <td style="padding: 15px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">📅 Registration Date</td>
                    <td style="padding: 15px 0; text-align: right;">
                      <span style="color: #fff; font-size: 15px; display: block;">${regDateFormatted}</span>
                      <span style="color: #64748b; font-size: 11px; font-style: italic;">Every year we will remember this special day.</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- 6. Personalized Message -->
              ${messageSection}
              
              <!-- 10. Digital Plaque -->
              <div class="plaque">
                <div class="plaque-title">Registered Star</div>
                <div class="plaque-star">${reg.star_name}</div>
                <div class="plaque-owner-label">Owned By</div>
                <div class="plaque-owner">${reg.owner_name}</div>
                <div class="plaque-date">${regDateFormatted}</div>
              </div>

              <!-- 8. Mobile Wallpaper -->
              <div class="wallpaper-box">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="90" valign="top">
                      <img class="wallpaper-thumb" src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&auto=format&fit=crop" alt="Wallpaper Preview">
                    </td>
                    <td valign="middle" style="padding-left: 15px;">
                      <div class="wallpaper-info">
                        <h4 style="margin: 0 0 5px 0;">Your Registered Star Wallpaper</h4>
                        <p style="margin: 0 0 10px 0;">1080 x 1920 HD</p>
                        <a href="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=100&w=1080&auto=format&fit=crop" target="_blank" class="wallpaper-link">Download Wallpaper</a>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <div class="cert-preview">
                <div class="cert-text">📜 Your official Star Registration Certificate has been attached to this email.</div>
              </div>
              
              <div class="cta-container">
                <a href="http://localhost:5173" class="btn">View My Star</a>
              </div>
              
              <p class="special-message">
                "Among billions of stars across the cosmos, one now belongs to your story. Preserve your secret key carefully—it is the gateway to locating your star forever."
              </p>
            </div>
            
            <div class="footer">
              <p>LUMORA STAR REGISTRY &bull; EXPLORE THE COSMOS</p>
              <p>Support: support@lumora.registry</p>
              <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} Lumora. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    let info = await transporter.sendMail({
      from: '"LUMORA" <gancooservices@gmail.com>',
      to: reg.email,
      subject: `Official Star Registration: ${reg.star_name}`,
      html: emailHtml,
      attachments: [
        {
          filename: `Star_Certificate_${reg.unique_id}.pdf`,
          content: pdfBuffer
        }
      ]
    });
    
    console.log("Admin activated email sent: %s", info.messageId);
    
    // Update DB to mark email as sent
    await pool.query('UPDATE registered_stars SET email_sent = TRUE WHERE star_id = ?', [starId]);
    
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error activating registration:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Admin: Delete a registration
app.delete('/api/admin/registrations/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM registered_stars WHERE star_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting registration' });
  }
});

// Admin: Get all custom stars
app.get('/api/admin/custom-stars', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM custom_stars ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching custom stars' });
  }
});

// Admin: Create custom star
app.post('/api/admin/custom-stars', requireAdmin, async (req, res) => {
  const { name, ra, dec_coord, distance, magnitude, color, spectral_type } = req.body;
  if (!name || ra === undefined || dec_coord === undefined) {
    return res.status(400).json({ error: 'Name, RA, and Dec are required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO custom_stars (name, ra, dec_coord, distance, magnitude, color, spectral_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, ra, dec_coord, distance || 100, magnitude || 5.0, color || '#ffffff', spectral_type || 'G']
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Error creating custom star' });
  }
});

// Admin: Delete custom star
app.delete('/api/admin/custom-stars/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM custom_stars WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting custom star' });
  }
});

// --- MY STAR DASHBOARD ENDPOINTS ---

// 1. Verify Secret Key and Get Dashboard Details
app.get('/api/mystar/verify/:key', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT rs.*, ns.constellation 
       FROM registered_stars rs 
       LEFT JOIN named_stars ns ON rs.star_id = ns.star_id 
       WHERE rs.secret_key = ?`,
      [req.params.key]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invalid Secret Star Key' });
    }
    
    const star = rows[0];
    
    // Check if there is an image in published_moments
    const [momentRows] = await pool.query('SELECT image_url FROM published_moments WHERE star_id = ? ORDER BY created_at DESC LIMIT 1', [star.star_id]);
    
    res.json({
      success: true,
      star: {
        star_id: star.star_id,
        star_name: star.star_name,
        original_name: star.original_name,
        owner_name: star.owner_name,
        dedicated_by: star.dedicated_by,
        unique_id: star.unique_id,
        registration_date: star.registration_date,
        constellation: star.constellation || 'Unknown',
        image_url: momentRows.length > 0 ? momentRows[0].image_url : null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to verify key' });
  }
});

// 2. Get Time Capsules
app.get('/api/mystar/:star_id/capsules', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, message, open_on_date, created_at FROM time_capsules WHERE star_id = ? ORDER BY open_on_date ASC', [req.params.star_id]);
    
    // We send all of them, but the frontend will hide the message if open_on_date is in the future
    const now = new Date();
    const mapped = rows.map(r => {
      const openDate = new Date(r.open_on_date);
      const isLocked = openDate > now;
      return {
        id: r.id,
        open_on_date: r.open_on_date,
        created_at: r.created_at,
        message: isLocked ? null : r.message,
        isLocked
      };
    });
    
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch capsules' });
  }
});

// 3. Create Time Capsule
app.post('/api/mystar/:star_id/capsules', async (req, res) => {
  try {
    const { message, open_on_date } = req.body;
    
    // Check limit (only active/future capsules)
    const [countRes] = await pool.query('SELECT COUNT(*) as count FROM time_capsules WHERE star_id = ? AND open_on_date > NOW()', [req.params.star_id]);
    if (countRes[0].count >= 2) {
      return res.status(400).json({ error: 'Maximum limit of 2 Active Time Capsules reached.' });
    }

    await pool.query(
      'INSERT INTO time_capsules (star_id, message, open_on_date) VALUES (?, ?, ?)',
      [req.params.star_id, message, open_on_date]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create capsule' });
  }
});

// 4. Get Wishes
app.get('/api/mystar/:star_id/wishes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, created_at FROM star_wishes WHERE star_id = ? ORDER BY created_at DESC', [req.params.star_id]);
    // Only returning IDs and dates. Text requires passcode unlock.
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishes' });
  }
});

// 5. Create Wish
app.post('/api/mystar/:star_id/wishes', async (req, res) => {
  try {
    const { wish_text, passcode } = req.body;
    
    // Check limit
    const [countRes] = await pool.query('SELECT COUNT(*) as count FROM star_wishes WHERE star_id = ?', [req.params.star_id]);
    if (countRes[0].count >= 3) {
      return res.status(400).json({ error: 'Maximum limit of 3 Secret Wishes reached.' });
    }

    await pool.query(
      'INSERT INTO star_wishes (star_id, wish_text, passcode) VALUES (?, ?, ?)',
      [req.params.star_id, wish_text, passcode]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create wish' });
  }
});

// 6. Unlock Wish
app.post('/api/mystar/:star_id/wishes/:wish_id/unlock', async (req, res) => {
  try {
    const { passcode } = req.body;
    const [rows] = await pool.query(
      'SELECT wish_text FROM star_wishes WHERE id = ? AND star_id = ? AND passcode = ?',
      [req.params.wish_id, req.params.star_id, passcode]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Incorrect Passcode' });
    }
    
    res.json({ success: true, wish_text: rows[0].wish_text });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unlock wish' });
  }
});

// 7. Delete Wish
app.delete('/api/mystar/:star_id/wishes/:wish_id', async (req, res) => {
  try {
    await pool.query('DELETE FROM star_wishes WHERE id = ? AND star_id = ?', [req.params.wish_id, req.params.star_id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete wish' });
  }
});

// Start server
Promise.all([initDB(), initEmail()]).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
  });
});


// Admin: Add a published moment
app.post('/api/admin/moments', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { star_id, description } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required.' });
    }
    const imageUrl = '/uploads/moments/' + req.file.filename;
    
    await pool.query(
      'INSERT INTO published_moments (star_id, description, image_url) VALUES (?, ?, ?)',
      [star_id, description, imageUrl]
    );
    res.json({ success: true, message: 'Moment published successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to publish moment.' });
  }
});

// Admin: Get all published moments
app.get('/api/admin/moments', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pm.*, rs.star_name, rs.owner_name 
      FROM published_moments pm
      JOIN registered_stars rs ON pm.star_id = rs.star_id
      ORDER BY pm.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching moments' });
  }
});

// Admin: Edit a published moment
app.put('/api/admin/moments/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { star_id, description } = req.body;
    if (req.file) {
      const imageUrl = '/uploads/moments/' + req.file.filename;
      await pool.query(
        'UPDATE published_moments SET star_id = ?, description = ?, image_url = ? WHERE id = ?',
        [star_id, description, imageUrl, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE published_moments SET star_id = ?, description = ? WHERE id = ?',
        [star_id, description, req.params.id]
      );
    }
    res.json({ success: true, message: 'Moment updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update moment.' });
  }
});

// Admin: Delete a published moment
app.delete('/api/admin/moments/:id', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT image_url FROM published_moments WHERE id = ?', [req.params.id]);
    if (rows.length > 0) {
      const filePath = path.join(process.cwd(), 'public', rows[0].image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await pool.query('DELETE FROM published_moments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete moment' });
  }
});
