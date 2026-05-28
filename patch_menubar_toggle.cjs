const fs = require('fs');

// 1. Hide the duplicate buttons in index.html
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace('<button id="btn-stars" class="ctrl-btn active" title="Toggle Background Stars">', '<button id="btn-stars" class="ctrl-btn active" title="Toggle Background Stars" style="display: none;">');
html = html.replace('<button id="btn-mission" class="ctrl-btn" title="Launch Chandrayaan Mission">', '<button id="btn-mission" class="ctrl-btn" title="Launch Chandrayaan Mission" style="display: none;">');
html = html.replace('<button id="btn-telemetry" class="ctrl-btn" title="Toggle Live Solar Data">', '<button id="btn-telemetry" class="ctrl-btn" title="Toggle Live Solar Data" style="display: none;">');

// 2. Add collapse toggle to corner-menubar
if (!html.includes('menu-collapse-btn')) {
  const newMenubarStart = `
  <!-- Corner Menubar -->
  <div id="corner-menubar" class="corner-menubar">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; padding: 0 5px;">
      <span style="color: white; font-size: 12px; font-family: 'Inter', sans-serif; font-weight: bold; opacity: 0.7; letter-spacing: 2px;">FEATURES</span>
      <button id="menu-collapse-btn" style="background: none; border: none; color: white; cursor: pointer; opacity: 0.7; font-size: 14px; padding: 2px;">▼</button>
    </div>
    <div id="corner-menubar-items" style="display: flex; flex-direction: column; gap: 8px; transition: all 0.3s ease;">
`;
  html = html.replace('<!-- Corner Menubar -->\n  <div id="corner-menubar" class="corner-menubar">', newMenubarStart);
  
  // Close the corner-menubar-items div
  html = html.replace('</button>\n  </div>\n  <!-- Side Panel -->', '</button>\n    </div>\n  </div>\n  <!-- Side Panel -->');
}

fs.writeFileSync('index.html', html);

// 3. Add toggle logic to main.js
let main = fs.readFileSync('src/main.js', 'utf8');
if (!main.includes("document.getElementById('menu-collapse-btn')")) {
  const toggleLogic = `
  const btnCollapse = document.getElementById('menu-collapse-btn');
  const menuItems = document.getElementById('corner-menubar-items');
  if (btnCollapse && menuItems) {
    btnCollapse.addEventListener('click', () => {
      if (menuItems.style.display === 'none') {
        menuItems.style.display = 'flex';
        btnCollapse.textContent = '▼';
      } else {
        menuItems.style.display = 'none';
        btnCollapse.textContent = '▲';
      }
    });
  }
`;
  main = main.replace("// --- Corner Menubar Logic ---", "// --- Corner Menubar Logic ---\n" + toggleLogic);
  fs.writeFileSync('src/main.js', main);
}
