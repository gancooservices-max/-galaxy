const fs = require('fs');
const path = require('path');
let code = fs.readFileSync('server.js', 'utf8');

// 1. Add imports
if (!code.includes('import multer')) {
  code = code.replace(
    "import nodemailer from 'nodemailer';",
    "import nodemailer from 'nodemailer';\nimport multer from 'multer';\nimport path from 'path';\nimport fs from 'fs';"
  );
}

// 2. Add Multer config
if (!code.includes('multer.diskStorage')) {
  const multerConfig = `

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
`;
  code = code.replace('app.use(express.json());', 'app.use(express.json());' + multerConfig);
}

// 3. Add table to initDB
if (!code.includes('published_moments')) {
  const tableQuery = `
    // Create published_moments table
    const createPublishedMomentsQuery = \`
      CREATE TABLE IF NOT EXISTS published_moments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        star_id INT NOT NULL,
        description TEXT,
        image_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \`;
    await pool.query(createPublishedMomentsQuery);
`;
  code = code.replace("console.log(`✅ Database '${dbName}' and tables initialized successfully!`);", tableQuery + "\n    console.log(`✅ Database '${dbName}' and tables initialized successfully!`);");
}

// 4. Add Public API for Moments
if (!code.includes("app.get('/api/moments', ")) {
  const publicApi = `
app.get('/api/moments', async (req, res) => {
  try {
    const [rows] = await pool.query(\`
      SELECT pm.*, rs.star_name, rs.owner_name 
      FROM published_moments pm
      JOIN registered_stars rs ON pm.star_id = rs.star_id
      ORDER BY pm.created_at DESC
    \`);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching moments' });
  }
});
`;
  code = code.replace('/* ==========================================================================\n * ADMIN ROUTES', publicApi + '\n/* ==========================================================================\n * ADMIN ROUTES');
}

// 5. Add Admin APIs for Moments
if (!code.includes("app.post('/api/admin/moments', ")) {
  const adminApis = `
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
    const [rows] = await pool.query(\`
      SELECT pm.*, rs.star_name, rs.owner_name 
      FROM published_moments pm
      JOIN registered_stars rs ON pm.star_id = rs.star_id
      ORDER BY pm.created_at DESC
    \`);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching moments' });
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
`;
  code += '\n' + adminApis;
}

fs.writeFileSync('server.js', code);
console.log('Successfully patched server.js with Published Moments APIs.');
