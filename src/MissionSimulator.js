import * as THREE from 'three';

// ─── Texture Factories ────────────────────────────────────────────────────────

function createGlowTexture() {
  if (window._glowTex) return window._glowTex;
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(0.2,'rgba(255,255,255,0.8)');
  g.addColorStop(0.5,'rgba(255,255,255,0.2)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,64,64);
  window._glowTex = new THREE.CanvasTexture(canvas);
  return window._glowTex;
}

function createRocketTexture(type) {
  if (!window._rocketTex) window._rocketTex = {};
  if (window._rocketTex[type]) return window._rocketTex[type];
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (type === 'core') {
    ctx.fillStyle = '#f0ede8'; ctx.fillRect(0,0,256,512);
    ctx.fillStyle = '#c84a11'; ctx.fillRect(0,90,256,35); ctx.fillRect(0,360,256,35);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0,200,256,8);
  } else if (type === 'booster') {
    ctx.fillStyle = '#f8f8f8'; ctx.fillRect(0,0,256,512);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0,30,256,28); ctx.fillRect(0,440,256,30);
    const fx=68,fy=195,fw=120,fh=75;
    ctx.fillStyle='#FF9933'; ctx.fillRect(fx,fy,fw,fh/3);
    ctx.fillStyle='#FFFFFF'; ctx.fillRect(fx,fy+fh/3,fw,fh/3);
    ctx.fillStyle='#138808'; ctx.fillRect(fx,fy+2*fh/3,fw,fh/3);
    ctx.fillStyle='#000080';
    ctx.beginPath(); ctx.arc(fx+fw/2,fy+fh/2,11,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#000080'; ctx.lineWidth=1.5;
    for(let s=0;s<24;s++){const a=(s/24)*Math.PI*2;ctx.beginPath();ctx.moveTo(fx+fw/2,fy+fh/2);ctx.lineTo(fx+fw/2+Math.cos(a)*11,fy+fh/2+Math.sin(a)*11);ctx.stroke();}
    ctx.fillStyle='#FFFFFF'; ctx.beginPath(); ctx.arc(fx+fw/2,fy+fh/2,5,0,Math.PI*2); ctx.fill();
  } else if (type === 'upper') {
    ctx.fillStyle='#f5f5f5'; ctx.fillRect(0,0,256,512);
    ctx.fillStyle='#FF9933'; ctx.fillRect(0,280,256,18);
    ctx.fillStyle='#138808'; ctx.fillRect(0,298,256,18);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  window._rocketTex[type] = tex;
  return tex;
}

function createExhaustTexture() {
  if (window._exhaustTex) return window._exhaustTex;
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0,256,0,0);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(0.15,'rgba(255,230,200,0.95)');
  g.addColorStop(0.4,'rgba(255,140,0,0.8)');
  g.addColorStop(0.7,'rgba(180,40,0,0.3)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,64,256);
  window._exhaustTex = new THREE.CanvasTexture(canvas);
  return window._exhaustTex;
}

function createBoosterExhaustTexture() {
  if (window._boosterExhaustTex) return window._boosterExhaustTex;
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0,256,0,0);
  g.addColorStop(0,'rgba(255,255,150,1)');
  g.addColorStop(0.15,'rgba(255,150,0,0.95)');
  g.addColorStop(0.4,'rgba(220,80,0,0.9)');
  g.addColorStop(0.7,'rgba(100,30,0,0.7)');
  g.addColorStop(1,'rgba(50,50,50,0.3)');
  ctx.fillStyle = g; ctx.fillRect(0,0,64,256);
  window._boosterExhaustTex = new THREE.CanvasTexture(canvas);
  return window._boosterExhaustTex;
}

function createCryoExhaustTexture() {
  if (window._cryoExhaustTex) return window._cryoExhaustTex;
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0,256,0,0);
  g.addColorStop(0,'rgba(200,230,255,0.9)');
  g.addColorStop(0.2,'rgba(100,180,255,0.7)');
  g.addColorStop(0.5,'rgba(40,100,255,0.4)');
  g.addColorStop(0.8,'rgba(0,40,150,0.1)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,64,256);
  window._cryoExhaustTex = new THREE.CanvasTexture(canvas);
  return window._cryoExhaustTex;
}

// ─── Mission Stage Definitions ────────────────────────────────────────────────
// Each stage has: id, name, description (Hindi), button text, auto (auto-advance)
const STAGES = [
  { id: 0, name: 'Pre-Launch',        desc: 'सभी सिस्टम नॉमिनल — लॉन्च के लिए तैयार',                                    btn: '🔥 Ignite Engine' },
  { id: 1, name: 'T-10 Countdown',    desc: 'इग्निशन सीक्वेंस शुरू — सभी सिस्टम GO',                                     btn: null,  auto: true },
  { id: 2, name: 'Ascent',            desc: 'LVM3 रॉकेट आकाश की ओर — Chandrayaan-3 Earth से बाहर जा रहा है',            btn: '🌍 Raise Orbit' },
  { id: 3, name: 'Orbit Raising',     desc: 'Earth Parking Orbit — EOR बर्न्स के ज़रिए orbit बड़ा हो रहा है',            btn: '🌙 Trans-Lunar Injection →', auto: true },
  { id: 4, name: 'TLI',               desc: 'Trans-Lunar Injection — Moon की तरफ रवाना! 3.84 लाख km की यात्रा',         btn: '🛸 Moon Orbit Insertion' },
  { id: 5, name: 'Lunar Transfer',    desc: 'Lunar Transfer Trajectory — Moon की gravity पकड़ रही है',                   btn: '🔵 Enter Lunar Orbit', auto: true },
  { id: 6, name: 'Lunar Orbit',       desc: 'Chandrayaan-3 Lunar Orbit में — Moon के चारों ओर चक्कर',                   btn: '🚀 Separate Vikram Lander' },
  { id: 7, name: 'Lander Sep',        desc: 'Vikram Lander अलग हुआ — Propulsion Module Moon orbit में रहेगा',            btn: '⬇️ Powered Descent' },
  { id: 8, name: 'Descent',           desc: 'Powered Descent — थ्रस्टर्स fire होकर speed कम हो रही है',                 btn: '🏁 Soft Landing', auto: true },
  { id: 9, name: 'Landing',           desc: '🇮🇳 Vikram ने South Pole के पास Soft Landing की — India on the Moon!',       btn: '🤖 Deploy Pragyan Rover' },
  { id: 10, name: 'Rover Deploy',     desc: 'Pragyan Rover surface पर — India का पहला Lunar Rover Mission!',             btn: '✅ End Mission', auto: true },
];

export class MissionSimulator {
  constructor(renderer) {
    this.renderer = renderer;
    this.active = false;
    this.stage = 0;
    this.timeInStage = 0.0;

    // 3D Objects
    this.rocket = null;
    this.boosters = [];
    this.particles = [];
    this.plumes = [];
    this.scaffold = null;

    // Stage flags
    this._fairingHeatMesh = null;
    this._stage2FairingJettisoned = false;
    this._stage2MaxQReached = false;
    this._stage2BoostersSeparated = false;
    this._stage2SecondStageFired = false;
    this._stage3Initialized = false;
    this._stage3BaseRadius = 0;
    this._stage3BurnsDone = 0;
    this._orbitLine = null;
    this._lunarOrbitLine = null;
    this._landerSeparated = false;
    this._landerMesh = null;
    this._pmMesh = null;
    this._fastForward = 1.0;

    // DOM
    this.overlayEl = null;
    this.styleEl = null;
    this.flashEl = null;

    this.earthRadius = 4.0;
    this.moonRadius = 3.5;
    this.launchDir = new THREE.Vector3(0,1,0);
    this.debris = [];
    this._cameraShaking = 0;
    this.orbitRadius = 0;
    this.orbitAngle = 0;
  }

  toggle() { if (this.active) this.exit(); else this.enter(); return this.active; }

