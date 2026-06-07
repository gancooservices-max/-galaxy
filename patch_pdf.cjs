const fs = require('fs');

let code = fs.readFileSync('server.js', 'utf8');

const newPdfLogic = `
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

      // Deep space background
      doc.rect(0, 0, width, height).fill('#0B101D');
      
      // Scatter stars
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 1.5;
        const opacity = Math.random() * 0.8 + 0.1;
        const isGold = Math.random() > 0.9;
        
        doc.circle(x, y, radius)
           .fillColor(isGold ? '#D4AF37' : '#FFFFFF')
           .fillOpacity(opacity)
           .fill();
      }
      doc.fillOpacity(1);

      // Bright Location Star (Top Right)
      const starX = width - 200;
      const starY = 150;
      
      // Glow
      const glowGrad = doc.radialGradient(starX, starY, 0, starX, starY, 60);
      glowGrad.stop(0, '#FFFFFF', 1);
      glowGrad.stop(0.2, '#FFFFFF', 0.6);
      glowGrad.stop(1, '#0B101D', 0);
      doc.circle(starX, starY, 60).fill(glowGrad);

      // Star cross beams
      doc.moveTo(starX, starY - 50).lineTo(starX, starY + 50).lineWidth(1).stroke('#FFFFFF');
      doc.moveTo(starX - 50, starY).lineTo(starX + 50, starY).lineWidth(1).stroke('#FFFFFF');
      doc.moveTo(starX - 20, starY - 20).lineTo(starX + 20, starY + 20).lineWidth(0.5).strokeOpacity(0.5).stroke('#FFFFFF');
      doc.moveTo(starX - 20, starY + 20).lineTo(starX + 20, starY - 20).lineWidth(0.5).strokeOpacity(0.5).stroke('#FFFFFF');
      doc.strokeOpacity(1);

      // Outer Gold Border
      doc.lineWidth(4);
      doc.rect(20, 20, width - 40, height - 40).stroke('#1A1C29');
      doc.lineWidth(2);
      doc.rect(28, 28, width - 56, height - 56).stroke('#D4AF37');
      doc.lineWidth(1);
      doc.rect(34, 34, width - 68, height - 68).stroke('#D4AF37');

      // Typography Layout
      let currentY = 80;

      doc.fontSize(36).font('Times-Italic').fillColor('#FFFFFF').text('Star Certificate', 0, currentY, { align: 'center', width: width });
      currentY += 60;

      doc.fontSize(14).font('Helvetica').fillColor('#CCCCCC').text('This is to certify that', 0, currentY, { align: 'center', width: width });
      currentY += 30;

      doc.fontSize(16).font('Helvetica').fillColor('#CCCCCC').text('A Star has been officially purchased in the name of', 0, currentY, { align: 'center', width: width });
      currentY += 40;

      // Owner Name (Gold Cursive-like using Times-Italic)
      doc.fontSize(48).font('Times-Italic').fillColor('#D4AF37').text(data.ownerName, 0, currentY, { align: 'center', width: width });
      currentY += 70;

      // Custom Message
      const displayMessage = data.message || "You are as precious and endless as the stars in the sky.";
      doc.fontSize(14).font('Helvetica').fillColor('#CCCCCC').text(displayMessage, 150, currentY, { align: 'center', width: width - 300, lineGap: 5 });

      // Bottom Section Layout
      const bottomY = height - 160;

      // 1. Gold Seal (Left)
      const sealX = 140;
      const sealY = bottomY + 50;
      
      const numPoints = 45;
      const outerRadius = 45;
      const innerRadius = 40;
      let sealPath = '';
      for (let i = 0; i < numPoints * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / numPoints;
        const sx = sealX + r * Math.cos(angle);
        const sy = sealY + r * Math.sin(angle);
        if (i === 0) sealPath += \`M \${sx} \${sy} \`;
        else sealPath += \`L \${sx} \${sy} \`;
      }
      sealPath += 'Z';
      doc.path(sealPath).fillAndStroke('#D4AF37', '#B8860B');
      doc.circle(sealX, sealY, 35).lineWidth(1).stroke('#FFFFFF');
      doc.circle(sealX, sealY, 31).lineWidth(0.5).dash(2, {space: 2}).stroke('#FFFFFF');
      doc.undash();
      doc.fontSize(8).font('Times-Bold').fillColor('#1A1C29').text('CELESTIAL', sealX - 35, sealY - 14, { width: 70, align: 'center' });
      // Inner star
      doc.moveTo(sealX, sealY - 3).lineTo(sealX + 2, sealY + 2).lineTo(sealX + 7, sealY + 2).lineTo(sealX + 3, sealY + 5).lineTo(sealX + 4, sealY + 10).lineTo(sealX, sealY + 7).lineTo(sealX - 4, sealY + 10).lineTo(sealX - 3, sealY + 5).lineTo(sealX - 7, sealY + 2).lineTo(sealX - 2, sealY + 2).fill('#1A1C29');
      doc.fontSize(8).font('Times-Bold').fillColor('#1A1C29').text('REGISTRY', sealX - 35, sealY + 14, { width: 70, align: 'center' });

      // 2. Star Details (Center)
      const detailsX = width / 2 - 120;
      let detY = bottomY;
      
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#CCCCCC').text('Your Star Details', detailsX, detY);
      detY += 15;
      doc.moveTo(detailsX, detY).lineTo(detailsX + 240, detY).lineWidth(0.5).stroke('#D4AF37');
      detY += 10;

      const printRow = (label, val) => {
        doc.fontSize(10).font('Helvetica').fillColor('#AAAAAA').text(label + ':', detailsX, detY);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF').text(val, detailsX + 90, detY);
        detY += 18;
      };

      const regDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      // Approximate RA and Dec based on coordinates for flavor
      const ra = \`\${Math.floor(data.coordX % 24)}h \${Math.floor(data.coordY % 60)}m \${(data.coordZ % 60).toFixed(1)}s\`;
      const dec = \`+\${Math.floor(data.coordX % 90)}° \${Math.floor(data.coordY % 60)}' \${(data.coordZ % 60).toFixed(1)}"\`;

      printRow('Star Name', data.starName);
      printRow('Right Ascension', ra);
      printRow('Declination', dec);
      printRow('Date', regDate);

      // 3. Signature & Registry (Right)
      const sigX = width - 240;
      const sigY = bottomY + 50;
      
      // Draw fake elegant signature line
      doc.moveTo(sigX + 20, sigY).quadraticCurveTo(sigX + 40, sigY - 30, sigX + 60, sigY).quadraticCurveTo(sigX + 70, sigY + 10, sigX + 80, sigY).quadraticCurveTo(sigX + 100, sigY - 10, sigX + 120, sigY).quadraticCurveTo(sigX + 140, sigY + 5, sigX + 160, sigY - 5).lineWidth(1.5).stroke('#FFFFFF');
      
      doc.moveTo(sigX, sigY + 15).lineTo(sigX + 180, sigY + 15).lineWidth(0.5).stroke('#D4AF37');
      doc.fontSize(12).font('Times-Roman').fillColor('#CCCCCC').text('Star Registry', sigX, sigY + 25, { align: 'center', width: 180 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
`;

const startIndex = code.indexOf('// Generate PDF Buffer');
const endIndex = code.indexOf('// Simple Admin Auth Middleware');

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newPdfLogic + '\n' + code.substring(endIndex);
  fs.writeFileSync('server.js', code);
  console.log("Successfully replaced generatePDFBuffer with the new dark theme design.");
} else {
  console.log("Could not find the function boundaries.");
}
