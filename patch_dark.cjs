const fs = require('fs');
let content = fs.readFileSync('src/landing/LandingPage.jsx', 'utf8');

// Reverse light theme colors
content = content.replace(/bg-slate-50/g, 'bg-[#0B0C10]');
content = content.replace(/bg-white\/95/g, 'bg-[#050508]/95'); // Navbar
content = content.replace(/bg-white\/40/g, 'bg-black/30'); // Contact form
content = content.replace(/bg-slate-100/g, 'bg-black'); // Footer
content = content.replace(/text-slate-900/g, 'text-white');
content = content.replace(/text-slate-700/g, 'text-gray-300');
content = content.replace(/text-slate-600/g, 'text-gray-400');
content = content.replace(/border-slate-300/g, 'border-white/10');
content = content.replace(/border-slate-400/g, 'border-white/20');
content = content.replace(/border-slate-200/g, 'border-white/5');
content = content.replace(/bg-white\/60/g, 'bg-white/5');
content = content.replace(/bg-white\/80/g, 'bg-white/10');

// Fix tab hover back to dark style
content = content.replace(/hover:bg-black hover:text-white/g, 'hover:bg-white/10 hover:text-white'); // Fix the hover state for tabs which might have been converted to black
// The previous hover was: hover:bg-slate-100 hover:text-slate-900
// It got converted to hover:bg-black hover:text-white by the above replacements.
content = content.replace(/hover:bg-black hover:text-white/g, 'hover:bg-white/10 hover:text-white');

// Fix specific text colors
content = content.replace(/'#334155'/g, "'#ffffff'"); // dark stars back to white

fs.writeFileSync('src/landing/LandingPage.jsx', content);
console.log('Reverted to dark galaxy theme');
