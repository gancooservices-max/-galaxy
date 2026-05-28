const fs = require('fs');

let uiCode = fs.readFileSync('src/UI.js', 'utf-8');

uiCode = uiCode.replace(
  `    this.$btnDrive = document.getElementById('btn-drive');`,
  `    this.$btnDrive = document.getElementById('btn-drive');
    this.$btnCancelMap = document.getElementById('btn-cancel-map');`
);

uiCode = uiCode.replace(
  `    this.$closeMapBtn.addEventListener('click', () => this.closeMapModal());`,
  `    this.$closeMapBtn.addEventListener('click', () => this.closeMapModal());
    this.$btnCancelMap.addEventListener('click', () => this.closeMapModal());`
);

fs.writeFileSync('src/UI.js', uiCode, 'utf-8');

let mainCode = fs.readFileSync('src/main.js', 'utf-8');

mainCode = mainCode.replace(
  `  // Map Teleport (Planetarium View)
  ui.onTeleport = (lat, lon) => {
    renderer.teleportToSurface(lat, lon);
  };`,
  `  // Map Teleport (Planetarium View)
  ui.onTeleport = (lat, lon) => {
    renderer.teleportToSurface(lat, lon);
    document.getElementById('planetarium-ui').classList.remove('hidden');
    document.getElementById('bottom-controls').classList.add('hidden');
  };

  // Exit Planetarium (Earth)
  const btnExitEarth = document.getElementById('btn-exit-earth');
  if (btnExitEarth) {
    btnExitEarth.addEventListener('click', () => {
      renderer.resetView(); // Exits planetarium mode and returns to space
      document.getElementById('planetarium-ui').classList.add('hidden');
      document.getElementById('bottom-controls').classList.remove('hidden');
    });
  }`
);

fs.writeFileSync('src/main.js', mainCode, 'utf-8');
console.log('UI buttons wired up');
