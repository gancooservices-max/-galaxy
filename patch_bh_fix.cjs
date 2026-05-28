const fs = require('fs');

// 1. Fix BlackHole.js Geometry
let bh = fs.readFileSync('src/BlackHole.js', 'utf8');
bh = bh.replace('new THREE.RingGeometry(this.radius * 1.5, this.radius * 5.0, 128, 1)', 'new THREE.PlaneGeometry(this.radius * 10.0, this.radius * 10.0, 64, 64)');
fs.writeFileSync('src/BlackHole.js', bh);

// 2. Add Button to main.js and Audio Fix
let main = fs.readFileSync('src/main.js', 'utf8');
if (!main.includes('Visit Black Hole')) {
  const btnLogic = `
  // Create an explicit button on the screen for the Black Hole
  const bhBtn = document.createElement('button');
  bhBtn.innerText = 'Visit Black Hole';
  bhBtn.style.cssText = 'position: absolute; top: 80px; left: 20px; z-index: 1000; padding: 10px 20px; background: #000; color: #ff8800; border: 1px solid #ff8800; border-radius: 5px; cursor: pointer; font-family: monospace; font-size: 16px; box-shadow: 0 0 10px #ff8800; font-weight: bold; text-transform: uppercase;';
  document.body.appendChild(bhBtn);
  
  bhBtn.addEventListener('click', () => {
    // Resume audio context
    if (renderer.audioCtx && renderer.audioCtx.state === 'suspended') {
      renderer.audioCtx.resume();
    }
    if (!renderer.bhAudioInit && renderer._initBlackHoleAudio) {
      renderer._initBlackHoleAudio();
      renderer.bhAudioInit = true;
    }
    
    // Teleport close to black hole
    renderer.camera.position.set(48000, 200, 50000);
    renderer.controls.target.copy(renderer.blackHole.group.position);
    
    // Disable mission simulator if active
    if (renderer.missionSimulator) {
      renderer.missionSimulator.active = false;
      const ui = document.getElementById('mission-ui');
      if (ui) ui.style.display = 'none';
      const overlay = document.getElementById('mission-overlay');
      if (overlay) overlay.style.display = 'none';
    }
  });
`;
  
  main = main.replace("interaction.enable();", "interaction.enable();\n" + btnLogic);
  fs.writeFileSync('src/main.js', main);
}
