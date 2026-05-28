const fs = require('fs');

// 1. Update index.html for the Game Over screen
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('blackhole-death')) {
  html = html.replace('</body>', '  <div id="blackhole-death" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 9999; opacity: 0; pointer-events: none; transition: opacity 3s ease; display: flex; align-items: center; justify-content: center; color: black; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 10px;">SPAGHETTIFICATION COMPLETE</div>\n</body>');
  fs.writeFileSync('index.html', html);
}

// 2. Update main.js for Sidebar
let main = fs.readFileSync('src/main.js', 'utf8');
if (!main.includes('>Black Hole<')) {
  const sidebarLogic = `
  // Add Black Hole button
  const bhBtn = document.createElement('div');
  bhBtn.className = 'nav-item';
  bhBtn.innerHTML = \`<span>⚫</span><span class="nav-text">Black Hole</span>\`;
  document.querySelector('.sidebar').appendChild(bhBtn);
  
  bhBtn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    bhBtn.classList.add('active');
    
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
      document.getElementById('mission-ui').style.display = 'none';
      document.getElementById('mission-overlay').style.display = 'none';
    }
  });
`;
  main = main.replace("document.getElementById('share-btn').addEventListener('click', async () => {", sidebarLogic + "\n  document.getElementById('share-btn').addEventListener('click', async () => {");
  fs.writeFileSync('src/main.js', main);
}

// 3. Update StarRenderer.js
let renderer = fs.readFileSync('src/StarRenderer.js', 'utf8');

if (!renderer.includes('import { ShaderPass }')) {
  renderer = renderer.replace("import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';", 
    "import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';\nimport { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';\nimport { BlackHole } from './BlackHole.js';\nimport { GravitationalLensingShader } from './GravitationalLensingShader.js';");
}

if (!renderer.includes('this.blackHole = new BlackHole')) {
  renderer = renderer.replace("this.composer.addPass(bloomPass);", 
    "this.composer.addPass(bloomPass);\n\n    // Add Gravitational Lensing Pass\n    this.lensingPass = new ShaderPass(GravitationalLensingShader);\n    this.composer.addPass(this.lensingPass);\n\n    // Create Black Hole\n    this.blackHole = new BlackHole(this.scene, this.renderer, this.camera);");
}

if (!renderer.includes('_initBlackHoleAudio')) {
  const audioFunc = `
  _initBlackHoleAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    this.audioCtx = new AudioContext();
    this.bhOsc = this.audioCtx.createOscillator();
    this.bhOsc.type = 'sawtooth';
    this.bhOsc.frequency.value = 40; // Deep rumble
    
    this.bhFilter = this.audioCtx.createBiquadFilter();
    this.bhFilter.type = 'lowpass';
    this.bhFilter.frequency.value = 100;
    
    this.bhGain = this.audioCtx.createGain();
    this.bhGain.gain.value = 0;
    
    this.bhOsc.connect(this.bhFilter);
    this.bhFilter.connect(this.bhGain);
    this.bhGain.connect(this.audioCtx.destination);
    
    this.bhOsc.start();
    
    this.bhAudio = {
      setPlaybackRate: (rate) => {
        this.bhOsc.frequency.setTargetAtTime(40 * rate, this.audioCtx.currentTime, 0.1);
        this.bhFilter.frequency.setTargetAtTime(100 * rate, this.audioCtx.currentTime, 0.1);
      },
      setVolume: (vol) => {
        this.bhGain.gain.setTargetAtTime(vol * 0.5, this.audioCtx.currentTime, 0.1);
      },
      getVolume: () => this.bhGain.gain.value
    };
  }
`;
  renderer = renderer.replace('animate() {', audioFunc + '\n  animate() {');
}

// Update loop logic
const updateLogic = `
    // --- BLACK HOLE LOGIC ---
    let timeScale = 1.0;
    if (this.blackHole) {
      this.blackHole.update(delta);
      
      if (this.lensingPass) {
        const bhPos = this.blackHole.group.position.clone();
        const distanceToBh = this.camera.position.distanceTo(bhPos);
        
        bhPos.project(this.camera);
        const screenX = (bhPos.x + 1) / 2;
        const screenY = (bhPos.y + 1) / 2;
        
        this.lensingPass.uniforms.bhScreenPos.value.set(screenX, screenY);
        this.lensingPass.uniforms.aspectRatio.value = window.innerWidth / window.innerHeight;
        
        const fov = this.camera.fov * (Math.PI / 180);
        const projectedRadius = (this.blackHole.radius / (distanceToBh * Math.tan(fov / 2))) / 2.0;
        this.lensingPass.uniforms.bhRadius.value = projectedRadius;
        
        let danger = 0.0;
        if (distanceToBh < 2000) {
          danger = Math.pow((2000 - distanceToBh) / 1900, 2.0); // 0 at 2000, 1 at 100
        }
        
        if (bhPos.z < 1.0 && danger > 0.0) {
          this.lensingPass.uniforms.distortionStrength.value = danger;
          this.lensingPass.uniforms.chromaticAberration.value = danger * 2.0;
          
          timeScale = Math.max(0.01, 1.0 - danger * 0.9);
          
          if (this.controls) {
             this.controls.target.lerp(this.blackHole.group.position, danger * 0.02);
             this.camera.position.lerp(this.blackHole.group.position, danger * 0.005); // Drifting
             if (danger > 0.1) {
               this.camera.position.x += (Math.random() - 0.5) * danger * 2.0;
               this.camera.position.y += (Math.random() - 0.5) * danger * 2.0;
             }
          }
          
          if (this.bhAudio) {
             this.bhAudio.setPlaybackRate(timeScale);
             this.bhAudio.setVolume(Math.min(1.0, danger * 2.0));
          }
          
          if (distanceToBh < this.blackHole.radius * 1.1) {
              document.getElementById('blackhole-death').style.opacity = '1';
          } else {
              document.getElementById('blackhole-death').style.opacity = '0';
          }
        } else {
          this.lensingPass.uniforms.distortionStrength.value = 0.0;
          if (this.bhAudio) this.bhAudio.setVolume(0);
        }
      }
    }
    delta *= timeScale; // Apply time dilation to everything else
`;

if (!renderer.includes('// --- BLACK HOLE LOGIC ---')) {
  renderer = renderer.replace('this.controls.update();', 'this.controls.update();\n' + updateLogic);
}

fs.writeFileSync('src/StarRenderer.js', renderer);
