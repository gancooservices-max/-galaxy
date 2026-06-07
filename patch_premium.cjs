const fs = require('fs');
let content = fs.readFileSync('src/landing/LandingPage.jsx', 'utf8');

// 1. Add background image to StarrySky
content = content.replace(
  '<div className="fixed inset-0 bg-[#0B0C10] z-[-3]" />',
  '<div className="fixed inset-0 bg-[#0B0C10] z-[-3] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url(\'/images/space_bg.png\')" }} />\n      <div className="fixed inset-0 bg-black/40 z-[-3]" /> {/* Darken overlay for better text readability */}'
);

// 2. Enhance Glassmorphism
// Let's create a premium glass class string
const glassBase = 'bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]';
const glassHover = 'hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]';

// Replace standard bg-white/5 and basic blur with our premium glass
content = content.replace(/bg-white\/5 backdrop-blur-md/g, `${glassBase} ${glassHover}`);
content = content.replace(/bg-white\/5 border border-white\/10/g, `${glassBase} ${glassHover}`);
content = content.replace(/bg-white\/5 border-t-2/g, `${glassBase} border-t-2`);

// Ensure Navbar looks premium glass too
content = content.replace(/bg-\[\#050508\]\/95 backdrop-blur-md/g, 'bg-[#050508]/40 backdrop-blur-3xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]');

// Update Contact Form
content = content.replace(/bg-black\/30 backdrop-blur-2xl/g, 'bg-black/40 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] border border-white/10');

// Update inputs in contact form
content = content.replace(/bg-white\/5 border border-white\/10 rounded-2xl p-4/g, 'bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-inner');

// Write back
fs.writeFileSync('src/landing/LandingPage.jsx', content);
console.log('Upgraded to premium glassmorphism and space background');
