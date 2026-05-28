const fs = require('fs');

// 1. Update style.css
let css = fs.readFileSync('src/style.css', 'utf8');
if (!css.includes('.corner-menubar')) {
  const menuCss = `
/* Corner Menubar */
.corner-menubar {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(10, 15, 30, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.menu-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  padding: 12px 16px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(4px);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
}

.menu-btn.bh-highlight {
  border-color: rgba(255, 136, 0, 0.4);
  color: #ffaa00;
}
.menu-btn.bh-highlight:hover {
  background: rgba(255, 136, 0, 0.15);
  box-shadow: 0 0 15px rgba(255, 136, 0, 0.3);
}

.menu-icon {
  font-size: 18px;
}
`;
  fs.writeFileSync('src/style.css', css + '\n' + menuCss);
}

// 2. Update index.html
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('<div id="corner-menubar"')) {
  const menuHtml = `
  <!-- Corner Menubar -->
  <div id="corner-menubar" class="corner-menubar">
    <button id="menu-btn-bh" class="menu-btn bh-highlight">
      <span class="menu-icon">⚫</span>
      <span>Black Hole</span>
    </button>
    <button id="menu-btn-stars" class="menu-btn">
      <span class="menu-icon">✨</span>
      <span>Show Stars</span>
    </button>
    <button id="menu-btn-chandra" class="menu-btn">
      <span class="menu-icon">🚀</span>
      <span>Chandrayaan</span>
    </button>
    <button id="menu-btn-solar" class="menu-btn">
      <span class="menu-icon">☀️</span>
      <span>Solar Data</span>
    </button>
  </div>
`;
  html = html.replace('<!-- Side Panel -->', menuHtml + '\n  <!-- Side Panel -->');
  fs.writeFileSync('index.html', html);
}

// 3. Update main.js
let main = fs.readFileSync('src/main.js', 'utf8');

// Remove the old ugly button code
const oldBtnRegex = /\/\/ Create an explicit button on the screen for the Black Hole[\s\S]*?if \(overlay\) overlay\.style\.display = 'none';\n\s*}\n\s*}\);/m;
main = main.replace(oldBtnRegex, '');

// Add new Event listeners
if (!main.includes("document.getElementById('menu-btn-bh')")) {
  const newLogic = `
  // --- Corner Menubar Logic ---
  const btnBh = document.getElementById('menu-btn-bh');
  const btnStars = document.getElementById('menu-btn-stars');
  const btnChandra = document.getElementById('menu-btn-chandra');
  const btnSolar = document.getElementById('menu-btn-solar');

  if (btnBh) {
    btnBh.addEventListener('click', () => {
      if (renderer.audioCtx && renderer.audioCtx.state === 'suspended') {
        renderer.audioCtx.resume();
      }
      if (!renderer.bhAudioInit && renderer._initBlackHoleAudio) {
        renderer._initBlackHoleAudio();
        renderer.bhAudioInit = true;
      }
      renderer.camera.position.set(48000, 200, 50000);
      renderer.controls.target.copy(renderer.blackHole.group.position);
      
      if (renderer.missionSimulator) {
        renderer.missionSimulator.active = false;
        const ui = document.getElementById('mission-ui');
        if (ui) ui.style.display = 'none';
        const overlay = document.getElementById('mission-overlay');
        if (overlay) overlay.style.display = 'none';
      }
    });
  }

  if (btnStars) {
    btnStars.addEventListener('click', () => {
      // Fly out to see the entire galaxy smoothly
      const startCam = renderer.camera.position.clone();
      const endCam = new THREE.Vector3(0, 1500, 4000);
      const startTarget = renderer.controls.target.clone();
      const endTarget = new THREE.Vector3(0, 0, 0);
      
      const startTime = performance.now();
      const duration = 2000;
      renderer._isCinematicFlight = true;
      
      const flyAnim = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const et = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; // easeInOutCubic
        renderer.camera.position.lerpVectors(startCam, endCam, et);
        renderer.controls.target.lerpVectors(startTarget, endTarget, et);
        renderer.controls.update();
        if (t < 1) requestAnimationFrame(flyAnim);
        else renderer._isCinematicFlight = false;
      };
      requestAnimationFrame(flyAnim);
      
      // Stop mission simulator if running
      if (renderer.missionSimulator) {
        renderer.missionSimulator.active = false;
        const ui = document.getElementById('mission-ui');
        if (ui) ui.style.display = 'none';
      }
    });
  }

  if (btnChandra) {
    btnChandra.addEventListener('click', () => {
      // Safely trigger the existing Chandrayaan button
      const existingBtn = document.getElementById('btn-mission');
      if (existingBtn) {
        existingBtn.click();
      }
    });
  }

  if (btnSolar) {
    btnSolar.addEventListener('click', () => {
      // Focus and simulate click on the planet dropdown
      const planetInput = document.getElementById('planet-search-input');
      const planetWrapper = document.getElementById('planet-search-wrapper');
      if (planetInput && planetWrapper) {
        // We can simulate a click to open the UI's dropdown
        planetInput.click();
        planetInput.focus();
        // Add active state to make it visible
        planetWrapper.classList.add('active');
        const dropdown = document.getElementById('planet-search-dropdown');
        if (dropdown) dropdown.classList.remove('hidden');
      }
      
      // Fly back to Solar System view
      const startCam = renderer.camera.position.clone();
      const endCam = new THREE.Vector3(0, 50, 150);
      const startTarget = renderer.controls.target.clone();
      const endTarget = new THREE.Vector3(0, 0, 0);
      
      const startTime = performance.now();
      const duration = 1500;
      renderer._isCinematicFlight = true;
      
      const flyAnim = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const et = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
        renderer.camera.position.lerpVectors(startCam, endCam, et);
        renderer.controls.target.lerpVectors(startTarget, endTarget, et);
        renderer.controls.update();
        if (t < 1) requestAnimationFrame(flyAnim);
        else renderer._isCinematicFlight = false;
      };
      requestAnimationFrame(flyAnim);
    });
  }
`;
  
  main = main.replace("interaction.enable();", "interaction.enable();\n" + newLogic);
  fs.writeFileSync('src/main.js', main);
}