  enter() {
    this.active = true;
    this.stage = 0;
    this.timeInStage = 0;
    this.particles = []; this.boosters = []; this.debris = [];
    this.orbitRadius = 0; this.orbitAngle = 0;
    this._cameraShaking = 0;
    this._cinematicSlowMo = 1.0;
    this._autoFastForward = 1.0;
    this._initAudio();
    this._fairingHeatMesh = null;
    this._stage2FairingJettisoned = false;
    this._stage2MaxQReached = false;
    this._stage2BoostersSeparated = false;
    this._stage2SecondStageFired = false;
    this._stage3Initialized = false;
    this._stage3BaseRadius = 0;
    this._stage3BurnsDone = 0;
    this._orbitLine = null;
    this._lunarOrbitLine = null;
    this._landerSeparated = false;
    this._landerMesh = null;
    this._pmMesh = null;
    this._fastForward = 1.0;
    this._clearTrails();

    ['app-header','bottom-controls','nav-hint','time-controller','selection-reticle','star-tooltip','celestial-info-panel','side-panel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    this.prevTrackedPlanet = this.renderer._trackedPlanet;
    this.renderer._trackedPlanet = null;

    if (this.renderer.earth) this._frozenEarthRotY = this.renderer.earth.rotation.y;
    this._prevTimePaused = this.renderer.isTimePaused;
    this.renderer.isTimePaused = true;

    this.renderer._isCinematicFlight = false;
    this.renderer._targetCamGoal = null;
    this.renderer._targetPanGoal = null;

    this._buildMissionScene();
    this._injectUI();
  }

  exit() {
    this.active = false;
    this.stage = 0;

    ['app-header','bottom-controls','nav-hint','time-controller','selection-reticle','star-tooltip','celestial-info-panel','side-panel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = '';
    });

    this._clearMissionScene();
    this._clearTrails();
    if (this._stopRumble) this._stopRumble();

    [this.overlayEl, this.styleEl, this.flashEl].forEach(el => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    this.overlayEl = this.styleEl = this.flashEl = null;

    if (this.prevTrackedPlanet !== undefined) this.renderer._trackedPlanet = this.prevTrackedPlanet;
    if (this._prevTimePaused !== undefined) this.renderer.isTimePaused = this._prevTimePaused;

    if (this.renderer.controls) {
      this.renderer.controls.enablePan = true;
      this.renderer.controls.enableZoom = true;
      this.renderer.controls.autoRotate = false;
      this.renderer.controls.minDistance = 0.5;
      this.renderer.controls.maxDistance = 5000000;
      this.renderer.camera.fov = 70;
      this.renderer.camera.updateProjectionMatrix();
    }
  }

  // ─── Build 3D Scene ──────────────────────────────────────────────────────────
  _buildMissionScene() {
    if (!this.renderer.earth) return;

    const lat = 13.7 * Math.PI / 180;
    const lon = 80.2 * Math.PI / 180;
    this.launchDir.set(
      Math.cos(lat) * Math.cos(lon),
      Math.sin(lat),
      -Math.cos(lat) * Math.sin(lon)
    ).normalize();

    this.rocket = new THREE.Group();

    const coreMat    = new THREE.MeshStandardMaterial({ map: createRocketTexture('core'),    roughness: 0.6 });
    const boosterMat = new THREE.MeshStandardMaterial({ map: createRocketTexture('booster'), roughness: 0.5 });
    const upperMat   = new THREE.MeshStandardMaterial({ map: createRocketTexture('upper'),   roughness: 0.5 });
    const darkMat    = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.3 });
    const exhaustMat = new THREE.MeshBasicMaterial({
      map: createExhaustTexture(), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    const boosterExhaustMat = new THREE.MeshBasicMaterial({
      map: createBoosterExhaustTexture(), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    const cryoExhaustMat = new THREE.MeshBasicMaterial({
      map: createCryoExhaustTexture(), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });

    // Core Stage (L110)
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.4,32), coreMat);
    core.position.y = 0.2;
    this.rocket.add(core);
    this.coreStage = core;

    for (let i = 0; i < 2; i++) {
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.015,0.04,16,1,true), darkMat);
      nozzle.position.set(i===0?0.015:-0.015, -0.02, 0);
      nozzle.rotation.x = Math.PI;
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.04,0.45,16,1,true), exhaustMat);
      plume.position.y = 0.225; plume.visible = false;
      nozzle.add(plume);
      this.plumes.push(plume);
      core.add(nozzle);
    }

    // Upper Stage (C25)
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.04,0.25,32), upperMat);
    upper.position.y = 0.525;
    this.rocket.add(upper);
    this.upperStage = upper;

    // C25 Cryogenic Engine (Detailed)
    const cryoEngineGroup = new THREE.Group();
    cryoEngineGroup.position.set(0, -0.125, 0);
    
    // Shiny metallic bell nozzle
    const cryoMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
    const c25Nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 16, 1, true), cryoMat);
    c25Nozzle.rotation.x = Math.PI;
    cryoEngineGroup.add(c25Nozzle);
    
    // Turbopump / Engine machinery details
    const machineryMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.7 });
    const turboPump = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.015, 8), machineryMat);
    turboPump.position.set(0.015, 0.01, 0);
    turboPump.rotation.z = Math.PI / 4;
    cryoEngineGroup.add(turboPump);
    const turboPump2 = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), machineryMat);
    turboPump2.position.set(-0.012, 0.01, 0.01);
    cryoEngineGroup.add(turboPump2);
    
    // Support struts connecting nozzle to stage
    for (let i = 0; i < 4; i++) {
       const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.001, 0.001, 0.03), machineryMat);
       const a = (i/4) * Math.PI * 2;
       strut.position.set(Math.cos(a)*0.01, 0.015, Math.sin(a)*0.01);
       strut.rotation.x = Math.sin(a)*0.4;
       strut.rotation.z = -Math.cos(a)*0.4;
       cryoEngineGroup.add(strut);
    }

    const c25Plume = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.55, 16, 1, true), cryoExhaustMat);
    c25Plume.position.y = -0.275; c25Plume.rotation.x = Math.PI; c25Plume.visible = false;
    cryoEngineGroup.add(c25Plume);
    this.plumes.push(c25Plume);
    this._c25Plume = c25Plume;
    
    upper.add(cryoEngineGroup);

    // Fairing
    const fairingMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5 });
    const fairingBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.045,0.08,32), fairingMat);
    fairingBottom.position.y = 0.69;
    this.rocket.add(fairingBottom);
    this.fairingBottom = fairingBottom;
    const fairingTop = new THREE.Mesh(new THREE.ConeGeometry(0.055,0.18,32), fairingMat);
    fairingTop.position.y = 0.82;
    this.rocket.add(fairingTop);
    this.fairingTop = fairingTop;

    // Chandrayaan-3 Spacecraft
    this.spacecraft = new THREE.Group();
    this.spacecraft.position.y = 0.69;
    this.rocket.add(this.spacecraft);

    // Propulsion Module (PM)
    this.propulsionModule = new THREE.Mesh(
      new THREE.BoxGeometry(0.025,0.025,0.025),
      new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.8 })
    );
    const pmPanel = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.002,0.03), new THREE.MeshStandardMaterial({ color: 0x113388 }));
    pmPanel.scale.x = 0.2; // Folded inside fairing
    this.pmPanel = pmPanel;
    this.propulsionModule.add(pmPanel);
    this.spacecraft.add(this.propulsionModule);

    // PM engine
    const pmNozzle = new THREE.Mesh(new THREE.ConeGeometry(0.01,0.02,12,1,true), darkMat);
    pmNozzle.position.set(0,-0.021,0); pmNozzle.rotation.x = Math.PI;
    const pmPlume = new THREE.Mesh(new THREE.ConeGeometry(0.015,0.2,12,1,true), exhaustMat);
    pmPlume.position.y = 0.1; pmPlume.visible = false;
    pmNozzle.add(pmPlume);
    this.plumes.push(pmPlume);
    this._pmPlume = pmPlume;
    this.propulsionModule.add(pmNozzle);

    // Vikram Lander
    this.vikramLander = new THREE.Group();
    this.vikramLander.position.y = 0.035; // lowered slightly
    const landerBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.02,0.02,0.02), // scaled down from 0.035
      new THREE.MeshStandardMaterial({ color: 0xddaa00, metalness: 0.5, roughness: 0.5 })
    );
    this.vikramLander.add(landerBody);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.0015,0.0015,0.02), new THREE.MeshStandardMaterial({ color: 0x888888 }));
      const px = (i%2===0?1:-1)*0.012, pz = (i<2?1:-1)*0.012;
      leg.position.set(px,-0.012,pz);
      leg.rotation.x = pz>0?-0.3:0.3; leg.rotation.z = px>0?0.3:-0.3;
      this.vikramLander.add(leg);
    }

    // Thruster nozzles on lander (4 sides for deceleration)
    for (let i = 0; i < 4; i++) {
      const tn = new THREE.Mesh(new THREE.ConeGeometry(0.004,0.01,8,1,true), darkMat);
      const angle = (i/4)*Math.PI*2;
      tn.position.set(Math.cos(angle)*0.02, -0.015, Math.sin(angle)*0.02);
      tn.rotation.x = Math.PI;
      const tp = new THREE.Mesh(new THREE.ConeGeometry(0.006,0.06,8,1,true), exhaustMat);
      tp.position.y = 0.03; tp.visible = false;
      tn.add(tp);
      this.plumes.push(tp);
      this.vikramLander.add(tn);
    }

    this.ramp = new THREE.Mesh(
      new THREE.BoxGeometry(0.012,0.001,0.04),
      new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 })
    );
    this.ramp.position.set(0,-0.015,0.0175);
    this.ramp.geometry.translate(0,0,0.02);
    this.ramp.rotation.x = -Math.PI/2;
    this.vikramLander.add(this.ramp);
    this.spacecraft.add(this.vikramLander);

    // Pragyan Rover
    this.pragyanRover = new THREE.Group();
    this.pragyanRover.position.set(0,-0.008,0.01); // adjusted for smaller lander
    const roverBody = new THREE.Mesh(new THREE.BoxGeometry(0.008,0.006,0.007), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
    this.pragyanRover.add(roverBody);
    for (let i = 0; i < 6; i++) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.002,0.002,0.0015,8), darkMat);
      wheel.rotation.z = Math.PI/2;
      wheel.position.set((i%2===0?0.0045:-0.0045),-0.003,(i<2?-0.0025:(i<4?0:0.0025)));
      this.pragyanRover.add(wheel);
    }
    const roverPanel = new THREE.Mesh(new THREE.BoxGeometry(0.006,0.001,0.008), new THREE.MeshStandardMaterial({ color: 0x113388 }));
    roverPanel.position.set(0,0.003,0); roverPanel.rotation.x = -0.3;
    this.pragyanRover.add(roverPanel);
    this.vikramLander.add(this.pragyanRover);

    this.spacecraft.visible = false;

    // Side Boosters (S200)
    for (let i = 0; i < 2; i++) {
      const booster = new THREE.Group();
      const bCore = new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.6,24), boosterMat);
      bCore.position.y = 0.3; booster.add(bCore);
      const bNose = new THREE.Mesh(new THREE.ConeGeometry(0.032,0.1,24), boosterMat);
      bNose.position.y = 0.65; booster.add(bNose);
      const bNozzle = new THREE.Mesh(new THREE.ConeGeometry(0.025,0.06,16,1,true), darkMat);
      bNozzle.position.y = -0.03; bNozzle.rotation.x = Math.PI;
      const bPlume = new THREE.Mesh(new THREE.ConeGeometry(0.06,0.85,16,1,true), boosterExhaustMat);
      bPlume.position.y = 0.425; bPlume.visible = false;
      bNozzle.add(bPlume); this.plumes.push(bPlume);
      bCore.add(bNozzle);
      booster.position.x = i===0 ? 0.075 : -0.075;
      booster.position.y = 0.02;
      this.rocket.add(booster);
      this.boosters.push(booster);
    }

    const SCALE = 0.02;
    this.rocket.scale.set(SCALE,SCALE,SCALE);
    this.rocket.position.copy(this.launchDir).multiplyScalar(this.earthRadius + 0.01*SCALE);
    this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), this.launchDir);

    this.engineLight = new THREE.PointLight(0xff6600, 0, 0.08);
    this.engineLight.position.y = -0.002;
    this.rocket.add(this.engineLight);

    this.renderer.earth.add(this.rocket);

    // Launch Pad
    this._buildLaunchPad(SCALE);

    this.renderer.earth.updateMatrixWorld(true);

    // Camera setup
    if (this.renderer.controls) {
      const worldPos = new THREE.Vector3();
      this.rocket.getWorldPosition(worldPos);
      const worldDir = this.launchDir.clone().applyQuaternion(this.renderer.earth.quaternion);
      const targetPos = worldPos.clone().add(worldDir.clone().multiplyScalar(0.4*SCALE));
      this.renderer.controls.target.copy(targetPos);
      this.renderer.controls.enableZoom = true;
      this.renderer.controls.zoomSpeed = 5.0;
      this.renderer.controls.enablePan = false;
      this.renderer.controls.minDistance = 0.001;
      this.renderer.controls.maxDistance = 50;
      this.renderer.controls.autoRotate = false;
      this.renderer.controls.autoRotateSpeed = 1.0;
      const offsetDir = new THREE.Vector3(1,0.5,1).normalize();
      this.renderer.camera.position.copy(targetPos).add(offsetDir.multiplyScalar(0.15));
      this.renderer.controls.update();
    }
  }

  _buildLaunchPad(SCALE) {
    this.scaffold = new THREE.Group();
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1.5,0.05,1.5), new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 1.0 }));
    pad.position.y = 0.025; this.scaffold.add(pad);
    const trenchMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1.0 });
    [-0.3,0.3].forEach((x,i) => {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.1,0.4), trenchMat);
      t.position.set(x,0.05,0); t.rotation.z = i===0?Math.PI/8:-Math.PI/8;
      this.scaffold.add(t);
    });
    const mlp = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.08,0.4), new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 }));
    mlp.position.y = 0.09; this.scaffold.add(mlp);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x883333, metalness: 0.6, wireframe: true });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.12,1.0,0.12), towerMat);
    tower.position.set(0.2,0.59,0); this.scaffold.add(tower);
    const tCore = new THREE.Mesh(new THREE.BoxGeometry(0.06,1.0,0.06), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
    tCore.position.set(0.2,0.59,0); this.scaffold.add(tCore);
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.02,0.02), towerMat);
      arm.position.set(0.12,0.3+i*0.2,0); this.scaffold.add(arm);
    }
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
    for (let i = 0; i < 4; i++) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,1.5,8), poleMat);
      pole.position.set((i%2===0?0.35:-0.35),0.84,(i<2?0.35:-0.35));
      this.scaffold.add(pole);
    }
    this.scaffold.scale.set(SCALE,SCALE,SCALE);
    this.scaffold.position.copy(this.rocket.position);
    this.scaffold.quaternion.copy(this.rocket.quaternion);
    this.renderer.earth.add(this.scaffold);
  }

  _clearMissionScene() {
    [this.rocket, this.scaffold, this._orbitLine, this._lunarOrbitLine].forEach(obj => {
      if (obj && obj.parent) { obj.parent.remove(obj); }
    });
    this.particles.forEach(p => this.renderer.scene.remove(p.mesh));
    this.debris.forEach(d => { if (d.parent) d.parent.remove(d); });
    this.rocket = null; this.scaffold = null;
    this._orbitLine = null; this._lunarOrbitLine = null;
    this.particles = []; this.debris = [];
  }

  // ─── HUD UI ──────────────────────────────────────────────────────────────────
  _injectUI() {
    this.styleEl = document.createElement('style');
    this.styleEl.innerHTML = `
      .isro-hud {
        position: fixed; bottom: 20px; right: 20px; width: 340px;
        background: rgba(4,8,14,0.94); border: 1px solid rgba(0,212,255,0.35);
        border-radius: 12px; padding: 18px; color: white;
        font-family: 'Inter', sans-serif; z-index: 10000;
        backdrop-filter: blur(14px);
        box-shadow: 0 10px 40px rgba(0,0,0,0.7), 0 0 60px rgba(0,212,255,0.07);
      }
      .hud-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #00d4ff;
        margin: 0 0 10px; display: flex; align-items: center; gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; }
      .hud-time-controls { margin-left: auto; display: flex; gap: 4px; }
      .ff-btn { background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3); 
        color: #00d4ff; font-size: 9px; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: bold; }
      .ff-btn.active { background: #00d4ff; color: #000; }
      .hud-dot { width: 8px; height: 8px; background: #00ff66; border-radius: 50%;
        box-shadow: 0 0 8px #00ff66; animation: blink 1s infinite alternate; }
      @keyframes blink { from{opacity:0.4} to{opacity:1} }
      .stage-badge { font-size: 10px; padding: 2px 8px;
        background: rgba(0,212,255,0.12); border: 1px solid rgba(0,212,255,0.3);
        border-radius: 20px; color: #00d4ff; }
      .data-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; }
      .data-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        padding: 8px; border-radius: 6px; }
      .data-lbl { font-size: 9px; color: rgba(255,255,255,0.4); text-transform: uppercase;
        letter-spacing: 0.06em; margin-bottom: 3px; }
      .data-val { font-family: 'Courier New', monospace; font-size: 13px; font-weight: bold; color: #00ffaa; }
      .stage-timeline { margin-bottom: 10px; }
      .stage-progress-bar { height: 3px; background: rgba(255,255,255,0.08);
        border-radius: 2px; overflow: hidden; margin-bottom: 8px; }
      .stage-progress-fill { height: 100%; background: linear-gradient(90deg,#00d4ff,#00ff88);
        border-radius: 2px; transition: width 0.5s ease; }
      .status-text { font-size: 11px; color: #fff; background: rgba(0,212,255,0.07);
        padding: 8px 10px; border-radius: 6px; margin-bottom: 12px; text-align: center;
        font-weight: 500; border: 1px solid rgba(0,212,255,0.12); line-height: 1.5; }
      .hindi-desc { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 4px; }
      .btn-row { display: flex; gap: 8px; }
      .hud-btn { flex: 1; padding: 10px 12px;
        background: linear-gradient(135deg, #e65c00, #c84a11);
        border: 1px solid #ff7a24; color: white; cursor: pointer;
        border-radius: 6px; font-weight: 700; text-transform: uppercase;
        font-size: 11px; letter-spacing: 0.05em; transition: 0.2s; }
      .hud-btn:hover { background: linear-gradient(135deg,#ff6a00,#e65c00); transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(230,92,0,0.4); }
      .hud-btn.abort { background: rgba(180,0,0,0.15); border-color: rgba(255,50,50,0.35); }
      .hud-btn.abort:hover { background: rgba(255,0,0,0.3); }
      .hud-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
      .countdown-display { font-size: 52px; font-weight: 900; text-align: center;
        font-family: 'Courier New', monospace; color: #00ffaa;
        text-shadow: 0 0 18px #00ffaa; margin: 2px 0 8px; letter-spacing: 2px;
        animation: cntPulse 0.6s ease-in-out infinite alternate; }
      @keyframes cntPulse { from{opacity:0.8} to{opacity:1} }
      .countdown-display.warning { color: #ffaa00; text-shadow: 0 0 18px #ffaa00; }
      .countdown-display.liftoff { color: #ff4400; text-shadow: 0 0 28px #ff4400; font-size: 28px; letter-spacing: 4px; }
      .go-checklist { margin-bottom: 10px; }
      .checklist-item { font-size: 10px; font-family: 'Courier New', monospace; padding: 2px 4px;
        display: flex; justify-content: space-between; opacity: 0; transform: translateX(-10px);
        transition: opacity 0.35s ease, transform 0.35s ease; }
      .checklist-item.visible { opacity: 1; transform: translateX(0); }
      .checklist-item .go { color: #00ff66; font-weight: bold; }
      .screen-flash { position: fixed; inset: 0; background: rgba(255,180,40,0);
        pointer-events: none; z-index: 99999; transition: background 0.07s ease-out; }
      .screen-flash.active { background: rgba(255,190,60,0.5); }
      .milestone-toast { position: fixed; top: 30px; left: 50%; transform: translateX(-50%);
        background: rgba(0,10,20,0.92); border: 1px solid rgba(0,212,255,0.5);
        color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;
        z-index: 99998; opacity: 0; transition: opacity 0.4s ease;
        backdrop-filter: blur(10px); text-align: center; pointer-events: none; }
      .milestone-toast.show { opacity: 1; }
    `;
    document.head.appendChild(this.styleEl);

    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'isro-hud';
    this.overlayEl.innerHTML = `
      <h3 class="hud-title">
        <div class="hud-dot"></div> ISRO
        <span class="stage-badge" id="stage-badge">PRE-LAUNCH</span>
        <div class="hud-time-controls">
          <button class="ff-btn active" id="ff-1x">1x</button>
          <button class="ff-btn" id="ff-5x">5x</button>
          <button class="ff-btn" id="ff-10x">10x</button>
        </div>
      </h3>

      <div id="countdown-display" class="countdown-display" style="display:none;"></div>
      <div id="checklist" class="go-checklist" style="display:none;">
        <div class="checklist-item" id="chk-prop"><span>PROPULSION</span><span class="go">GO ✓</span></div>
        <div class="checklist-item" id="chk-nav"><span>NAVIGATION</span><span class="go">GO ✓</span></div>
        <div class="checklist-item" id="chk-range"><span>RANGE SAFETY</span><span class="go">GO ✓</span></div>
        <div class="checklist-item" id="chk-weather"><span>WEATHER</span><span class="go">GO ✓</span></div>
        <div class="checklist-item" id="chk-isro"><span>ISRO DIRECTOR</span><span class="go">GO ✓</span></div>
      </div>

      <div class="stage-timeline">
        <div class="stage-progress-bar"><div class="stage-progress-fill" id="stage-progress" style="width:0%"></div></div>
      </div>

      <div class="data-grid">
        <div class="data-box"><div class="data-lbl">Velocity</div><div class="data-val" id="tel-vel">0.00 km/s</div></div>
        <div class="data-box"><div class="data-lbl">Altitude</div><div class="data-val" id="tel-alt">0.0 km</div></div>
        <div class="data-box"><div class="data-lbl">Stage</div><div class="data-val" id="tel-stage">0 / 10</div></div>
      </div>

      <div class="status-text" id="mission-status">
        सभी सिस्टम नॉमिनल — लॉन्च के लिए तैयार
        <div class="hindi-desc" id="mission-hint">Chandrayaan-3 Mission begins at Sriharikota</div>
      </div>

      <div class="btn-row">
        <button class="hud-btn abort" id="hud-btn-close">✕ Abort</button>
        <button class="hud-btn" id="hud-btn-action">🔥 Ignite Engine</button>
      </div>
    `;
    document.body.appendChild(this.overlayEl);

    this.flashEl = document.createElement('div');
    this.flashEl.className = 'screen-flash';
    document.body.appendChild(this.flashEl);

    // Milestone toast
    this._toastEl = document.createElement('div');
    this._toastEl.className = 'milestone-toast';
    document.body.appendChild(this._toastEl);

    document.getElementById('hud-btn-close').addEventListener('click', () => {
      const btn = document.getElementById('btn-mission');
      if (btn) btn.click(); else this.exit();
    });
    document.getElementById('hud-btn-action').addEventListener('click', () => this._handleNextAction());

    const setFF = (val, btnId) => {
      this._fastForward = val;
      ['ff-1x','ff-5x','ff-10x'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.remove('active');
      });
      const act = document.getElementById(btnId);
      if(act) act.classList.add('active');
    };
    document.getElementById('ff-1x')?.addEventListener('click', () => setFF(1.0, 'ff-1x'));
    document.getElementById('ff-5x')?.addEventListener('click', () => setFF(5.0, 'ff-5x'));
    document.getElementById('ff-10x')?.addEventListener('click', () => setFF(10.0, 'ff-10x'));
  }

  _showToast(text, duration = 3500) {
    if (!this._toastEl) return;
    this._toastEl.textContent = text;
    this._toastEl.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this._toastEl.classList.remove('show'), duration);
  }

  _setStatus(text, hint = '') {
    const s = document.getElementById('mission-status');
    const h = document.getElementById('mission-hint');
    if (s) s.childNodes[0].textContent = text;
    if (h) h.textContent = hint;
  }

  _setActionBtn(text, disabled = false) {
    const btn = document.getElementById('hud-btn-action');
    if (!btn) return;
    if (text === null) { btn.style.display = 'none'; return; }
    btn.style.display = 'inline-block';
    btn.textContent = text;
    btn.disabled = disabled;
  }

  _updateProgress(stageNum, total = 10) {
    const el = document.getElementById('stage-progress');
    if (el) el.style.width = `${(stageNum / total) * 100}%`;
    const badge = document.getElementById('stage-badge');
    if (badge) badge.textContent = STAGES[Math.min(stageNum, STAGES.length-1)].name.toUpperCase();
    const ts = document.getElementById('tel-stage');
    if (ts) ts.textContent = `${stageNum} / ${total}`;
  }

  _handleNextAction() {
    if (this._audioCtx && this._audioCtx.state === 'suspended') this._audioCtx.resume();
    if (this.stage === 0) {
      this.stage = 1; this.timeInStage = 0;
      this._setActionBtn(null);
      const cntEl = document.getElementById('countdown-display');
      const chkEl = document.getElementById('checklist');
      if (cntEl) { cntEl.style.display = 'block'; cntEl.textContent = 'T-10'; cntEl.className = 'countdown-display'; }
      if (chkEl) chkEl.style.display = 'block';
      this._setStatus('Ignition Sequence — All Systems GO', 'LVM3 rocket engines being pre-ignited');
      this._updateProgress(1);
    } else if (this.stage === 2) {
      // After ascent, user triggers orbit raising
      this.stage = 3; this.timeInStage = 0;
      this._stage3Initialized = false;
      this._setActionBtn(null, true);
      this._setStatus('🌍 Entering Parking Orbit — EOR Burns Starting', 'Chandrayaan-3 detaches from LVM3');
      this._updateProgress(3);
    } else if (this.stage === 3) {
      this.stage = 4; this.timeInStage = 0;
      this._setActionBtn(null);
      this._setStatus('🌙 Trans-Lunar Injection Firing', 'Accelerating to escape velocity');
      this._updateProgress(4);
      this._showToast('🚀 TLI Burn Initiated! Engine at full thrust...');
    } else if (this.stage === 4) {
      this.stage = 5; this.timeInStage = 0;
      this._setActionBtn(null);
      this._setStatus('🌙 Entering Lunar Transfer Trajectory', 'Spacecraft coasting toward the Moon at 10.3 km/s');
      this._updateProgress(5);
      this._showToast('🌙 Trans-Lunar Injection Fired! Moon is 3,84,400 km away...');
    } else if (this.stage === 6) {
      this.stage = 7; this.timeInStage = 0;
      this._setActionBtn(null);
      this._setStatus('🚀 Vikram Lander Separating from PM...', 'Propulsion Module stays in lunar orbit');
      this._updateProgress(7);
      this._showToast('🚀 Vikram Lander Separation Initiated!');
    } else if (this.stage === 8) {
      this.stage = 9; this.timeInStage = 0;
      this._setActionBtn(null);
      this._setStatus('⬇️ Powered Descent Initiated — Thrusters Firing', '15 minutes of terror begins...');
      this._updateProgress(9);
      this._showToast('⬇️ Powered Descent Started — 15 Minutes of Terror!');
    } else if (this.stage === 10) {
      this.stage = 11; this.timeInStage = 0;
      this._setActionBtn(null);
      this._showToast('🤖 Pragyan Rover Rolling Out!');
    } else if (this.stage === 11) {
      const b = document.getElementById('btn-mission');
      if (b) b.click(); else this.exit();
    }
  }

  // ─── Audio ───────────────────────────────────────────────────────────────────
  _initAudio() {
    if (this._audioCtx) return;
    try {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const bufferSize = this._audioCtx.sampleRate * 2;
      const buffer = this._audioCtx.createBuffer(1, bufferSize, this._audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02; 
        lastOut = data[i];
        data[i] *= 3.5; 
      }
      this._noiseBuffer = buffer;
      this._gainNode = this._audioCtx.createGain();
      this._gainNode.gain.value = 0;
      this._filter = this._audioCtx.createBiquadFilter();
      this._filter.type = 'lowpass';
      this._filter.frequency.value = 100;
      this._gainNode.connect(this._filter);
      this._filter.connect(this._audioCtx.destination);
    } catch (e) {
      console.warn("AudioContext not supported", e);
    }
  }

  _playRumble(volume, frequency = 100) {
    if (!this._audioCtx) return;
    if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
    if (!this._audioSrc) {
      this._audioSrc = this._audioCtx.createBufferSource();
      this._audioSrc.buffer = this._noiseBuffer;
      this._audioSrc.loop = true;
      this._audioSrc.connect(this._gainNode);
      this._audioSrc.start();
    }
    this._gainNode.gain.setTargetAtTime(volume, this._audioCtx.currentTime, 0.2);
    this._filter.frequency.setTargetAtTime(frequency, this._audioCtx.currentTime, 0.2);
  }

  _stopRumble() {
    if (this._gainNode && this._audioCtx) {
      this._gainNode.gain.setTargetAtTime(0, this._audioCtx.currentTime, 0.5);
    }
    if (this._audioSrc) {
      const src = this._audioSrc;
      this._audioSrc = null;
      setTimeout(() => { try { src.stop(); } catch(e){} }, 600);
    }
  }

  // ─── Particles ───────────────────────────────────────────────────────────────
  _spawnParticles(pos, dir, isSmoke, isVenting = false) {
    const SCALE = 0.02;
    let color = isSmoke ? 0x999999 : (Math.random()>0.4 ? 0xff8800 : 0xffffff);
    if (isVenting) color = 0xcccccc;
    const mat = new THREE.SpriteMaterial({ map: createGlowTexture(), color, transparent: true,
      opacity: isSmoke ? (isVenting?0.3:0.5) : 1.0, depthWrite: false,
      blending: isSmoke ? THREE.NormalBlending : THREE.AdditiveBlending });
    const mesh = new THREE.Sprite(mat);
    const baseSize = (isVenting?0.04:(isSmoke?0.08:0.03))*SCALE;
    mesh.scale.set(baseSize,baseSize,baseSize);
    mesh.position.copy(pos).add(new THREE.Vector3((Math.random()-0.5)*0.01*SCALE,(Math.random()-0.5)*0.01*SCALE,(Math.random()-0.5)*0.01*SCALE));
    this.renderer.scene.add(mesh);
    const speedMul = isVenting?0.15:(isSmoke?0.2:0.8);
    const vel = dir.clone().multiplyScalar(speedMul*SCALE);
    vel.x += (Math.random()-0.5)*0.05*SCALE;
    vel.y += (Math.random()-0.5)*0.05*SCALE;
    vel.z += (Math.random()-0.5)*0.05*SCALE;
    this.particles.push({ mesh, vel, life:1.0, isSmoke, isVenting, baseSize });
  }

  _spawnExplosionShockwave(pos, quat) {
    const SCALE = 0.02;
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const radialDir = new THREE.Vector3(Math.cos(angle), (Math.random()-0.5)*0.5, Math.sin(angle)).normalize();
      radialDir.applyQuaternion(quat);
      
      const mesh = new THREE.Sprite(new THREE.SpriteMaterial({
        map: createGlowTexture(), color: 0xdddddd, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.NormalBlending
      }));
      const baseSize = 0.08 * SCALE;
      mesh.scale.set(baseSize, baseSize, baseSize);
      mesh.position.copy(pos).add(new THREE.Vector3((Math.random()-0.5)*0.01*SCALE, (Math.random()-0.5)*0.01*SCALE, (Math.random()-0.5)*0.01*SCALE));
      this.renderer.scene.add(mesh);
      
      const vel = radialDir.multiplyScalar((1.5 + Math.random()) * SCALE);
    this.particles.push({ mesh, vel, life: 1.0, isSmoke: true, isVenting: false, baseSize, expandFast: true });
    }
  }

