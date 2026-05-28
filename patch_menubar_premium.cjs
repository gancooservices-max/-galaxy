const fs = require('fs');

// 1. Update style.css
let css = fs.readFileSync('src/style.css', 'utf8');

// Replace old menubar styles
const oldCssRegex = /\/\* Corner Menubar \*\/[\s\S]*?\.menu-icon \{\s*font-size: 18px;\s*\}/m;

const premiumCss = `/* Corner Menubar Premium Styling */
.corner-menubar {
  position: absolute;
  bottom: 24px;
  left: 24px;
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(0, 212, 255, 0.05);
  min-width: 220px;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 4px;
}

.menu-title {
  color: var(--accent-cyan);
  font-size: 11px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
}

#menu-collapse-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  padding: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

#menu-collapse-btn:hover {
  color: var(--accent-cyan);
  transform: scale(1.2);
}

#corner-menubar-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.3s ease;
}

.menu-btn {
  background: rgba(0, 212, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  color: var(--text-primary);
  padding: 12px 16px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  position: relative;
  overflow: hidden;
}

.menu-btn::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent);
  transition: all 0.5s ease;
}

.menu-btn:hover::before {
  left: 100%;
}

.menu-btn:hover {
  background: rgba(0, 212, 255, 0.08);
  border-color: var(--accent-cyan);
  color: #fff;
  transform: translateX(6px);
  box-shadow: 0 0 20px var(--accent-glow);
}

.menu-btn.bh-highlight {
  background: rgba(255, 136, 0, 0.05);
  border-color: rgba(255, 136, 0, 0.3);
  color: #ffd280;
}
.menu-btn.bh-highlight:hover {
  background: rgba(255, 136, 0, 0.15);
  border-color: #ffaa00;
  color: #fff;
  box-shadow: 0 0 25px rgba(255, 136, 0, 0.25);
}

.menu-icon {
  font-size: 16px;
  filter: drop-shadow(0 0 4px rgba(255,255,255,0.2));
}`;

if (oldCssRegex.test(css)) {
  css = css.replace(oldCssRegex, premiumCss);
} else {
  css += '\n' + premiumCss;
}
fs.writeFileSync('src/style.css', css);

// 2. Update index.html
let html = fs.readFileSync('index.html', 'utf8');

const oldHeaderRegex = /<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; padding: 0 5px;">\s*<span style="[^"]*">FEATURES<\/span>\s*<button id="menu-collapse-btn"[^>]*>▼<\/button>\s*<\/div>/m;

const newHeaderHtml = `
    <div class="menu-header">
      <span class="menu-title">FEATURES</span>
      <button id="menu-collapse-btn" title="Toggle Menu">▼</button>
    </div>
`;

if (oldHeaderRegex.test(html)) {
  html = html.replace(oldHeaderRegex, newHeaderHtml);
}

// Remove old inline transitions if any
html = html.replace('id="corner-menubar-items" style="display: flex; flex-direction: column; gap: 8px; transition: all 0.3s ease;"', 'id="corner-menubar-items"');

fs.writeFileSync('index.html', html);
