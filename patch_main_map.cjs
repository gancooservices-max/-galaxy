const fs = require('fs');

let mainCode = fs.readFileSync('src/main.js', 'utf-8');

mainCode = mainCode.replace(
  `  // Earth click handler
  interaction.onEarthClick = () => {
    renderer.flyToEarth();
    ui.hideTooltip();
  };`,
  `  // Earth click handler
  interaction.onEarthClick = () => {
    ui.openMapModal();
    ui.hideTooltip();
  };`
);

mainCode = mainCode.replace(
  `  // Auto-rotate toggle
  ui.onAutoRotate = (enabled) => renderer.setAutoRotate(enabled);`,
  `  // Auto-rotate toggle
  ui.onAutoRotate = (enabled) => renderer.setAutoRotate(enabled);

  // Map Teleport (Planetarium View)
  ui.onTeleport = (lat, lon) => {
    renderer.teleportToSurface(lat, lon);
  };

  // Map Drive (Spaceship Mode)
  ui.onDriveSpaceship = () => {
    renderer.enableSpaceshipMode();
    document.getElementById('drive-ui').classList.remove('hidden');
    document.getElementById('bottom-controls').classList.add('hidden');
  };

  // Exit Drive Mode
  const btnExitDrive = document.getElementById('btn-exit-drive');
  if (btnExitDrive) {
    btnExitDrive.addEventListener('click', () => {
      renderer.disableSpaceshipMode();
      document.getElementById('drive-ui').classList.add('hidden');
      document.getElementById('bottom-controls').classList.remove('hidden');
    });
  }`
);

fs.writeFileSync('src/main.js', mainCode, 'utf-8');
console.log('main.js patched');
