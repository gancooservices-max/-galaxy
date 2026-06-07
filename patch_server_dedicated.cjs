const fs = require('fs');

let code = fs.readFileSync('server.js', 'utf8');

// 1. Add dedicated_by to the table query
if (!code.includes('dedicated_by VARCHAR(255)')) {
  code = code.replace(
    'message TEXT,',
    'message TEXT,\n        dedicated_by VARCHAR(255) DEFAULT NULL,'
  );
  
  // NOTE: If the table already exists, the CREATE TABLE won't alter it.
  // We need to run an ALTER TABLE query just in case it's already there.
  const alterTableQuery = `
    try {
      await pool.query('ALTER TABLE registered_stars ADD COLUMN dedicated_by VARCHAR(255) DEFAULT NULL');
      console.log('Added dedicated_by column to registered_stars');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') {
        console.error('Error adding dedicated_by column:', e.message);
      }
    }
  `;
  code = code.replace(
    'await pool.query(createRegisteredStarsQuery);',
    'await pool.query(createRegisteredStarsQuery);\n' + alterTableQuery
  );
}

// 2. Update /api/stars/register endpoint
if (!code.includes('const { starId, ownerName, email, starName, message, originalName, dedicatedBy } = req.body;')) {
  code = code.replace(
    'const { starId, ownerName, email, starName, message, originalName } = req.body;',
    'const { starId, ownerName, email, starName, message, originalName, dedicatedBy } = req.body;'
  );
  
  code = code.replace(
    'INSERT INTO registered_stars (star_id, owner_name, email, star_name, original_name, message, unique_id, secret_key)',
    'INSERT INTO registered_stars (star_id, owner_name, email, star_name, original_name, message, dedicated_by, unique_id, secret_key)'
  );
  
  code = code.replace(
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  
  code = code.replace(
    '[starId, ownerName, email, starName, originalName || starName, message, uniqueId, secretKey]',
    '[starId, ownerName, email, starName, originalName || starName, message, dedicatedBy || null, uniqueId, secretKey]'
  );
}

// 3. Update pdf generation to include dedicated_by
if (!code.includes('dedicatedBy: reg.dedicated_by')) {
  code = code.replace(
    'colorClass',
    'colorClass,\n      dedicatedBy: reg.dedicated_by'
  );
}

// 4. Update the actual PDF layout in generatePDFBuffer
if (code.includes('// -- D. Signature & Seal (Right) --')) {
  const newSealLogic = `
      // -- D. Premium Image Stamp & Signature (Right) --
      const sigX = width - 150;
      const sigY = bottomY + 50;

      // Draw real image stamp if exists
      const stampPath = require('path').join(process.cwd(), 'public/images/stamp.png');
      if (require('fs').existsSync(stampPath)) {
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
`;
  code = code.replace(
    /\/\/ -- D\. Signature & Seal \(Right\) --[\s\S]*?\/\/ 11\. Final Quote at Bottom/,
    newSealLogic + '\n      // 11. Final Quote at Bottom'
  );
}

fs.writeFileSync('server.js', code);
console.log('Successfully patched server.js for Dedicated By and Image Stamp');
