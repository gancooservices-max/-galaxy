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
      const statement = "This is to certify that a unique star has been officially registered in the name of";
      doc.fontSize(14).font('Helvetica').fillColor('#94A3B8')
         .text(statement, 0, currentY, { align: 'center', width: width });
      currentY += 30;

      // 8. Owner Name (Massive Gold)
      doc.fontSize(52).font('Times-BoldItalic').fillColor('#D4AF37')
         .text(data.ownerName, 0, currentY, { align: 'center', width: width });
      currentY += 65;
      
      doc.fontSize(14).font('Helvetica').fillColor('#94A3B8')
         .text('and recorded within the LUMORA Celestial Registry.', 0, currentY, { align: 'center', width: width });
      currentY += 40;

      // 9. Special Dedication Message
      const message = data.message || "May your dreams shine forever among the stars. This celestial beacon is dedicated to your journey, achievements, and limitless future.";
      doc.fontSize(13).font('Times-Italic').fillColor('#E2E8F0')
         .text(\`"\${message}"\`, 150, currentY, { align: 'center', width: width - 300, lineGap: 5 });

      // 10. Star Details & Mini Map (Bottom Section)
      const bottomY = height - 190;
      
      // -- A. Mini Star Map (Left) --
      const mapX = 120;
      const mapY = bottomY + 50;
      doc.circle(mapX, mapY, 45).lineWidth(1).stroke('#D4AF37');
      // Draw grid inside map
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
      const raStr = \`\${Math.floor((data.coordX || 0) % 24)}h \${Math.floor((data.coordY || 0) % 60)}m \${((data.coordZ || 0) % 60).toFixed(1)}s\`;
      const decStr = \`+\${Math.floor((data.coordX || 0) % 90)}° \${Math.floor((data.coordY || 0) % 60)}' \${((data.coordZ || 0) % 60).toFixed(1)}"\`;
      const distanceStr = \`\${((data.coordZ || 10) * 3.5).toFixed(0)} Light Years\`;
      const visibilityStr = ((data.coordY || 0) % 2 === 0) ? 'Northern Hemisphere' : 'Southern Hemisphere';
      const spectral = data.colorClass ? data.colorClass.split(' ')[1].replace(/[()]/g, '') + '-Type' : 'G-Type';
      const certDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const certId = 'LMR-' + new Date().getFullYear() + '-' + (data.uniqueId || '000000').replace(/[^0-9]/g, '').padStart(6, '0').substring(0, 6);

      const printRow = (label, val, xOffset, yOffset) => {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#94A3B8').text(label + ':', detailsX + xOffset, yOffset);
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF').text(val, detailsX + xOffset + 80, yOffset);
      };

      const dy = 16;
      printRow('Star Name', data.starName, 0, detY);
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
      const qrX = width - 260;
      const qrY = bottomY + 25;
      doc.rect(qrX, qrY, 50, 50).lineWidth(1).stroke('#D4AF37');
      doc.rect(qrX + 5, qrY + 5, 10, 10).fill('#D4AF37');
      doc.rect(qrX + 35, qrY + 5, 10, 10).fill('#D4AF37');
      doc.rect(qrX + 5, qrY + 35, 10, 10).fill('#D4AF37');
      doc.fontSize(6).font('Helvetica').fillColor('#D4AF37').text('VERIFY', qrX, qrY + 55, { width: 50, align: 'center' });

      // -- D. Signature & Seal (Right) --
      const sigX = width - 150;
      const sigY = bottomY + 50;
      
      // Signature curve
      doc.moveTo(sigX - 30, sigY).quadraticCurveTo(sigX - 10, sigY - 20, sigX + 10, sigY).quadraticCurveTo(sigX + 20, sigY + 10, sigX + 30, sigY).quadraticCurveTo(sigX + 50, sigY - 10, sigX + 70, sigY).lineWidth(1.5).stroke('#FFFFFF');
      
      doc.moveTo(sigX - 40, sigY + 15).lineTo(sigX + 80, sigY + 15).lineWidth(0.5).stroke('#D4AF37');
      doc.fontSize(10).font('Times-Bold').fillColor('#D4AF37').text('Official LUMORA Registry', sigX - 40, sigY + 25, { align: 'center', width: 120 });

      // 11. Final Quote at Bottom
      doc.fontSize(10).font('Times-Italic').fillColor('#94A3B8')
         .text('"Among billions of stars in the universe, this one now carries your story."', 0, height - 35, { align: 'center', width: width });

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
  console.log("Successfully replaced generatePDFBuffer with the ultra-luxury LUMORA design.");
} else {
  console.log("Could not find the function boundaries.");
}
