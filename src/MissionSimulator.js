import * as THREE from 'three';


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

export class MissionSimulator {
  constructor(renderer) {
    this.renderer = renderer;
    this.active = false;
    this.stage = 0; // 0: Idle, 1: Launch Pad, 2: Ascent, 3: Transfer, 4: Moon Orbit
    this.timeInStage = 0.0;

    // 3D Objects
    this.rocket = null;
    this.boosters = []; // Keep track for separation
    this.particles = [];
    this.plumes = [];
    this.scaffold = null;

    // DOM UI
    this.overlayEl = null;
    this.styleEl = null;

    this.earthRadius = 4.0;
    this.launchDir = new THREE.Vector3(0, 1, 0);
  }

  toggle() {
    if (this.active) this.exit();
    else this.enter();
    return this.active;
  }

  enter() {
    this.active = true;
    this.stage = 0; // 0: Idle
    this.timeInStage = 0.0;
    this.particles = [];
    this.boosters = [];

    const elementsToHide = ['app-header', 'bottom-controls', 'nav-hint', 'time-controller', 'selection-reticle'];
    elementsToHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // Disable StarRenderer planet tracking so it doesn't fight our cinematic camera
    this.prevTrackedPlanet = this.renderer._trackedPlanet;
    this.renderer._trackedPlanet = null;

    this._buildMissionScene();
    this._injectUI();
  }

