const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf8');

const oldCssRegex = /\/\* Corner Menubar Premium Styling \*\/[\s\S]*?\.menu-icon \{\s*font-size: 16px;\s*filter: drop-shadow\(0 0 4px rgba\(255,255,255,0\.2\)\);\s*\}/m;

const ultraPremiumCss = `/* Corner Menubar Premium Styling */
.corner-menubar {
  position: absolute;
  top: 90px;
  left: 24px;
  background: rgba(8, 12, 20, 0.45);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  min-width: 200px;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 4px;
}

.menu-title {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  letter-spacing: 4px;
  text-transform: uppercase;
}

#menu-collapse-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 10px;
  padding: 4px;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

#menu-collapse-btn:hover {
  color: rgba(255, 255, 255, 0.8);
}

#corner-menubar-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.3s ease;
}

.menu-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  padding: 10px 14px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu-btn.bh-highlight {
  color: rgba(255, 170, 0, 0.7);
}

.menu-btn.bh-highlight:hover {
  background: rgba(255, 136, 0, 0.05);
  border: 1px solid rgba(255, 136, 0, 0.2);
  color: #ffaa00;
}

.menu-icon {
  font-size: 14px;
  opacity: 0.8;
}`;

if (oldCssRegex.test(css)) {
  css = css.replace(oldCssRegex, ultraPremiumCss);
  fs.writeFileSync('src/style.css', css);
  console.log("Successfully replaced CSS.");
} else {
  console.log("Regex failed to match. Could not replace.");
}
