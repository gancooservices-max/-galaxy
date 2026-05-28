const fs = require('fs');
let content = fs.readFileSync('src/MissionSimulator.js', 'utf8');

// 1. Add createGlowTexture helper outside class or as a static/instance method
if (!content.includes('createGlowTexture')) {
  const textureCode = `
function createGlowTexture() {
  if (window._glowTex) return window._glowTex;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  window._glowTex = tex;
  return tex;
}
`;
  content = content.replace('export class MissionSimulator {', textureCode + '\nexport class MissionSimulator {');
}

// 2. Update _spawnParticles to use Sprites
const oldSpawn = `  _spawnParticles(pos, dir, isSmoke, isVenting = false) {
    const SCALE = 0.02;
    
    // Realistic flame colors: bright yellow/white core
    let color = isSmoke ? 0xaaaaaa : (Math.random() > 0.4 ? 0xffaa00 : 0xffffff);
    if (isVenting) color = 0xdddddd; // White steam
    
    const geo = new THREE.SphereGeometry((isVenting ? 0.02 : (isSmoke ? 0.05 : 0.02)) * SCALE, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ 
      color: color,
      transparent: true,
      opacity: isSmoke ? (isVenting ? 0.3 : 0.4) : 0.9,
      depthWrite: false,
      blending: isSmoke ? THREE.NormalBlending : THREE.AdditiveBlending // Additive makes fire glow!
    });
    const mesh = new THREE.Mesh(geo, mat);
    
    // Slight random offset scaled down
    mesh.position.copy(pos).add(new THREE.Vector3(
      (Math.random()-0.5)*0.02 * SCALE, 
      (Math.random()-0.5)*0.02 * SCALE, 
      (Math.random()-0.5)*0.02 * SCALE
    ));
    
    this.renderer.scene.add(mesh);

    // Random velocity pushing backwards scaled down
    const speedMultiplier = isVenting ? 0.15 : (isSmoke ? 0.3 : 0.8);
    const vel = dir.clone().multiplyScalar(speedMultiplier * SCALE);
    
    // Add turbulence
    vel.x += (Math.random()-0.5)*0.1 * SCALE;
    vel.y += (Math.random()-0.5)*0.1 * SCALE;
    vel.z += (Math.random()-0.5)*0.1 * SCALE;

    this.particles.push({
      mesh, vel, life: 1.0, isSmoke, isVenting
    });
  }`;

const newSpawn = `  _spawnParticles(pos, dir, isSmoke, isVenting = false) {
    const SCALE = 0.02;
    
    let color = isSmoke ? 0x999999 : (Math.random() > 0.4 ? 0xff8800 : 0xffffff);
    if (isVenting) color = 0xcccccc;
    
    const mat = new THREE.SpriteMaterial({ 
      map: createGlowTexture(),
      color: color,
      transparent: true,
      opacity: isSmoke ? (isVenting ? 0.3 : 0.5) : 1.0,
      depthWrite: false,
      blending: isSmoke ? THREE.NormalBlending : THREE.AdditiveBlending
    });
    const mesh = new THREE.Sprite(mat);
    
    const baseSize = (isVenting ? 0.04 : (isSmoke ? 0.08 : 0.03)) * SCALE;
    mesh.scale.set(baseSize, baseSize, baseSize);
    
    mesh.position.copy(pos).add(new THREE.Vector3(
      (Math.random()-0.5)*0.01 * SCALE, 
      (Math.random()-0.5)*0.01 * SCALE, 
      (Math.random()-0.5)*0.01 * SCALE
    ));
    
    this.renderer.scene.add(mesh);

    const speedMultiplier = isVenting ? 0.15 : (isSmoke ? 0.2 : 0.8);
    const vel = dir.clone().multiplyScalar(speedMultiplier * SCALE);
    
    vel.x += (Math.random()-0.5)*0.05 * SCALE;
    vel.y += (Math.random()-0.5)*0.05 * SCALE;
    vel.z += (Math.random()-0.5)*0.05 * SCALE;

    this.particles.push({
      mesh, vel, life: 1.0, isSmoke, isVenting, baseSize
    });
  }`;

content = content.replace(oldSpawn, newSpawn);

// 3. Update _updateParticles for Sprite logic (removing geometry.dispose)
content = content.replace('p.mesh.geometry.dispose();', '');
content = content.replace('p.mesh.scale.addScalar(delta * 2.0);', 'const s = p.baseSize + (1.0 - p.life) * p.baseSize * 4.0;\np.mesh.scale.set(s,s,s);');
content = content.replace(/if \(p\.life > 0\.8\) \{[\s\S]*?if \(p\.mesh\.scale\.x < 0\)/, `const s = p.baseSize * (p.life > 0.8 ? (1.0 + (1.0-p.life)*10.0) : (p.life * 2.0));\np.mesh.scale.set(s,s,s);\nif (p.mesh.scale.x < 0)`);

fs.writeFileSync('src/MissionSimulator.js', content);
