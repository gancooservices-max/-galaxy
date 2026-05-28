import fs from 'fs';
let code = fs.readFileSync('src/MissionSimulator.js', 'utf8');

// 1. Fix Audio not stopping on exit
code = code.replace(
  `this._clearMissionScene();`,
  `this._clearMissionScene();\n    this._stopAudio();`
);

// 2. Fix launchDir in update() reverting to North Pole
code = code.replace(
  `const launchDir = new THREE.Vector3(0, 1, 0).normalize(); // stand vertically at top`,
  `// Sriharikota approx lat/lon
    const lat = 13.7 * (Math.PI / 180);
    const lon = 80.2 * (Math.PI / 180);
    const launchDir = new THREE.Vector3(
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
      Math.cos(lat) * Math.cos(lon)
    ).normalize();`
);

// 3. Fix Rocket Cam offset scale
code = code.replace(
  `const camOffset = new THREE.Vector3(1.0, 0.5, -2.0);`,
  `const camOffset = new THREE.Vector3(0.12, 0.06, -0.24); // Scaled for 0.08 rocket`
);

// 4. Change UI buttons size
code = code.replace(
  `.hud-btn {
        padding: 10px 20px;
        background: #e65c00;
        border: 1px solid #ff7a24;
        border-radius: 6px;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 12px;`,
  `.hud-btn {
        padding: 6px 12px;
        background: #e65c00;
        border: 1px solid #ff7a24;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        cursor: pointer;
        pointer-events: auto;
        transition: all 0.2s ease;
        font-size: 10px;`
);

// 5. Ensure camera buttons work by using pointerdown
code = code.replace(
  `document.getElementById('cam-auto').addEventListener('click', () => { this.activeCameraMode = 'Auto'; this._playBeep(); });
    document.getElementById('cam-rocket').addEventListener('click', () => { this.activeCameraMode = 'Rocket'; this._playBeep(); });
    document.getElementById('cam-wide').addEventListener('click', () => { this.activeCameraMode = 'Wide'; this._playBeep(); });`,
  `const btnAuto = document.getElementById('cam-auto');
    const btnRocket = document.getElementById('cam-rocket');
    const btnWide = document.getElementById('cam-wide');
    if (btnAuto) btnAuto.onpointerdown = (e) => { e.stopPropagation(); this.activeCameraMode = 'Auto'; this._playBeep(); };
    if (btnRocket) btnRocket.onpointerdown = (e) => { e.stopPropagation(); this.activeCameraMode = 'Rocket'; this._playBeep(); };
    if (btnWide) btnWide.onpointerdown = (e) => { e.stopPropagation(); this.activeCameraMode = 'Wide'; this._playBeep(); };`
);

// 6. Fix "Auto" mode camera bug in _updateCinematicCamera()
// If Auto mode, it falls through, but we also want it to actually re-enable cinematic updates.
// (Currently Auto just falls through, which is correct). Let's make sure it's fully responsive.
code = code.replace(
  `// End of manual overrides, fallback to auto (cinematic) logic below.`,
  `// End of manual overrides, fallback to auto (cinematic) logic below.
    if (this.activeCameraMode !== 'Auto') return; // Stop here if another mode was requested but fell through unexpectedly`
);

fs.writeFileSync('src/MissionSimulator.js', code);
console.log('Patch 2 successfully applied!');