  exit() {
    this.active = false;
    this.stage = 0;

    const elementsToRestore = ['app-header', 'bottom-controls', 'nav-hint', 'time-controller', 'selection-reticle'];
    elementsToRestore.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = '';
    });

    this._clearMissionScene();

    if (this.overlayEl && this.overlayEl.parentNode) {
      this.overlayEl.parentNode.removeChild(this.overlayEl);
    }
    if (this.styleEl && this.styleEl.parentNode) {
      this.styleEl.parentNode.removeChild(this.styleEl);
    }
    this.overlayEl = null;
    this.styleEl = null;

    // Restore StarRenderer planet tracking
    if (this.prevTrackedPlanet !== undefined) {
      this.renderer._trackedPlanet = this.prevTrackedPlanet;
    }

    if (this.renderer.controls) {
      this.renderer.controls.enablePan = true;
      this.renderer.controls.enableZoom = true;
      this.renderer.controls.autoRotate = false;
      this.renderer.controls.minDistance = 0.5;
      this.renderer.controls.maxDistance = 5000000;
      this.renderer.camera.fov = 70; // Restore standard FOV
      this.renderer.camera.updateProjectionMatrix();
    }
  }

  _buildMissionScene() {
    if (!this.renderer.earth) return;
    const earthPos = this.renderer.earth.position;

    // Sriharikota Lat 13.7N, Lon 80.2E
    // Three.js texture puts Greenwich at +X, so we map lon=0 to +X, and East to -Z
    const lat = 13.7 * (Math.PI / 180);
    const lon = 80.2 * (Math.PI / 180);
    this.launchDir.set(
      Math.cos(lat) * Math.cos(lon),
      Math.sin(lat),
      -Math.cos(lat) * Math.sin(lon)
    ).normalize();

    this.rocket = new THREE.Group();
    
    // Materials
    const coreMat = new THREE.MeshStandardMaterial({ map: createRocketTexture("core"), roughness: 0.6 }); // L110 Liquid Core (Greyish)
    const boosterMat = new THREE.MeshStandardMaterial({ map: createRocketTexture("booster"), roughness: 0.5 }); // S200 Solid Boosters (White)
    const upperMat = new THREE.MeshStandardMaterial({ map: createRocketTexture("upper"), roughness: 0.5 }); // C25 Upper Stage & Fairing
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.3 }); // Engine Nozzles / Interstage

    // Core Stage (L110)
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 32), coreMat);
    core.position.y = 0.2;
    this.rocket.add(core);

    
    const exhaustMat = new THREE.MeshBasicMaterial({
      map: createExhaustTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    // Twin Core Engine Nozzles (Vikas engines)
    for(let i=0; i<2; i++) {
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 16, 1, true), darkMat);
      nozzle.position.set(i===0? 0.015 : -0.015, -0.02, 0);
      nozzle.rotation.x = Math.PI;
      
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.25, 16, 1, true), exhaustMat);
      plume.position.y = 0.125; // Shift so base is at nozzle (y=0)
      plume.visible = false;
      nozzle.add(plume);
      this.plumes.push(plume);
      
      core.add(nozzle);
    }

    // Upper Stage (C25 Cryogenic)
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.25, 32), upperMat);
    upper.position.y = 0.525;
    this.rocket.add(upper);

    // Payload Fairing (Nose Cone - Bulged)
    const fairingBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.08, 32), upperMat);
    fairingBottom.position.y = 0.69;
    this.rocket.add(fairingBottom);
    
    const fairingTop = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 32), upperMat);
    fairingTop.position.y = 0.82;
    this.rocket.add(fairingTop);

    // Side Boosters (S200 Solid Motors - Large & White)
    for(let i=0; i<2; i++) {
      const booster = new THREE.Group();
      
      const bCore = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.6, 24), boosterMat);
      bCore.position.y = 0.3;
      booster.add(bCore);
      
      const bNose = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.1, 24), boosterMat);
      bNose.position.y = 0.65;
      booster.add(bNose);

      const bNozzle = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 16, 1, true), darkMat);
      bNozzle.position.y = -0.03;
      bNozzle.rotation.x = Math.PI;
      
      const bPlume = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.5, 16, 1, true), exhaustMat);
      bPlume.position.y = 0.25;
      bPlume.visible = false;
      bNozzle.add(bPlume);
      this.plumes.push(bPlume);
      
      bCore.add(bNozzle);
      
      booster.position.x = i === 0 ? 0.075 : -0.075;
      booster.position.y = 0.02; // S200 boosters sit lower
      this.rocket.add(booster);
      this.boosters.push(booster);
    }

    // Tiny size to make Earth look massive
    const SCALE = 0.02;
    this.rocket.scale.set(SCALE, SCALE, SCALE);

    // Position rocket relative to Earth center (0,0,0)
    // Add tiny offset so it sits on the ground
    this.rocket.position.copy(this.launchDir).multiplyScalar(this.earthRadius + (0.01 * SCALE));
    this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.launchDir);
    
    // Add realistic Engine Glow Light (Bright orange/white)
    // this.engineLight = new THREE.PointLight(0xffaa00, 0, 3 * SCALE);
    // this.engineLight.position.y = -0.1 * SCALE;
    

    this.renderer.earth.add(this.rocket); // Attach to Earth so it rotates with it

    // Realistic ISRO Launch Pad (SDSC SHAR)
    this.scaffold = new THREE.Group();
    
    // Main Concrete Base Platform (Larger)
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.05, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 1.0 })
    );
    pad.position.y = 0.025;
    this.scaffold.add(pad);

    // Flame Trench (V-shape under rocket)
    const trenchMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1.0 });
    const trenchLeft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.4), trenchMat);
    trenchLeft.position.set(-0.3, 0.05, 0);
    trenchLeft.rotation.z = Math.PI / 8; // Tilted down towards center
    this.scaffold.add(trenchLeft);
    
    const trenchRight = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.4), trenchMat);
    trenchRight.position.set(0.3, 0.05, 0);
    trenchRight.rotation.z = -Math.PI / 8;
    this.scaffold.add(trenchRight);

    // Mobile Launch Pedestal (MLP)
    const mlp = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.08, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 })
    );
    mlp.position.y = 0.09;
    this.scaffold.add(mlp);

    // Main Umbilical Tower (Red Truss Structure)
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x883333, metalness: 0.6, wireframe: true });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.12), towerMat);
    tower.position.set(0.2, 0.59, 0);
    this.scaffold.add(tower);

    // Solid core inside tower (Elevator/Systems)
    const tCore = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.06), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
    tCore.position.set(0.2, 0.59, 0);
    this.scaffold.add(tCore);

    // Umbilical Arms (Connecting tower to rocket)
    for(let i=0; i<4; i++) {
       const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.02), towerMat);
       arm.position.set(0.12, 0.3 + (i*0.2), 0);
       this.scaffold.add(arm);
    }

    // Lightning Arrestor Towers
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
    for(let i=0; i<4; i++) { // 4 poles instead of 2 for realism
       const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.5, 8), poleMat);
       // Position them at 4 corners
       const px = (i % 2 === 0) ? 0.35 : -0.35;
       const pz = (i < 2) ? 0.35 : -0.35;
       pole.position.set(px, 0.84, pz);
       this.scaffold.add(pole);
    }
    
    // Fuel Storage Spheres
    const fuelTankMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 });
    const loxTank = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), fuelTankMat);
    loxTank.position.set(-0.5, 0.24, 0.4);
    this.scaffold.add(loxTank);
    
    const lh2Tank = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), fuelTankMat);
    lh2Tank.position.set(-0.5, 0.24, -0.4);
    this.scaffold.add(lh2Tank);

    this.scaffold.scale.set(SCALE, SCALE, SCALE);

    this.scaffold.position.copy(this.rocket.position);
    this.scaffold.quaternion.copy(this.rocket.quaternion);
    this.renderer.earth.add(this.scaffold);

    // Force matrix update so getWorldPosition returns correct values immediately
    this.renderer.earth.updateMatrixWorld(true);

    // Setup Camera Tracking
    if (this.renderer.controls) {
      const worldPos = new THREE.Vector3();
      this.rocket.getWorldPosition(worldPos);
      
      const worldDir = this.launchDir.clone().applyQuaternion(this.renderer.earth.quaternion);
      
      // Focus exactly on the middle of the rocket body instead of the base
      const targetPos = worldPos.clone().add(worldDir.clone().multiplyScalar(0.4 * SCALE));
      
      this.renderer.controls.target.copy(targetPos);
      this.renderer.controls.enableZoom = true;
      this.renderer.controls.zoomSpeed = 5.0; // Make scroll zoom much faster
      this.renderer.controls.enablePan = false; // Completely lock focus on rocket
      this.renderer.controls.minDistance = 0.001; // Allow very close zoom
      this.renderer.controls.maxDistance = 50;

      this.renderer.controls.autoRotate = false; // Start WITHOUT rotation (will enable on launch)
      this.renderer.controls.autoRotateSpeed = 1.0;
      
      // Calculate a comfortable offset
      const worldOffset = worldDir.clone().multiplyScalar(1.2 * SCALE).add(
        new THREE.Vector3(1.5 * SCALE, 0.6 * SCALE, 1.5 * SCALE).applyQuaternion(this.renderer.earth.quaternion)
      );
      
      this.renderer.camera.position.copy(targetPos).add(worldOffset);
      this.renderer.controls.update();
    }
  }

  _clearMissionScene() {
    if (this.rocket && this.rocket.parent) this.rocket.parent.remove(this.rocket);
    if (this.scaffold && this.scaffold.parent) this.scaffold.parent.remove(this.scaffold);
    this.particles.forEach(p => this.renderer.scene.remove(p.mesh));
    
    if (false) {
      
    }

    this.rocket = null;
    this.scaffold = null;
    this.particles = [];
  }

  _injectUI() {
    this.styleEl = document.createElement('style');
    this.styleEl.innerHTML = `
      .isro-hud {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        background: rgba(8, 12, 18, 0.85);
        border: 1px solid rgba(0, 212, 255, 0.3);
        border-radius: 8px;
        padding: 16px;
        color: white;
        font-family: 'Inter', sans-serif;
        z-index: 10000;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }
      .hud-title {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #00d4ff;
        margin: 0 0 12px 0;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 8px;
      }
      .hud-dot {
        width: 8px; height: 8px;
        background: #00ff66;
        border-radius: 50%;
        box-shadow: 0 0 8px #00ff66;
        animation: blink 1s infinite alternate;
      }
      @keyframes blink { from {opacity: 0.4;} to {opacity: 1;} }
      .data-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 15px;
      }
      .data-box {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.05);
        padding: 8px;
        border-radius: 4px;
      }
      .data-lbl {
        font-size: 10px;
        color: rgba(255,255,255,0.5);
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .data-val {
        font-family: monospace;
        font-size: 16px;
        font-weight: bold;
        color: #00ffaa;
      }
      .status-text {
        font-size: 12px;
        color: #fff;
        background: rgba(0,212,255,0.1);
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 15px;
        text-align: center;
        font-weight: 500;
      }
      .btn-row {
        display: flex;
        justify-content: space-between;
      }
      .hud-btn {
        padding: 8px 16px;
        background: #e65c00;
        border: 1px solid #ff7a24;
        color: white;
        cursor: pointer;
        border-radius: 4px;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 11px;
        transition: 0.2s;
      }
      .hud-btn:hover { background: #ff6a00; transform: translateY(-1px); }
      .hud-btn.abort { background: rgba(255,0,0,0.2); border-color: rgba(255,0,0,0.5); }
      .hud-btn.abort:hover { background: rgba(255,0,0,0.4); }
    `;
    document.head.appendChild(this.styleEl);

    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'isro-hud';
    this.overlayEl.innerHTML = `
      <h3 class="hud-title"><div class="hud-dot"></div> ISRO Telemetry</h3>
      
      <div class="data-grid">
        <div class="data-box">
          <div class="data-lbl">Velocity</div>
          <div class="data-val" id="tel-vel">0.00 km/s</div>
        </div>
        <div class="data-box">
          <div class="data-lbl">Altitude</div>
          <div class="data-val" id="tel-alt">0.0 km</div>
        </div>
      </div>
      
      <div class="status-text" id="mission-status">Pre-launch Systems Nominal</div>
      
      <div class="btn-row">
        <button class="hud-btn abort" id="hud-btn-close">Abort</button>
        <button class="hud-btn" id="hud-btn-action">Ignite Engine</button>
      </div>
    `;
    document.body.appendChild(this.overlayEl);

    document.getElementById('hud-btn-close').addEventListener('click', () => {
      const btn = document.getElementById('btn-mission');
      if (btn) btn.click();
      else this.exit();
    });
    
    document.getElementById('hud-btn-action').addEventListener('click', () => this._handleNextAction());
  }

  _handleNextAction() {
    const btn = document.getElementById('hud-btn-action');
    const status = document.getElementById('mission-status');

    if (this.stage === 0) {
      this.stage = 1;
      this.timeInStage = 0.0;
      if (btn) btn.style.display = 'none'; // Hide button during countdown
      if (status) status.textContent = 'Ignition Sequence Start... T-Minus 3';
    } else if (this.stage === 2) {
      this.stage = 3;
      btn.textContent = 'Lunar Capture';
      status.textContent = 'Trans-Lunar Injection Burn...';
    } else if (this.stage === 3) {
      this.stage = 4;
      btn.textContent = 'End Mission';
      status.textContent = 'Lunar Orbit Insertion Success';
    } else if (this.stage === 4) {
      const b = document.getElementById('btn-mission');
      if (b) b.click();
      else this.exit();
    }
  }

  _spawnParticles(pos, dir, isSmoke, isVenting = false) {
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
  }

  _updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta * (p.isVenting ? 0.6 : (p.isSmoke ? 0.5 : 2.0));
      
      if (p.life <= 0) {
        this.renderer.scene.remove(p.mesh);
        
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.vel, delta);
      
      if (p.isSmoke || p.isVenting) {
        const s = p.baseSize + (1.0 - p.life) * p.baseSize * 4.0;
p.mesh.scale.set(s,s,s);
        p.mesh.material.opacity = (p.isVenting ? 0.3 : 0.4) * p.life;
      } else {
        // Realistic fire physics: rapidly expands then shrinks to form mach diamonds
        const s = p.baseSize * (p.life > 0.8 ? (1.0 + (1.0-p.life)*10.0) : (p.life * 2.0));
p.mesh.scale.set(s,s,s);
if (p.mesh.scale.x < 0) p.mesh.scale.set(0,0,0);
        
        // Colors from blinding white core -> intense yellow -> orange -> fading red
        if (p.life > 0.7) p.mesh.material.color.lerp(new THREE.Color(0xffffff), delta * 5.0);
        else if (p.life > 0.4) p.mesh.material.color.lerp(new THREE.Color(0xffaa00), delta * 8.0);
        else p.mesh.material.color.lerp(new THREE.Color(0xff2200), delta * 6.0);
        
        p.mesh.material.opacity = p.life;
      }
    }
  }

  update(delta) {
    this.timeInStage += delta;
    this._updateParticles(delta);

    const moonEntry = this.renderer.planetMeshes ? this.renderer.planetMeshes.find(pm => pm.data.id === 'Moon') : null;
    if (!this.renderer.earth || !moonEntry || !this.rocket) return;

    // Only rotate Earth during and after launch to keep camera perfectly stable before launch
    if (this.stage >= 2) {
      this.renderer.earth.rotation.y += delta * 0.02;
    }
    this.renderer.earth.updateMatrixWorld(true);

    const earthPos = this.renderer.earth.position;
    const moonPos = moonEntry.mesh.position;
    
    
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

    const oldRocketPos = new THREE.Vector3();
    this.rocket.getWorldPosition(oldRocketPos);

    let velocity = 0;
    let altitude = 0;

    if (this.stage === 1) {
      const timeLeft = 3.0 - this.timeInStage;
      const status = document.getElementById('mission-status');
      if (status && timeLeft > 0) {
        status.textContent = `Ignition Sequence Start... T-Minus ${Math.ceil(timeLeft)}`;
      }

      // Spawning heavy smoke during ignition
      const SCALE = 0.02;
      const ventPos = this.rocket.position.clone().addScaledVector(this.launchDir, 0.1 * SCALE);
      this.rocket.parent.localToWorld(ventPos);
      const worldDir = this.launchDir.clone().applyQuaternion(this.renderer.earth.quaternion);
      
      // Heavy steam venting from sides
      if (Math.random() < 0.9) {
        const driftDir = new THREE.Vector3(worldDir.z, 0, -worldDir.x).normalize();
        driftDir.add(worldDir.clone().multiplyScalar(0.2)).normalize();
        this._spawnParticles(ventPos, driftDir, true, true);
      }
      if (Math.random() < 0.9) {
        const driftDir2 = new THREE.Vector3(-worldDir.z, 0, worldDir.x).normalize();
        driftDir2.add(worldDir.clone().multiplyScalar(0.2)).normalize();
        this._spawnParticles(ventPos, driftDir2, true, true);
      }
      
      // Heavy dark exhaust smoke from all 3 engines
      const spawnEngineExhaust = (localOffset, isSmoke) => {
         const localPos = localOffset.clone();
         localPos.applyQuaternion(this.rocket.quaternion);
         const worldPos = this.rocket.position.clone().add(localPos).addScaledVector(this.launchDir, -0.05 * SCALE);
         this.rocket.parent.localToWorld(worldPos);
         this._spawnParticles(worldPos, worldDir.clone().negate(), isSmoke, false);
      };
      
      const coreLocal = new THREE.Vector3(0, 0, 0);
      const leftLocal = new THREE.Vector3(0.075 * SCALE, 0.02 * SCALE, 0);
      const rightLocal = new THREE.Vector3(-0.075 * SCALE, 0.02 * SCALE, 0);
      
      // Core (L110)
      spawnEngineExhaust(coreLocal, true);
      // Side Boosters (S200) - Huge exhaust!
      spawnEngineExhaust(leftLocal, true);
      // Extra fire
      
      spawnEngineExhaust(rightLocal, true);
      // Extra fire
      
      

      // Transition to Stage 2 automatically after 3 seconds
      if (this.timeInStage >= 3.0) {
        this.stage = 2;
        this.timeInStage = 0.0;
        const btn = document.getElementById('hud-btn-action');
        if (btn) {
           btn.style.display = 'inline-block';
           btn.textContent = 'Transfer Orbit';
        }
        if (status) status.textContent = 'Liftoff! S200 Boosters Ignited';
      }
    }

    if (this.stage === 2) {
      if (!this.renderer.controls.autoRotate) {
        this.renderer.controls.autoRotate = true;
      }
      
      velocity = Math.min(this.timeInStage * 1.5, 7.8);
      
      const SCALE = 0.02;
      const moveDelta = (velocity * delta * 0.1 * SCALE);
      this.rocket.position.addScaledVector(this.launchDir, moveDelta);
      
      altitude = (this.rocket.position.length() - this.earthRadius) / SCALE;

      const worldDir = this.launchDir.clone().applyQuaternion(this.renderer.earth.quaternion);
      
      const spawnEngineExhaust = (localOffset, isSmoke) => {
         const localPos = localOffset.clone();
         localPos.applyQuaternion(this.rocket.quaternion);
         const worldPos = this.rocket.position.clone().add(localPos).addScaledVector(this.launchDir, -0.05 * SCALE);
         this.rocket.parent.localToWorld(worldPos);
         this._spawnParticles(worldPos, worldDir.clone().negate(), isSmoke, false);
      };
      
      const coreLocal = new THREE.Vector3(0, 0, 0);
      const leftLocal = new THREE.Vector3(0.075 * SCALE, 0.02 * SCALE, 0);
      const rightLocal = new THREE.Vector3(-0.075 * SCALE, 0.02 * SCALE, 0);

      // Core (L110)
      // Side Boosters (S200) - Huge exhaust!
      if (this.timeInStage < 5.0) {
        spawnEngineExhaust(coreLocal, true);
        spawnEngineExhaust(leftLocal, true);
        spawnEngineExhaust(rightLocal, true);
      }
      
      
    } else if (this.stage === 3) {
      if (this.rocket.parent === this.renderer.earth) {
        // Detach rocket from rotating Earth to freely transfer in world space
        this.renderer.scene.attach(this.rocket);
      }

      // Separate boosters physically if they exist
      if (this.boosters.length > 0) {
        this.boosters.forEach((b, idx) => {
          this.rocket.remove(b);
          this.renderer.scene.add(b);
          b.getWorldPosition(b.position);
          b.userData.vel = new THREE.Vector3(idx === 0 ? 0.2 : -0.2, -0.5, 0).applyQuaternion(this.rocket.quaternion);
        });
        this.boosters = [];
        document.getElementById('mission-status').textContent = 'Booster Separation Confirmed';
      }

      velocity = 10.5;
      const SCALE = 0.02;
      const dir = new THREE.Vector3().subVectors(moonPos, this.rocket.position).normalize();
      this.rocket.position.addScaledVector(dir, velocity * delta * 0.1 * SCALE);
      
      // In stage 3, rocket is in world space, so we compute distance to Earth world pos
      altitude = (this.rocket.position.distanceTo(earthPos) - this.earthRadius) / SCALE;
      
      // Rotate rocket towards velocity direction
      this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      // Deep space thruster
      const exhaustPos = this.rocket.position.clone().addScaledVector(dir, -0.25 * SCALE);
      this._spawnParticles(exhaustPos, dir.clone().negate(), false);
    } else if (this.stage === 4) {
      velocity = 1.6;
      altitude = 1.0;
      
      // Orbit Moon
      this.rocket.position.copy(moonPos);
      this.rocket.position.addScaledVector(new THREE.Vector3(1, 0, 0), 4.5);
      
      const speed = delta * 0.5;
      const angle = this.timeInStage * speed;
      const rx = Math.cos(angle) * 4.5;
      const rz = Math.sin(angle) * 4.5;
      
      this.rocket.position.set(moonPos.x + rx, moonPos.y, moonPos.z + rz);
      
      const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
      this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    }

    // Force matrix update to compute correct new world position
    this.renderer.earth.updateMatrixWorld(true);

    // Apply camera tracking perfectly synced with rocket world movement
    const newRocketPos = new THREE.Vector3();
    this.rocket.getWorldPosition(newRocketPos);
    const posDiff = newRocketPos.clone().sub(oldRocketPos);
    
    if (this.active && this.renderer.controls) {
      const SCALE = 0.02;
      let upDir = this.launchDir.clone().applyQuaternion(this.renderer.earth.quaternion);
      if (this.stage >= 3) {
        upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(this.rocket.quaternion);
      }
      
      // Keep tracking the center of the rocket
      const centerTarget = newRocketPos.clone().add(upDir.multiplyScalar(0.4 * SCALE));
      this.renderer.controls.target.copy(centerTarget);
      this.renderer.camera.position.add(posDiff);

      // Add custom W/S key zoom support specifically for the rocket
      if (this.renderer.keys) {
        const dist = this.renderer.camera.position.distanceTo(centerTarget);
        const zoomSpeed = dist * 2.0 * delta; // Scale speed based on distance
        if (this.renderer.keys.w && dist > 0.002) {
          const dir = centerTarget.clone().sub(this.renderer.camera.position).normalize();
          this.renderer.camera.position.add(dir.multiplyScalar(zoomSpeed));
        }
        if (this.renderer.keys.s && dist < 50.0) {
          const dir = this.renderer.camera.position.clone().sub(centerTarget).normalize();
          this.renderer.camera.position.add(dir.multiplyScalar(zoomSpeed));
        }
      }

      this.renderer.controls.update();
    }

    // Update UI text
    if (this.active) {
      const vEl = document.getElementById('tel-vel');
      const aEl = document.getElementById('tel-alt');
      if (vEl) vEl.textContent = velocity.toFixed(2) + ' km/s';
      if (aEl) aEl.textContent = (altitude * 60).toFixed(1) + ' km'; // arbitrary scale for display
    }
  }
}