_createKeplerOrbitParams(center, perigee, apogee, angleOffset = 0) {
    const a = (perigee + apogee) / 2;
    const c = a - perigee;
    const b = Math.sqrt(a * a - c * c);
    return { a, b, c, perigee, apogee, center, angleOffset };
  }

  _getOrbitPosition(orbitParams, E) {
    const { a, b, c, center, angleOffset } = orbitParams;
    const x_plan = a * Math.cos(E) - c;
    const z_plan = b * Math.sin(E);
    const x_rot = x_plan * Math.cos(angleOffset) - z_plan * Math.sin(angleOffset);
    const z_rot = x_plan * Math.sin(angleOffset) + z_plan * Math.cos(angleOffset);
    return new THREE.Vector3(center.x + x_rot, center.y, center.z + z_rot);
  }

  _initTrail(color, maxPoints = 5000) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPoints * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);
    const material = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.8 });
    const line = new THREE.Line(geometry, material);
    this.renderer.scene.add(line);
    this._currentTrail = { line, positions, count: 0, maxPoints };
    if (!this._allTrails) this._allTrails = [];
    this._allTrails.push(this._currentTrail);
  }

  _addTrailPoint(pos, minDistance = 0.1) {
    if (!this._currentTrail) return;
    const trail = this._currentTrail;
    if (trail.count > 0) {
      const lastX = trail.positions[(trail.count-1)*3];
      const lastY = trail.positions[(trail.count-1)*3+1];
      const lastZ = trail.positions[(trail.count-1)*3+2];
      const distSq = (pos.x-lastX)**2 + (pos.y-lastY)**2 + (pos.z-lastZ)**2;
      if (distSq < minDistance*minDistance) return;
    }
    if (trail.count >= trail.maxPoints) return;
    trail.positions[trail.count*3] = pos.x;
    trail.positions[trail.count*3+1] = pos.y;
    trail.positions[trail.count*3+2] = pos.z;
    trail.count++;
    trail.line.geometry.attributes.position.needsUpdate = true;
    trail.line.geometry.setDrawRange(0, trail.count);
  }

  _clearTrails() {
    if (this._allTrails) {
      this._allTrails.forEach(t => {
        if(t.line.parent) t.line.parent.remove(t.line);
        t.line.geometry.dispose();
        t.line.material.dispose();
      });
      this._allTrails = [];
    }
    this._currentTrail = null;
  }

  _updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta * (p.isVenting?0.6:(p.isSmoke?0.5:2.0));
      if (p.life <= 0) {
        this.renderer.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.particles.splice(i,1); continue;
      }
      p.mesh.position.addScaledVector(p.vel, delta);
      
      if (p.expandFast) {
        p.vel.multiplyScalar(0.95);
        const s = p.baseSize + (1-p.life)*p.baseSize*12;
        p.mesh.scale.set(s,s,s);
        p.mesh.material.opacity = p.life * 0.7;
      } else if (p.isSmoke || p.isVenting) {
        const s = p.baseSize + (1-p.life)*p.baseSize*4;
        p.mesh.scale.set(s,s,s);
        p.mesh.material.opacity = (p.isVenting?0.3:0.4)*p.life;
      } else {
        const s = p.baseSize * (p.life>0.8 ? (1+(1-p.life)*10) : p.life*2);
        p.mesh.scale.set(Math.max(0,s),Math.max(0,s),Math.max(0,s));
        if (p.life>0.7) p.mesh.material.color.lerp(new THREE.Color(0xffffff),delta*5);
        else if (p.life>0.4) p.mesh.material.color.lerp(new THREE.Color(0xffaa00),delta*8);
        else p.mesh.material.color.lerp(new THREE.Color(0xff2200),delta*6);
        p.mesh.material.opacity = p.life;
      }
    }
  }



  // ─── Main Update Loop ────────────────────────────────────────────────────────
  update(deltaRaw) {
    if (this._cinematicSlowMo < 1.0) {
      this._cinematicSlowMo += deltaRaw * 0.3; // recovers back to 1.0
      if (this._cinematicSlowMo > 1.0) this._cinematicSlowMo = 1.0;
    }

    this._autoFastForward = 1.0;
    if (this.stage === 2) {
      const t = this.timeInStage;
      if (t > 20 && t < 105) this._autoFastForward = 10.0;
      else if (t > 115 && t < 185) this._autoFastForward = 10.0;
      else if (t > 195 && t < 295) this._autoFastForward = 10.0;
      else if (t > 305 && t < 895) this._autoFastForward = 50.0; // Super fast to T+900
    }

    const delta = deltaRaw * (this._fastForward || 1.0) * (this._cinematicSlowMo || 1.0) * this._autoFastForward;
    this.timeInStage += delta;

    if (this.stage === 1) {
      if (this.timeInStage > 2.0) this._playRumble(0.3, 80);
    } else if (this.stage === 2) {
      if (this.timeInStage < 150) this._playRumble(0.8, 150);
      else if (this.timeInStage < 300) this._playRumble(0.4, 200);
      else if (this._stopRumble) this._stopRumble();
    } else if (this.stage === 3) {
      const angleMod = this.orbitAngle % (2*Math.PI);
      if (angleMod < 0.4 || angleMod > (2*Math.PI - 0.4)) this._playRumble(0.3, 250);
      else if (this._stopRumble) this._stopRumble();
    } else if (this.stage === 4 || this.stage === 5 || this.stage === 8) {
      this._playRumble(0.2, 300);
    } else {
      if (this._stopRumble) this._stopRumble();
    }
    this._updateParticles(delta);

    this.debris.forEach(d => {
      d.position.addScaledVector(d.userData.vel, delta*0.02);
      if (d.userData.angularVel) {
        d.rotation.x += d.userData.angularVel.x*delta;
        d.rotation.y += d.userData.angularVel.y*delta;
        d.rotation.z += d.userData.angularVel.z*delta;
      }
    });

    const moonEntry = this.renderer.planetMeshes ? this.renderer.planetMeshes.find(pm => pm.data.id === 'Moon') : null;
    if (!this.renderer.earth || !moonEntry || !this.rocket) return;

    this.renderer.earth.updateMatrixWorld(true);

    const earthPos = this.renderer.earth.position;
    const moonPos  = moonEntry.mesh.position;
    const SCALE    = 0.02;

    let velocity = 0, altitude = 0;
    const status = document.getElementById('mission-status');

    // Save rocket's old world position before any movement
    const oldRocketPos = new THREE.Vector3();
    this.rocket.getWorldPosition(oldRocketPos);

    // ── Plume animations (all stages) ─────────────────────────────────────────
    if (this.stage >= 1 && this.plumes) {
      this.plumes.forEach(p => {
        if (p.visible) {
          p.scale.x = 0.8 + Math.random()*0.4;
          p.scale.z = p.scale.x;
          p.scale.y = 0.9 + Math.random()*0.3;
          p.material.opacity = 0.8 + Math.random()*0.2;
        }
      });
      if (this.engineLight && (this.stage === 1 || this.stage === 2)) {
        this.engineLight.intensity = 0.6 + Math.random() * 0.8;
        this.engineLight.color.setHex(Math.random()>0.35 ? 0xff5500 : 0xffcc44);
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 1: T-10 Countdown
    // ══════════════════════════════════════════════════════════════════════════
    if (this.stage === 1) {
      const timeLeft = 10.0 - this.timeInStage;
      const cntEl = document.getElementById('countdown-display');
      const chkEl = document.getElementById('checklist');

      // GO checklist items appear one by one
      const checks = ['chk-prop','chk-nav','chk-range','chk-weather','chk-isro'];
      checks.forEach((id, i) => {
        if (this.timeInStage >= i * 1.2) {
          document.getElementById(id)?.classList.add('visible');
        }
      });

      if (timeLeft > 0) {
        if (cntEl) {
          const t = Math.ceil(timeLeft);
          cntEl.textContent = `T-${t}`;
          cntEl.className = t <= 3 ? 'countdown-display warning' : 'countdown-display';
        }
        // Massive pre-ignition venting (Liquid Oxygen fog)
        const worldDir = this.launchDir.clone().applyQuaternion(this.renderer.earth.quaternion);
        const ventPos  = new THREE.Vector3();
        this.rocket.getWorldPosition(ventPos);
        ventPos.addScaledVector(worldDir, 0.1*SCALE);
        for(let k=0; k<4; k++) {
           const drift = new THREE.Vector3(worldDir.z + (Math.random()-0.5)*2.0, 0.5 + Math.random(), -worldDir.x + (Math.random()-0.5)*2.0).normalize();
           this._spawnParticles(ventPos, drift, true, true);
        }
      } else {
        // LIFTOFF!
        if (cntEl) { cntEl.textContent = 'LIFTOFF!'; cntEl.className = 'countdown-display liftoff'; }
        if (chkEl) chkEl.style.display = 'none';
        this.plumes.forEach(p => { 
          if (p === this._c25Plume || p === this._pmPlume || (p.parent && p.parent.parent === this.vikramLander)) return;
          p.visible = true; 
        });
        // Flash effect
        if (this.flashEl) {
          this.flashEl.classList.add('active');
          setTimeout(() => this.flashEl?.classList.remove('active'), 200);
        }
        if (this.timeInStage >= 11.0) {
          this.stage = 2; this.timeInStage = 0;
          if (cntEl) cntEl.style.display = 'none';
          this._updateProgress(2);
          this._setStatus('🚀 LVM3 Liftoff! S200 + L110 Engines Burning', 'Maximum Thrust Phase — Climbing through atmosphere');
          this._showToast('🚀 LIFTOFF! Chandrayaan-3 is go for the Moon!');
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 2: Ascent through atmosphere
    // ══════════════════════════════════════════════════════════════════════════
    else if (this.stage === 2) {
      let rawVel = 0;
      const t_stage = this.timeInStage;
      if (t_stage < 150) rawVel = 0.00015 * t_stage * t_stage;
      else if (t_stage < 300) rawVel = 3.375 + (t_stage - 150) * 0.0075;
      else rawVel = 4.494 + (t_stage - 300) * 0.0055;
      
      velocity = Math.min(rawVel, 9.5);
      
      // Make liftoff speed visually realistic (majestic and slow initially)
      const visualSpeedScale = t_stage < 25 ? (0.01 + 0.09 * (t_stage/25)) : 0.1;
      const moveDelta = velocity * delta * visualSpeedScale * SCALE;

      let localUp = this.rocket.position.clone().normalize();
      let moveDir = localUp.clone();
      if (this.timeInStage > 20.0) {
        let tFrac = Math.min(1.0, (this.timeInStage - 20.0) / 880.0); // T+900 is orbit
        const pitchAngle = Math.pow(tFrac, 0.85) * (Math.PI / 2); // Majestic, slow pitch profile
        
        const localEast = localUp.clone().cross(new THREE.Vector3(0,1,0)).normalize();
        const pitchAxis = localUp.clone().cross(localEast).normalize();
        
        moveDir.applyAxisAngle(pitchAxis, pitchAngle);
      }
      this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), moveDir);
      this.rocket.position.addScaledVector(moveDir, moveDelta);
      altitude = (this.rocket.position.length() - this.earthRadius) / SCALE;

      const worldDir = this.launchDir.clone().applyQuaternion(this.renderer.earth.quaternion);

      // Exhaust spawning
      const spawnExhaust = (localOffset, isSmoke) => {
        const lp = localOffset.clone().applyQuaternion(this.rocket.quaternion);
        const wp = this.rocket.position.clone().add(lp).addScaledVector(moveDir, -0.05*SCALE);
        this.rocket.parent.localToWorld(wp);
        const scatterDir = moveDir.clone().negate().add(new THREE.Vector3((Math.random()-0.5)*0.3, (Math.random()-0.5)*0.3, (Math.random()-0.5)*0.3)).normalize();
        this._spawnParticles(wp, scatterDir, isSmoke, false);
      };
      const coreLocal  = new THREE.Vector3(0,0,0);
      const leftLocal  = new THREE.Vector3(0.075*SCALE, 0.02*SCALE, 0);
      const rightLocal = new THREE.Vector3(-0.075*SCALE, 0.02*SCALE, 0);

      // ── T+0-150: All engines ──
      if (this.timeInStage < 150) {
        if (this.timeInStage < 5) {
          for(let k=0; k<5; k++) {
            spawnExhaust(coreLocal, true); spawnExhaust(leftLocal, true); spawnExhaust(rightLocal, true);
          }
        }
        spawnExhaust(coreLocal, false);
        if (Math.random()<0.5) spawnExhaust(leftLocal, false);
        if (Math.random()<0.5) spawnExhaust(rightLocal, false);
      }
      // ── T+150-300: Core only ──
      else if (this.timeInStage < 300) {
        if (Math.random()<0.8) spawnExhaust(coreLocal, false);
      }
      // ── T+300+: C25 only (upper stage) ──
      else if (this.timeInStage >= 300) {
        if (this._c25Plume) this._c25Plume.visible = Math.random() > 0.2;
        if (Math.random()<0.6) {
          const c25Pos = new THREE.Vector3();
          this.upperStage?.getWorldPosition(c25Pos);
          this._spawnParticles(c25Pos, moveDir.clone().negate(), false);
        }
      }

      // ── MAX-Q at T+13 ──
      if (this.timeInStage >= 13 && !this._stage2MaxQReached) {
        this._stage2MaxQReached = true;
        this._cameraShaking = 0.4;
        if (!this._fairingHeatMesh && this.fairingTop) {
          const heatGeo = new THREE.ConeGeometry(0.057*SCALE, 0.19*SCALE, 32);
          const heatMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
          this._fairingHeatMesh = new THREE.Mesh(heatGeo, heatMat);
          const fwp = new THREE.Vector3(), fwq = new THREE.Quaternion();
          this.fairingTop.getWorldPosition(fwp); this.fairingTop.getWorldQuaternion(fwq);
          this._fairingHeatMesh.position.copy(fwp); this._fairingHeatMesh.quaternion.copy(fwq);
          this.rocket.attach(this._fairingHeatMesh);
        }
        this._setStatus('⚠️ MAX-Q — Peak Aerodynamic Pressure!', 'Maximum stress on rocket structure');
        this._showToast('⚠️ MAX-Q — Peak Aerodynamic Pressure!');
      }

      // Heating glow animation
      if (this._fairingHeatMesh) {
        const ht = this.timeInStage;
        let op = 0;
        if (ht >= 13 && ht < 45) op = Math.min((ht-13)/8, 1)*0.65;
        else if (ht >= 45 && ht < 90) op = Math.max(0, 1-(ht-45)/45)*0.65;
        this._fairingHeatMesh.material.opacity = op*(0.85+Math.random()*0.15);
        const peakT = Math.min((this.timeInStage-13)/12, 1);
        this._fairingHeatMesh.material.color.setRGB(1.0, 0.25+peakT*0.55, peakT*0.35);
      }

      // ── S200 Booster Separation T+150 ──
      if (this.timeInStage >= 150 && this.boosters.length > 0) {
        this._stage2BoostersSeparated = true;
        this._cinematicSlowMo = 0.2; // 0.2x slow motion
        
        // Circular shockwave
        const rwp = new THREE.Vector3(); this.rocket.getWorldPosition(rwp);
        this._spawnExplosionShockwave(rwp, this.rocket.quaternion);
        
        if (this.flashEl) {
          this.flashEl.classList.add('active');
          setTimeout(() => this.flashEl?.classList.remove('active'), 150);
        }

        this.boosters.forEach((b, idx) => {
          const wPos = new THREE.Vector3(), wQuat = new THREE.Quaternion();
          b.getWorldPosition(wPos); b.getWorldQuaternion(wQuat);
          this.rocket.remove(b); this.renderer.scene.add(b);
          b.position.copy(wPos); b.quaternion.copy(wQuat); b.scale.set(SCALE,SCALE,SCALE);
          const dir = new THREE.Vector3(idx===0?0.6:-0.6, -0.3, (Math.random()-0.5)*0.2).applyQuaternion(wQuat);
          b.userData.vel = dir.multiplyScalar(2.5);
          b.userData.angularVel = new THREE.Vector3((Math.random()-0.5)*2.5,(Math.random()-0.5)*2.5,(Math.random()-0.5)*2.5);
          
          // Booster residual smoke
          for(let k=0; k<5; k++) {
            this._spawnParticles(wPos, dir.clone().multiplyScalar(-0.5), true, true);
          }
          this.debris.push(b);
        });
        this.boosters = [];
        this._cameraShaking = 0.2; // Drastically reduce shake
        this._setStatus('🔥 S200 Booster Separation!', 'L110 core stage continues burning');
        this._showToast('🔥 T+150s: S200 Solid Boosters Separated!');
      }

      // ── Fairing Separation T+190 ──
      if (this.timeInStage >= 190 && !this._stage2FairingJettisoned) {
        this._stage2FairingJettisoned = true;
        this._cinematicSlowMo = 0.3; // 0.3x slow motion
        
        if (this.flashEl) { // Sun exposure flash
          this.flashEl.style.background = 'rgba(255,255,255,0.7)';
          this.flashEl.classList.add('active');
          setTimeout(() => { this.flashEl?.classList.remove('active'); this.flashEl.style.background = ''; }, 300);
        }

        this._cameraShaking = 0.1;
        if (this._fairingHeatMesh && this._fairingHeatMesh.parent) {
          this._fairingHeatMesh.parent.remove(this._fairingHeatMesh);
          this._fairingHeatMesh = null;
        }
        [this.fairingTop, this.fairingBottom].forEach((f, idx) => {
          if (!f || !f.parent) return;
          const wPos = new THREE.Vector3(), wQuat = new THREE.Quaternion();
          f.getWorldPosition(wPos); f.getWorldQuaternion(wQuat);
          this.rocket.remove(f); this.renderer.scene.add(f);
          f.position.copy(wPos); f.quaternion.copy(wQuat); f.scale.set(SCALE,SCALE,SCALE);
          const sep = new THREE.Vector3(idx===0?0.4:-0.4, 0.2, (Math.random()-0.5)*0.3).applyQuaternion(wQuat);
          f.userData.vel = sep.multiplyScalar(2.0);
          f.userData.angularVel = new THREE.Vector3((Math.random()-0.5)*1.5,(Math.random()-0.5)*1.5,(Math.random()-0.5)*1.5);
          this.debris.push(f);
        });
        if (this.spacecraft) this.spacecraft.visible = true;
        this._setStatus('🛸 Payload Fairing Jettison — Chandrayaan-3 Exposed to Space!', 'Spacecraft visible for the first time');
        this._showToast('🛸 T+190s: Fairing Jettisoned! Chandrayaan-3 enters Space!');
      }

      // ── Core Cutoff T+300 ──
      if (this.timeInStage >= 300 && !this._coreCutoffDone) {
        this._coreCutoffDone = true;
        this.plumes.forEach(p => { if (p !== this._c25Plume && p !== this._pmPlume) p.visible = false; });
        this._cinematicSlowMo = 0.3;
        
        // Core stage separation
        if (this.coreStage && this.coreStage.parent) {
          const wPos = new THREE.Vector3(), wQuat = new THREE.Quaternion();
          this.coreStage.getWorldPosition(wPos); this.coreStage.getWorldQuaternion(wQuat);
          this.rocket.remove(this.coreStage); this.renderer.scene.add(this.coreStage);
          this.coreStage.position.copy(wPos); this.coreStage.quaternion.copy(wQuat); this.coreStage.scale.set(SCALE,SCALE,SCALE);
          const sep = new THREE.Vector3(0, -1, 0).applyQuaternion(wQuat);
          this.coreStage.userData.vel = sep.multiplyScalar(1.5);
          this.coreStage.userData.angularVel = new THREE.Vector3((Math.random()-0.5)*1,(Math.random()-0.5)*1,(Math.random()-0.5)*1);
          this.debris.push(this.coreStage);
        }
        
        this._setStatus('L110 Core Cutoff — C25 Cryogenic Stage Ignition', 'Upper stage engine starts');
        this._showToast('🔵 T+300s: L110 Core Separated & C25 Cryogenic Upper Stage Ignited!');
      }

      // ── Spacecraft Separation T+900 ──
      if (this.timeInStage >= 900) {
        const btn = document.getElementById('hud-btn-action');
        if (btn && btn.style.display === 'none') {
          this._cinematicSlowMo = 0.3;
          this._setActionBtn('🌍 Raise Orbit');
          this._setStatus('✅ Parking Orbit Achieved! (170 km × 36,500 km)', 'Spacecraft separated. Press to begin Orbit Raising maneuvers');
          this._showToast('✅ T+900s: Spacecraft Separated! Earth Parking Orbit Achieved!');
          this._updateProgress(2);
        }
      } else if (this.timeInStage >= 300 && this.timeInStage < 900) {
        if (status && Math.floor(this.timeInStage) % 5 === 0) {
          this._setStatus(`🚀 C25 Cryogenic Stage Burning — T+${Math.floor(this.timeInStage)}s`, `Alt: ${(altitude*0.06).toFixed(0)} km`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 3: Earth Orbit Raising (EOR Maneuvers)
    // ══════════════════════════════════════════════════════════════════════════
    else if (this.stage === 3) {
      const EOR_BURNS = [
        { start:  8, end: 15, label: 'EOR-1', gain: SCALE*80  },
        { start: 22, end: 29, label: 'EOR-2', gain: SCALE*160 },
        { start: 36, end: 42, label: 'EOR-3', gain: SCALE*250 },
        { start: 50, end: 56, label: 'EOR-4', gain: SCALE*350 },
        { start: 65, end: 71, label: 'EOR-5', gain: SCALE*460 },
      ];

      // First frame: detach from Earth, setup orbit
      if (!this._stage3Initialized) {
        this._stage3Initialized = true;
        this._stage3BurnsDone = 0;

        const rocketWorldPos = new THREE.Vector3();
        this.rocket.getWorldPosition(rocketWorldPos);

        if (this.rocket.parent !== this.renderer.scene) {
          this.renderer.scene.attach(this.rocket);
        }

        // Remove remaining LVM3 stages
        [this.fairingTop, this.fairingBottom].forEach(f => { if (f && f.parent === this.rocket) this.rocket.remove(f); });
        if (this.coreStage && this.coreStage.parent === this.rocket) this.rocket.remove(this.coreStage);

        // C25 Upper Stage separation
        if (this.upperStage && this.upperStage.parent === this.rocket) {
          this._cinematicSlowMo = 0.15; // Cinematic slow motion!
          this._cameraShaking = 0.3;
          this.upperStage.userData.localVel = new THREE.Vector3(0, -0.05, -0.02); // Drift backwards locally
          this.upperStage.userData.localAngVel = new THREE.Vector3(0.5, 0.2, 0.1);
          if (this._c25Plume) this._c25Plume.visible = false; // Turn OFF the engine!
          this._showToast('🔥 C25 Upper Stage Separated — Chandrayaan-3 Flies Solo!');
          if (this.pmPanel) {
            this.pmPanel.scale.x = 1.0; // Deploy solar panels
            setTimeout(() => this._showToast('☀️ PM Solar Panels Deployed!'), 2500);
          }
        }
        if (this.spacecraft) this.spacecraft.visible = true;

        const relPos = rocketWorldPos.clone().sub(earthPos);
        this._stage3AngleOffset = Math.atan2(relPos.z, relPos.x);
        this._stage3Perigee = relPos.length();
        
        this.orbitAngle = 0; // Starts exactly at the perigee (current position)
        this.orbitCount = 0;
        this.targetApogees = [1.0, 2.5, 4.5, 7.0, 10.0];
        this.currentOrbitIdx = 0;
        this._initTrail(0xff0000); // Red trail for EBNs
      }

      // Animate C25 drifting away relative to the rocket
      if (this.upperStage && this.upperStage.parent === this.rocket) {
         this.upperStage.position.addScaledVector(this.upperStage.userData.localVel, delta);
         this.upperStage.rotation.x += this.upperStage.userData.localAngVel.x * delta;
         this.upperStage.rotation.y += this.upperStage.userData.localAngVel.y * delta;
         this.upperStage.rotation.z += this.upperStage.userData.localAngVel.z * delta;
      }

      const currentApogee = this.earthRadius + this.targetApogees[this.currentOrbitIdx];
      const orbitParams = this._createKeplerOrbitParams(earthPos, this._stage3Perigee, currentApogee, this._stage3AngleOffset);
      
      const prevAngle = this.orbitAngle;
      const dist = this.rocket.position.distanceTo(earthPos);
      const orbitSpeed = 1.0 / (dist * 1.5);
      this.orbitAngle += delta * orbitSpeed * 4.0;
      
      const prevCycles = Math.floor(prevAngle / (2*Math.PI));
      const currCycles = Math.floor(this.orbitAngle / (2*Math.PI));
      
      let isBurning = false;
      const angleMod = this.orbitAngle % (2*Math.PI);
      if (angleMod < 0.4 || angleMod > (2*Math.PI - 0.4)) {
         isBurning = true;
         this._cinematicSlowMo = 0.2; // Slow down during burn to show the boost clearly
         this._cameraShaking = 0.03;
      }
      
      if (currCycles > prevCycles && this.currentOrbitIdx < 4) {
         this.currentOrbitIdx++;
         this._showToast(`🔥 EOR Burn ${this.currentOrbitIdx} Complete! Orbit raised.`);
      }

      const pos = this._getOrbitPosition(orbitParams, this.orbitAngle);
      this.rocket.position.copy(pos);
      this._addTrailPoint(pos);
      
      const nextPos = this._getOrbitPosition(orbitParams, this.orbitAngle + 0.01);
      const tangent = new THREE.Vector3().subVectors(nextPos, pos).normalize();
      this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), tangent);
      
      altitude = (dist - this.earthRadius) / SCALE;
      velocity = Math.max(3.5, 10.5 - (dist - this.earthRadius)/(SCALE*500)*4.0);

      // Engine FX
      if (this._pmPlume) this._pmPlume.visible = isBurning;
      this.plumes.forEach(p => { if (p !== this._pmPlume && p !== this._c25Plume) p.visible = false; });
      if (this.engineLight) {
        this.engineLight.intensity = isBurning ? (0.6+Math.random()*0.8) : 0;
        if (isBurning) this.engineLight.color.setHex(Math.random()>0.4 ? 0x4488ff : 0xaaccff);
      }
      if (isBurning) {
        const exPos = this.rocket.position.clone().addScaledVector(tangent.clone().negate(), 0.3*SCALE);
        this._spawnParticles(exPos, tangent.clone().negate(), false);
        if (Math.random()<0.35) this._spawnParticles(exPos, tangent.clone().negate(), true);
      }

      const altKm = Math.round(altitude*60);
      if (this.timeInStage < 8) this._setStatus(`🌍 Chandrayaan-3 in Parking Orbit — ${altKm} km`, 'Preparing for orbit-raising burns');
      else if (isBurning) this._setStatus(`🔥 Perigee Kick Burn — Orbit ↑${altKm} km`, 'Engine firing to raise apogee');
      else this._setStatus(`🌌 Coasting — ${altKm} km | Orbit ${this.currentOrbitIdx+1}/5`, 'Waiting for next perigee');

      // Check transition to TLI
      if (this.currentOrbitIdx === 4 && currCycles > prevCycles) {
        const btn = document.getElementById('hud-btn-action');
        if (btn && btn.style.display === 'none') {
          this._setActionBtn('🌙 Trans-Lunar Injection →');
          this._setStatus('🌙 Escape Trajectory Ready — Fire TLI Burn!', `Orbit: ${altKm} km × 127,603 km`);
          this._updateProgress(4);
        }
      }

    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 4: Trans-Lunar Injection
    // ══════════════════════════════════════════════════════════════════════════
    else if (this.stage === 4) {
      if (!this._stage4Initialized) {
        this._stage4Initialized = true;
const startPos = this.rocket.position.clone();
        const destPos = moonPos.clone().add(new THREE.Vector3(0,0, -this.moonRadius - 2.0)); 
        // Curve sideways on X axis for realistic visual transfer
        const midPoint = new THREE.Vector3().addVectors(startPos, destPos).multiplyScalar(0.5);
        midPoint.x -= SCALE * 300; 
        
        this._tliCurve = new THREE.QuadraticBezierCurve3(startPos, midPoint, destPos);
        this._tliProgress = 0;
        this._initTrail(0xff0000); // Red trail continues
      }

      velocity = 10.5;
      this._tliProgress += delta * 0.08;
      if (this._tliProgress > 1.0) this._tliProgress = 1.0;
      
      const targetPos = this._tliCurve.getPoint(this._tliProgress);
      const nextPos = this._tliCurve.getPoint(Math.min(1.0, this._tliProgress + 0.01));
      
      const dir = new THREE.Vector3().subVectors(nextPos, targetPos).normalize();
      if (dir.lengthSq() > 0) this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
      
      this.rocket.position.copy(targetPos);
      this._addTrailPoint(targetPos);
      altitude = (this.rocket.position.distanceTo(earthPos) - this.earthRadius) / SCALE;

      if (this._pmPlume) this._pmPlume.visible = Math.random() > 0.3;
      const exPos = this.rocket.position.clone().addScaledVector(dir, -0.25*SCALE);
      this._spawnParticles(exPos, dir.clone().negate(), false);

      const distToMoon = this.rocket.position.distanceTo(moonPos);
      const distToEarth = this.rocket.position.distanceTo(earthPos);
      this._setStatus(`🌙 Trans-Lunar Injection — Speeding toward Moon`, `Earth: ${(distToEarth*SCALE*500).toFixed(0)} km | Moon: ${(distToMoon*SCALE*500).toFixed(0)} km`);

      // Auto-advance when close enough to Moon
      if (distToMoon < this.moonRadius + 2.5) {
        this.stage = 5; this.timeInStage = 0;
        this._setActionBtn(null);
        this._updateProgress(5);
        this._showToast('🌙 Approaching Moon — Lunar Orbit Insertion begins!');
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 5: Lunar Transfer + Moon Orbit Insertion
    // ══════════════════════════════════════════════════════════════════════════
    else if (this.stage === 5) {
      if (!this._stage5Initialized) {
        this._stage5Initialized = true;
        
        this.orbitAngle = 0; // Start at perilune (capture point)
        this.currentOrbitIdx = 0;
        this.targetApolunes = [4.0, 2.5, 1.0, 0.2]; // Reduced apolunes for realistic scale
        this._initTrail(0x0088ff); // Blue trail
      }

      if (this.timeInStage < 8) {
        // Still approaching on TLI
        velocity = Math.max(1.6, 10.5 - this.timeInStage*1.5);
        const dir = new THREE.Vector3().subVectors(moonPos, this.rocket.position).normalize();
        this.rocket.position.addScaledVector(dir, velocity*delta*0.05*SCALE);
        this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
        this._addTrailPoint(this.rocket.position); // Add trail point during deceleration!
        if (this._pmPlume) this._pmPlume.visible = true;
        this._setStatus('🛸 Moon Orbit Insertion — Decelerating...', 'Engine firing against trajectory to brake into orbit');
      } else {
        // Captured into Lunar Orbits!
        const currentApolune = this.moonRadius + this.targetApolunes[this.currentOrbitIdx];
        const orbitParams = this._createKeplerOrbitParams(moonPos, this.moonRadius+0.2, currentApolune, Math.PI);

        const prevAngle = this.orbitAngle;
        const dist = this.rocket.position.distanceTo(moonPos);
        const orbitSpeed = 1.0 / (dist * 1.5); // Keplerian speed
        this.orbitAngle += delta * orbitSpeed * 8.0; // Sped up the orbit significantly!

        const prevCycles = Math.floor(prevAngle / (2*Math.PI));
        const currCycles = Math.floor(this.orbitAngle / (2*Math.PI));
        
        let isBurning = false;
        const angleMod = this.orbitAngle % (2*Math.PI);
        if (angleMod < 0.4 || angleMod > (2*Math.PI - 0.4)) {
           isBurning = true; // Burn at perilune
           this._cinematicSlowMo = 0.2; // Slow down during burn to show the boost clearly
           this._cameraShaking = 0.03;
        }
        
        if (currCycles > prevCycles && this.currentOrbitIdx < 3) {
           this.currentOrbitIdx++;
           this._showToast(`🔥 Lunar Orbit ${this.currentOrbitIdx} Reduced.`);
           if (this.currentOrbitIdx === 3) {
             this._initTrail(0x00ff00); // Green trail for 100x100 km circular
           }
        }

        const pos = this._getOrbitPosition(orbitParams, this.orbitAngle);
        this.rocket.position.copy(pos);
        this._addTrailPoint(pos);

        const nextPos = this._getOrbitPosition(orbitParams, this.orbitAngle + 0.01);
        const tangent = new THREE.Vector3().subVectors(nextPos, pos).normalize();
        this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), tangent);
        
        if (this._pmPlume) this._pmPlume.visible = isBurning;
        altitude = (dist - this.moonRadius) / SCALE;
        velocity = 1.6;
        this._setStatus(`🌙 Lunar Orbit Achieved! (${Math.round(altitude*60)} km × 100 km)`, 'Orbiting the Moon — preparing for lander separation');

        if (this.currentOrbitIdx === 3 && currCycles > prevCycles) {
          this.stage = 6; this.timeInStage = 0;
          const btn = document.getElementById('hud-btn-action');
          if (!btn || btn.style.display === 'none') {
            this._setActionBtn('🚀 Separate Vikram Lander');
            this._updateProgress(6);
            this._showToast('🌙 Lunar Orbit Achieved! Ready to deploy Vikram Lander.');
          }
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 6: Lunar Orbit (waiting for lander sep command)
    // ══════════════════════════════════════════════════════════════════════════
    else if (this.stage === 6) {
      velocity = 1.6;
      
      const orbitParams = this._createKeplerOrbitParams(moonPos, this.moonRadius+0.2, this.moonRadius+0.2, Math.PI);
      const dist = this.moonRadius+0.2;
      const orbitSpeed = 1.0 / (dist * 2.0);
      this.orbitAngle += delta * orbitSpeed * 2.5;
      
      const pos = this._getOrbitPosition(orbitParams, this.orbitAngle);
      this.rocket.position.copy(pos);
      this._addTrailPoint(pos);
      
      const nextPos = this._getOrbitPosition(orbitParams, this.orbitAngle + 0.01);
      const tangent = new THREE.Vector3().subVectors(nextPos, pos).normalize();
      this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), tangent);
      
      altitude = (dist - this.moonRadius) / SCALE;
      this._setStatus('🌙 In Lunar Orbit (100x100 km) — Preparing for Vikram Separation', 'Propulsion Module and Lander systems checked');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 7: Lander Separation + De-boost
    // ══════════════════════════════════════════════════════════════════════════
    else if (this.stage === 7) {
      if (!this._stage7Initialized) {
        this._stage7Initialized = true;
        this._deboostOrbit = this._createKeplerOrbitParams(moonPos, this.moonRadius+0.06, this.moonRadius+0.2, Math.PI);
        this._initTrail(0x00ffff); // Cyan trail
      }

      // Separate PM from spacecraft on first frame
      if (!this._landerSeparated) {
        this._landerSeparated = true;
        if (this.propulsionModule && this.propulsionModule.parent === this.spacecraft) {
          this._cinematicSlowMo = 0.15; // Slow motion for cinematic separation!
          this._cameraShaking = 0.4;
          this.propulsionModule.userData.localVel = new THREE.Vector3(0, 0.04, -0.06); // Drift away locally
          this.propulsionModule.userData.localAngVel = new THREE.Vector3(0.5, 0.2, 0.1);
          if (this._pmPlume) this._pmPlume.visible = false; // Turn OFF the PM engine!
          this._showToast('🚀 Vikram Lander separating from Propulsion Module!');
          this._updateProgress(7);
        }
      }

      // Animate PM drifting away relative to Vikram Lander
      if (this.propulsionModule && this.propulsionModule.parent === this.spacecraft) {
         this.propulsionModule.position.addScaledVector(this.propulsionModule.userData.localVel, delta);
         this.propulsionModule.rotation.x += this.propulsionModule.userData.localAngVel.x * delta;
         this.propulsionModule.rotation.y += this.propulsionModule.userData.localAngVel.y * delta;
         this.propulsionModule.rotation.z += this.propulsionModule.userData.localAngVel.z * delta;
      }


      // Follow Cyan de-boost orbit
      const dist = this.rocket.position.distanceTo(moonPos);
      const orbitSpeed = 1.0 / (dist * 2.0);
      this.orbitAngle += delta * orbitSpeed * 2.5;
      
      const pos = this._getOrbitPosition(this._deboostOrbit, this.orbitAngle);
      this.rocket.position.copy(pos);
      this._addTrailPoint(pos);
      
      const nextPos = this._getOrbitPosition(this._deboostOrbit, this.orbitAngle + 0.01);
      const tangent = new THREE.Vector3().subVectors(nextPos, pos).normalize();
      this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), tangent);

      altitude = (dist - this.moonRadius) / SCALE;
      velocity = 1.6;
      this._setStatus(`⬇️ De-boost Maneuver — Lowering orbit to ${Math.round(altitude*60)} km`, 'Vikram Lander descending toward Moon on 100x30km orbit');

      if (this.timeInStage >= 10) {
        this.stage = 8; this.timeInStage = 0;
        const btn = document.getElementById('hud-btn-action');
        if (!btn || btn.style.display === 'none') {
          this._setActionBtn('⬇️ Powered Descent');
          this._updateProgress(8);
          this._showToast('✅ De-boost complete! Ready for Powered Descent.');
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 8: Coasting in 100x30km orbit (waiting for descent)
    // ══════════════════════════════════════════════════════════════════════════
    else if (this.stage === 8) {
      // Continue PM drift
      if (this.propulsionModule && this.propulsionModule.parent === this.spacecraft) {
         this.propulsionModule.position.addScaledVector(this.propulsionModule.userData.localVel, delta);
         this.propulsionModule.rotation.x += this.propulsionModule.userData.localAngVel.x * delta;
         this.propulsionModule.rotation.y += this.propulsionModule.userData.localAngVel.y * delta;
         this.propulsionModule.rotation.z += this.propulsionModule.userData.localAngVel.z * delta;
      }
      
      const dist = this.rocket.position.distanceTo(moonPos);
      const orbitSpeed = 1.0 / (dist * 2.0);
      this.orbitAngle += delta * orbitSpeed * 2.5;
      
      const pos = this._getOrbitPosition(this._deboostOrbit, this.orbitAngle);
      this.rocket.position.copy(pos);
      this._addTrailPoint(pos);
      
      const nextPos = this._getOrbitPosition(this._deboostOrbit, this.orbitAngle + 0.01);
      const tangent = new THREE.Vector3().subVectors(nextPos, pos).normalize();
      this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), tangent);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 9: Powered Descent (15 minutes of terror)
    // ══════════════════════════════════════════════════════════════════════════
    else if (this.stage === 9) {
      if (!this._stage9Initialized) {
        this._stage9Initialized = true;
        // Detach PM and leave it in orbit while Vikram descends
        if (this.propulsionModule && this.propulsionModule.parent === this.spacecraft) {
           const wPos = new THREE.Vector3(), wQuat = new THREE.Quaternion();
           this.propulsionModule.getWorldPosition(wPos);
           this.propulsionModule.getWorldQuaternion(wQuat);
           this.spacecraft.remove(this.propulsionModule);
           this.renderer.scene.add(this.propulsionModule);
           this.propulsionModule.position.copy(wPos);
           this.propulsionModule.quaternion.copy(wQuat);
           this.propulsionModule.scale.set(SCALE,SCALE,SCALE);
        }
      }
      velocity = Math.max(0, 1.6 - this.timeInStage*0.15);
      this.orbitRadius -= delta*0.25;

      if (this.orbitRadius <= this.moonRadius - 0.0141) {
        this.orbitRadius = this.moonRadius - 0.0141;
        velocity = 0; altitude = 0;

        if (!this._landingDone) {
          this._landingDone = true;
          this._setStatus('🇮🇳 TOUCHDOWN CONFIRMED! India on the Moon! — South Pole, Aug 23, 2023', 'Vikram Lander safely landed at Shiv Shakti Point');
          this._showToast('🇮🇳 CHANDRAYAAN-3 LANDS ON THE MOON! Jai Hind! 🌙');
          // Screen flash for celebration
          if (this.flashEl) {
            this.flashEl.classList.add('active');
            setTimeout(() => this.flashEl?.classList.remove('active'), 500);
          }
          this._cameraShaking = 1.5;
          this._updateProgress(9);
          setTimeout(() => {
            this.stage = 10; this.timeInStage = 0;
            this._setActionBtn('🤖 Deploy Pragyan Rover');
            this._updateProgress(10);
          }, 3000);
        }
      } else {
        altitude = (this.orbitRadius - (this.moonRadius - 0.0141)) * 100;
        this.orbitAngle += delta*0.05;

        // Thruster dust during final descent
        if (this.orbitRadius < this.moonRadius + 0.05) {
          const upDir = new THREE.Vector3().subVectors(this.rocket.position, moonPos).normalize();
          for (let i = 0; i < 3; i++) {
            const dustPos = this.rocket.position.clone().addScaledVector(upDir, -0.01);
            const drift = new THREE.Vector3((Math.random()-0.5)*2, 0.2, (Math.random()-0.5)*2).normalize();
            this._spawnParticles(dustPos, drift, true, true);
          }
          // Thruster plumes visible
          this.plumes.forEach(p => { p.visible = Math.random() > 0.5; });
          if (this.engineLight) { this.engineLight.intensity = 1 + Math.random()*1.5; this.engineLight.color.setHex(0x88ccff); }
        }

        const thrusterFraction = 1 - Math.min(this.timeInStage/8, 1);
        this._setStatus(`⬇️ Powered Descent — ${Math.round(altitude)} km altitude`, `Speed: ${velocity.toFixed(1)} km/s | Thrusters at ${Math.round(thrusterFraction*100)}%`);
      }

      this.rocket.position.set(
        moonPos.x + Math.cos(this.orbitAngle)*this.orbitRadius,
        moonPos.y,
        moonPos.z + Math.sin(this.orbitAngle)*this.orbitRadius
      );

      if (this.orbitRadius <= this.moonRadius - 0.0141) {
        const upDir2 = new THREE.Vector3().subVectors(this.rocket.position, moonPos).normalize();
        this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), upDir2);
      } else {
        const progress9 = Math.min(this.timeInStage/10, 1);
        const orbitDir9 = new THREE.Vector3(-Math.sin(this.orbitAngle), 0, Math.cos(this.orbitAngle)).normalize();
        const upDir9    = new THREE.Vector3().subVectors(this.rocket.position, moonPos).normalize();
        const lerpDir   = new THREE.Vector3().lerpVectors(orbitDir9, upDir9, progress9).normalize();
        this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), lerpDir);
        const exDir = lerpDir.clone().negate();
        const exPos = this.rocket.position.clone().addScaledVector(exDir, -0.014);
        if (Math.random() < 0.7) this._spawnParticles(exPos, exDir, false);
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 10: Pragyan Rover Deployment
    // ══════════════════════════════════════════════════════════════════════════
    else if (this.stage === 10 || this.stage === 11) {
      velocity = 0; altitude = 0;
      this.orbitRadius = this.moonRadius - 0.0141;
      this.rocket.position.set(
        moonPos.x + Math.cos(this.orbitAngle)*this.orbitRadius,
        moonPos.y,
        moonPos.z + Math.sin(this.orbitAngle)*this.orbitRadius
      );
      const upDir10 = new THREE.Vector3().subVectors(this.rocket.position, moonPos).normalize();
      this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), upDir10);

      if (this.stage === 10 && !this._roverDeployStarted) {
        this._roverDeployStarted = true;
        this._updateProgress(10);
      }

      const t10 = this.timeInStage;
      if (t10 < 3.0) {
        // Deploy ramp
        const progress = t10/3.0;
        if (this.ramp) this.ramp.rotation.x = -Math.PI/2 + progress*(Math.PI/2+Math.PI/6);
        this._setStatus('🤖 Deploying Ramp — Pragyan Rover preparing to roll out', 'Ramp unfolding from Vikram Lander');
      } else if (t10 < 8.0) {
        // Rover rolls down
        if (this.ramp) this.ramp.rotation.x = Math.PI/6;
        const progress = (t10-3)/5;
        if (this.pragyanRover) {
          this.pragyanRover.position.z = 0.015 + progress*0.037;
          this.pragyanRover.position.y = -0.01 - progress*0.018;
          this.pragyanRover.rotation.x = Math.PI/6;
        }
        this._setStatus('🤖 Pragyan Rover rolling down the ramp...', 'India\'s first lunar rover touches Moon surface');
      } else if (t10 < 20.0) {
        // Rover explores
        const progress = (t10-8)/12;
        if (this.pragyanRover) {
          this.pragyanRover.position.z = 0.052 + progress*0.07;
          this.pragyanRover.position.y = -0.028;
          this.pragyanRover.rotation.x = 0;
        }
        // Dust from wheels
        if (Math.random() < 0.25 && this.pragyanRover) {
          const wPos = new THREE.Vector3();
          this.pragyanRover.getWorldPosition(wPos);
          const upD = new THREE.Vector3().subVectors(wPos, moonPos).normalize();
          wPos.addScaledVector(upD, -0.01);
          this._spawnParticles(wPos, new THREE.Vector3(Math.random()-0.5, 0.1, Math.random()-0.5).normalize(), true, true);
        }
        this._setStatus('🤖 Pragyan Rover exploring the South Pole!', 'Analysing regolith — Sulphur detected on lunar surface');
      } else {
        this._setStatus('🇮🇳 Mission Complete! Chandrayaan-3 — Historic Success!', 'Pragyan Rover mission duration: 14 Earth days');
        if (this.stage === 10) {
          setTimeout(() => { this._setActionBtn('✅ End Mission'); }, 2000);
          this.stage = 11;
        }
      }
    }

    // ── Camera Tracking ────────────────────────────────────────────────────────
    this.renderer.earth.updateMatrixWorld(true);
    const newRocketPos = new THREE.Vector3();
    this.rocket.getWorldPosition(newRocketPos);
    const posDiff = newRocketPos.clone().sub(oldRocketPos);

    if (this.active && this.renderer.controls) {
      let upDir = this.launchDir.clone().applyQuaternion(this.renderer.earth.quaternion);
      if (this.stage >= 3) upDir = new THREE.Vector3(0,1,0).applyQuaternion(this.rocket.quaternion);

      const centerTarget = newRocketPos.clone().add(upDir.multiplyScalar(0.4*SCALE));
      this.renderer.controls.target.copy(centerTarget);
      this.renderer.camera.position.add(posDiff);

      // Camera shake
      if (this._cameraShaking > 0) {
        this._cameraShaking -= delta*1.5;
        const amt = this._cameraShaking*0.004;
        this.renderer.camera.position.add(new THREE.Vector3((Math.random()-0.5)*amt,(Math.random()-0.5)*amt,(Math.random()-0.5)*amt));
      }

      // W/S zoom
      if (this.renderer.keys) {
        const dist = this.renderer.camera.position.distanceTo(centerTarget);
        const zoomSpeed = dist*2.0*delta;
        if (this.renderer.keys.w && dist > 0.002) {
          const d = centerTarget.clone().sub(this.renderer.camera.position).normalize();
          this.renderer.camera.position.add(d.multiplyScalar(zoomSpeed));
        }
        if (this.renderer.keys.s && dist < 50) {
          const d = this.renderer.camera.position.clone().sub(centerTarget).normalize();
          this.renderer.camera.position.add(d.multiplyScalar(zoomSpeed));
        }
      }
      this.renderer.controls.update();
    }

    // ── HUD Telemetry ─────────────────────────────────────────────────────────
    if (this.active) {
      const vEl = document.getElementById('tel-vel');
      const aEl = document.getElementById('tel-alt');
      if (vEl) vEl.textContent = velocity.toFixed(2) + ' km/s';
      if (aEl) aEl.textContent = (altitude*60).toFixed(1) + ' km';
    }
  }
}
