const fs = require('fs');
let content = fs.readFileSync('src/landing/LandingPage.jsx', 'utf8');

// 1. Make Logo Name Colorful
content = content.replace(
  '<div className="flex items-center gap-3 text-[22px] font-display font-bold tracking-widest text-white">\n          <img src="/logo.png" alt="LUMORA" className="w-7 h-7 rounded-[4px]" />\n          LUMORA\n        </div>',
  '<div className="flex items-center gap-3 text-[22px] font-display font-bold tracking-widest">\n          <img src="/logo.png" alt="LUMORA" className="w-7 h-7 rounded-[4px]" />\n          <span className="text-transparent bg-clip-text bg-gradient-to-r from-aurora-cyan via-nebula-pink to-nebula-purple">LUMORA</span>\n        </div>'
);

// 2. Button Design for Explore Galaxy
content = content.replace(
  '<button onClick={onExplore} className="font-sans font-bold text-[15px] text-white hover:text-gray-300 transition-colors">\n            Explore Galaxy\n          </button>',
  '<button onClick={onExplore} className="px-6 py-2 rounded-full bg-gradient-to-r from-nebula-purple to-galaxy-blue text-white font-bold text-[15px] hover:shadow-[0_0_20px_rgba(138,43,226,0.4)] transition-all">\n            Explore Galaxy\n          </button>'
);

// 3. Make Landing Page Background Light and text dark
content = content.replace(/bg-\[\#0B0C10\]/g, 'bg-slate-50');
content = content.replace(/bg-\[\#050508\]/g, 'bg-white');

// Swap text colors
content = content.replace(/text-white/g, 'text-slate-900');
content = content.replace(/text-gray-300/g, 'text-slate-700');
content = content.replace(/text-gray-400/g, 'text-slate-600');

// Restore text-white for buttons with dark gradient backgrounds
content = content.replace(/to-galaxy-blue text-slate-900/g, 'to-galaxy-blue text-white');
content = content.replace(/to-nebula-purple text-slate-900/g, 'to-nebula-purple text-white');

// Fix border and bg translucency for light mode
content = content.replace(/border-white\/10/g, 'border-slate-300');
content = content.replace(/border-white\/20/g, 'border-slate-400');
content = content.replace(/border-white\/30/g, 'border-slate-400');
content = content.replace(/border-white\/5/g, 'border-slate-200');
content = content.replace(/bg-white\/5/g, 'bg-white/60');
content = content.replace(/bg-white\/10/g, 'bg-white/80');

// Fix specific text colors
content = content.replace(/text-slate-900 font-bold mt-4/g, 'text-white font-bold mt-4');
content = content.replace(/bg-black\/30/g, 'bg-white/40');
content = content.replace(/bg-black/g, 'bg-slate-100');
content = content.replace(/text-slate-900 font-bold text-lg hover:shadow/g, 'text-white font-bold text-lg hover:shadow');

// Fix star colors in StarrySky
content = content.replace(/'#ffffff'/g, "'#334155'"); // white stars to dark slate
content = content.replace(/selection:text-slate-900/g, 'selection:text-white'); // highlight text color

fs.writeFileSync('src/landing/LandingPage.jsx', content);
console.log('Patched LandingPage.jsx');
