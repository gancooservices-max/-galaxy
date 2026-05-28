const fs = require('fs');
let content = fs.readFileSync('src/MissionSimulator.js', 'utf8');

const textureHelpers = `
function createRocketTexture(type) {
  if (!window._rocketTex) window._rocketTex = {};
  if (window._rocketTex[type]) return window._rocketTex[type];

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  if (type === 'core') {
    ctx.fillStyle = '#b35d39';
    ctx.fillRect(0, 0, 256, 512);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 100, 256, 40);
    ctx.fillRect(0, 380, 256, 40);
  } else if (type === 'booster') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 512);
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 40, 256, 40);
    ctx.fillRect(0, 420, 256, 40);
    ctx.fillStyle = '#FF9933'; ctx.fillRect(100, 220, 56, 15);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(100, 235, 56, 15);
    ctx.fillStyle = '#138808'; ctx.fillRect(100, 250, 56, 15);
    ctx.fillStyle = '#000080';
    ctx.beginPath(); ctx.arc(128, 242.5, 6, 0, Math.PI*2); ctx.fill();
  } else if (type === 'upper') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 512);
    ctx.fillStyle = '#FF9933'; ctx.fillRect(100, 300, 56, 15);
    ctx.fillStyle = '#138808'; ctx.fillRect(100, 340, 56, 15);
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  window._rocketTex[type] = tex;
  return tex;
}

function createExhaustTexture() {
  if (window._exhaustTex) return window._exhaustTex;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 256, 0, 0); // Bottom to top of canvas
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // Base (attached to nozzle)
  gradient.addColorStop(0.2, 'rgba(255, 255, 100, 0.9)');
  gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.7)');
  gradient.addColorStop(0.8, 'rgba(100, 10, 0, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Tip
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 256);
  
  const tex = new THREE.CanvasTexture(canvas);
  window._exhaustTex = tex;
  return tex;
}
`;

if (!content.includes('createRocketTexture')) {
  content = content.replace('export class MissionSimulator {', textureHelpers + '\nexport class MissionSimulator {');
}

// Ensure plumes array exists
if (!content.includes('this.plumes = [];')) {
  content = content.replace('this.particles = [];', 'this.particles = [];\n    this.plumes = [];');
}

// Replace Rocket Materials
content = content.replace(/const coreMat = [^;]+;/, 'const coreMat = new THREE.MeshStandardMaterial({ map: createRocketTexture("core"), roughness: 0.6 });');
content = content.replace(/const boosterMat = [^;]+;/, 'const boosterMat = new THREE.MeshStandardMaterial({ map: createRocketTexture("booster"), roughness: 0.5 });');
content = content.replace(/const upperMat = [^;]+;/, 'const upperMat = new THREE.MeshStandardMaterial({ map: createRocketTexture("upper"), roughness: 0.5 });');

// Inject Exhaust Plume logic into nozzle loops
const exhaustMatCode = `
    const exhaustMat = new THREE.MeshBasicMaterial({
      map: createExhaustTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
`;

if (!content.includes('const exhaustMat =')) {
  content = content.replace('// Twin Core Engine Nozzles (Vikas engines)', exhaustMatCode + '\n    // Twin Core Engine Nozzles (Vikas engines)');
}

// Attach plumes to Core nozzles
const coreNozzleRegex = /const nozzle = new THREE\.Mesh\(new THREE\.ConeGeometry\(0\.015, 0\.04, 16, 1, true\), darkMat\);\s*nozzle\.position\.set\(i===0\? 0\.015 : -0\.015, -0\.02, 0\);\s*nozzle\.rotation\.x = Math\.PI;\s*core\.add\(nozzle\);/g;
const coreNozzleRepl = `const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 16, 1, true), darkMat);
      nozzle.position.set(i===0? 0.015 : -0.015, -0.02, 0);
      nozzle.rotation.x = Math.PI;
      
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.25, 16, 1, true), exhaustMat);
      plume.position.y = 0.125; // Shift so base is at nozzle (y=0)
      plume.visible = false;
      nozzle.add(plume);
      this.plumes.push(plume);
      
      core.add(nozzle);`;
content = content.replace(coreNozzleRegex, coreNozzleRepl);

// Attach plumes to Side Booster nozzles
const boosterNozzleRegex = /const bNozzle = new THREE\.Mesh\(new THREE\.ConeGeometry\(0\.025, 0\.06, 16, 1, true\), darkMat\);\s*bNozzle\.position\.y = -0\.03;\s*bNozzle\.rotation\.x = Math\.PI;\s*bCore\.add\(bNozzle\);/g;
const boosterNozzleRepl = `const bNozzle = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 16, 1, true), darkMat);
      bNozzle.position.y = -0.03;
      bNozzle.rotation.x = Math.PI;
      
      const bPlume = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.5, 16, 1, true), exhaustMat);
      bPlume.position.y = 0.25;
      bPlume.visible = false;
      bNozzle.add(bPlume);
      this.plumes.push(bPlume);
      
      bCore.add(bNozzle);`;
content = content.replace(boosterNozzleRegex, boosterNozzleRepl);

// Remove Fire Particles from Update Loop and Animate Plumes instead
const updatePlumes = `
    // Animate Exhaust Plumes
    if (this.stage >= 1 && this.plumes) {
      this.plumes.forEach(p => {
        p.visible = true;
        // Rapid chaotic flickering
        p.scale.x = 0.8 + Math.random() * 0.4;
        p.scale.z = p.scale.x;
        p.scale.y = 0.9 + Math.random() * 0.3;
        p.material.opacity = 0.8 + Math.random() * 0.2;
      });
    } else if (this.plumes) {
      this.plumes.forEach(p => p.visible = false);
    }
`;
if (!content.includes('// Animate Exhaust Plumes')) {
  content = content.replace('const oldRocketPos = new THREE.Vector3();', updatePlumes + '\n    const oldRocketPos = new THREE.Vector3();');
}

// Remove the particle spawning for fire (isSmoke == false) in Stage 1 and 2
content = content.replace(/spawnEngineExhaust\(.*?false\);\s*/g, '');

fs.writeFileSync('src/MissionSimulator.js', content);
