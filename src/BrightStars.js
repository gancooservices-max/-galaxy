export const BrightStars = [
  { name: 'Sirius', ra: 6.752, dec: -16.716, mag: -1.46, bv: 0.00 },
  { name: 'Canopus', ra: 6.399, dec: -52.695, mag: -0.74, bv: 0.15 },
  { name: 'Rigil Kentaurus', ra: 14.660, dec: -60.833, mag: -0.27, bv: 0.71 },
  { name: 'Arcturus', ra: 14.261, dec: 19.182, mag: -0.05, bv: 1.23 },
  { name: 'Vega', ra: 18.615, dec: 38.783, mag: 0.03, bv: 0.00 },
  { name: 'Capella', ra: 5.278, dec: 45.997, mag: 0.08, bv: 0.71 },
  { name: 'Rigel', ra: 5.242, dec: -8.201, mag: 0.18, bv: -0.03 },
  { name: 'Procyon', ra: 7.655, dec: 5.224, mag: 0.34, bv: 0.42 },
  { name: 'Achernar', ra: 1.628, dec: -57.236, mag: 0.45, bv: -0.16 },
  { name: 'Betelgeuse', ra: 5.919, dec: 7.407, mag: 0.42, bv: 1.85 },
  { name: 'Hadar', ra: 14.063, dec: -60.373, mag: 0.61, bv: -0.23 },
  { name: 'Altair', ra: 19.846, dec: 8.868, mag: 0.76, bv: 0.22 },
  { name: 'Acrux', ra: 12.443, dec: -63.099, mag: 0.77, bv: -0.24 },
  { name: 'Aldebaran', ra: 4.598, dec: 16.509, mag: 0.87, bv: 1.54 },
  { name: 'Spica', ra: 13.419, dec: -11.161, mag: 0.98, bv: -0.23 },
  { name: 'Antares', ra: 16.490, dec: -26.432, mag: 1.06, bv: 1.83 },
  { name: 'Pollux', ra: 7.755, dec: 28.026, mag: 1.16, bv: 1.00 },
  { name: 'Fomalhaut', ra: 22.960, dec: -29.622, mag: 1.17, bv: 0.09 },
  { name: 'Deneb', ra: 20.690, dec: 45.280, mag: 1.25, bv: 0.09 },
  { name: 'Mimosa', ra: 12.795, dec: -59.688, mag: 1.25, bv: -0.23 },
  { name: 'Regulus', ra: 10.139, dec: 11.967, mag: 1.36, bv: -0.11 },
  { name: 'Adhara', ra: 6.977, dec: -28.972, mag: 1.50, bv: -0.21 },
  { name: 'Castor', ra: 7.576, dec: 31.888, mag: 1.58, bv: 0.03 },
  { name: 'Gacrux', ra: 12.519, dec: -57.113, mag: 1.63, bv: 1.59 },
  { name: 'Shaula', ra: 17.560, dec: -37.103, mag: 1.62, bv: -0.22 },
  { name: 'Bellatrix', ra: 5.418, dec: 6.349, mag: 1.64, bv: -0.22 },
  { name: 'Elnath', ra: 5.438, dec: 28.607, mag: 1.65, bv: -0.13 },
  { name: 'Miaplacidus', ra: 9.220, dec: -69.717, mag: 1.67, bv: 0.00 },
  { name: 'Alnilam', ra: 5.603, dec: -1.201, mag: 1.69, bv: -0.18 },
  { name: 'Polaris', ra: 2.529, dec: 89.264, mag: 1.97, bv: 0.60 }
];

export function generateSkyStars(numProcedural = 10000) {
  const stars = [];
  
  // Add real named bright stars
  for (const bs of BrightStars) {
    stars.push({
      name: bs.name,
      ra: bs.ra,
      dec: bs.dec,
      mag: bs.mag,
      bv: bs.bv,
      isReal: true
    });
  }
  
  // Add procedural background stars to fill the sky
  for (let i = 0; i < numProcedural; i++) {
    const ra = Math.random() * 24;
    // Dec distribution to avoid clustering at poles (using inverse sine)
    const dec = (Math.asin(Math.random() * 2 - 1) * 180) / Math.PI;
    
    // Most procedural stars should be dim (mag 3 to 6.5)
    // Power law distribution for magnitudes (more dim stars than bright ones)
    const rand = Math.random();
    const mag = 3 + (3.5 * Math.pow(rand, 0.5));
    
    // BV index from -0.3 to 2.0 (blue to red)
    const bv = -0.3 + Math.random() * 2.3;
    
    stars.push({
      name: \`HIP \${Math.floor(Math.random() * 100000)}\`,
      ra: ra,
      dec: dec,
      mag: mag,
      bv: bv,
      isReal: false
    });
  }
  
  return stars;
}
