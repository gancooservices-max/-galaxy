import fs from 'fs';
let code = fs.readFileSync('src/MissionSimulator.js', 'utf8');

// 1. In _injectUI
code = code.replace(
  `<div class="hud-header">
        <h2><span class="hud-beacon"></span> ISRO Chandrayaan Flight Operations Control Center</h2>
        <span style="font-size: 11px; font-family: monospace; color: rgba(255,255,255,0.5);" id="hud-timer">T+ 00:00:00</span>
      </div>`,
  `<div class="hud-header">
        <h2><span class="hud-beacon"></span> ISRO Chandrayaan Flight Operations Control Center</h2>
        <div style="display: flex; gap: 10px; align-items: center;">
          <div id="cam-controls" style="display: flex; gap: 4px;">
            <button class="hud-btn sec" style="padding: 4px 8px; font-size: 9px;" id="cam-auto">Auto Cam</button>
            <button class="hud-btn sec" style="padding: 4px 8px; font-size: 9px;" id="cam-rocket">Rocket Cam</button>
            <button class="hud-btn sec" style="padding: 4px 8px; font-size: 9px;" id="cam-wide">Wide Cam</button>
          </div>
          <span style="font-size: 11px; font-family: monospace; color: rgba(255,255,255,0.5);" id="hud-timer">T+ 00:00:00</span>
        </div>
      </div>
      <div id="tli-minigame" style="display: none; width: 100%; height: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; position: relative; margin-top: 10px; overflow: hidden; box-shadow: inset 0 0 10px #000;">
        <div style="position: absolute; left: 45%; width: 10%; height: 100%; background: rgba(0, 255, 100, 0.4); border-left: 1px solid #0f0; border-right: 1px solid #0f0;"></div>
        <div id="tli-cursor" style="position: absolute; left: 0%; width: 4px; height: 100%; background: #fff; box-shadow: 0 0 8px #fff; z-index: 2;"></div>
      </div>`
);

code = code.replace(
  `document.getElementById('hud-btn-action').addEventListener('click', () => this._handleNextAction());`,
  `document.getElementById('hud-btn-action').addEventListener('click', () => this._handleNextAction());
    document.getElementById('cam-auto').addEventListener('click', () => { this.activeCameraMode = 'Auto'; this._playBeep(); });
    document.getElementById('cam-rocket').addEventListener('click', () => { this.activeCameraMode = 'Rocket'; this._playBeep(); });
    document.getElementById('cam-wide').addEventListener('click', () => { this.activeCameraMode = 'Wide'; this._playBeep(); });`
);

// 2. Stage separation logic and _handleNextAction modifications
code = code.replace(
  `// Orbit Burn click
      this.orbitStage++;`,
  `// Orbit Burn click
      this._playBeep();
      if (this.orbitStage === 0 && this.rocket && this.rocket.children.length >= 3) {
        // Separate boosters
        const b1 = this.rocket.children[1];
        const b2 = this.rocket.children[2];
        if (b1 && b2) {
          const clone1 = b1.clone();
          this.renderer.scene.add(clone1);
          b1.getWorldPosition(clone1.position);
          b1.getWorldQuaternion(clone1.quaternion);
          
          const clone2 = b2.clone();
          this.renderer.scene.add(clone2);
          b2.getWorldPosition(clone2.position);
          b2.getWorldQuaternion(clone2.quaternion);
          
          this.detachedBoosters.push({ mesh: clone1, vel: {x: -2, y: -4, z: 0} });
          this.detachedBoosters.push({ mesh: clone2, vel: {x: 2, y: -4, z: 0} });
          
          this.rocket.remove(b1);
          this.rocket.remove(b2);
          this._speakISRO("Booster separation confirmed. Core stage nominal.");
        }
      }
      this.orbitStage++;`
);

code = code.replace(
  `// Trans-Lunar Injection
      this.stage = 5;`,
  `// Trans-Lunar Injection
      this._playBeep();
      // Mini-game evaluation
      if (this.tliSliderValue > 40 && this.tliSliderValue < 60) {
        this.telemetry.status = 'TLI Burn perfect! Trajectory optimal.';
        this._speakISRO("Trans-Lunar Injection Burn nominal. Trajectory is perfect.");
      } else {
        this.telemetry.status = 'TLI Burn suboptimal. Fuel penalty applied.';
        this.telemetry.fuel -= 15.0;
        this._speakISRO("Warning. TLI Burn suboptimal. Trajectory correction required.");
      }
      const minigame = document.getElementById('tli-minigame');
      if(minigame) minigame.style.display = 'none';

      this.stage = 5;`
);

code = code.replace(
  `this._startThrusterSound();
      
      // Scaffolding clamp releases`,
  `this._startThrusterSound();
      this._speakISRO("Lift off normal. We have lift off of Chandrayaan.");
      
      // Scaffolding clamp releases`
);

code = code.replace(
  `actionBtn.textContent = '🌑Powered Descent';
      this.telemetry.status = 'Vikram lander separated. Trajectory locked for descent.';`,
  `actionBtn.textContent = '🌑Powered Descent';
      this.telemetry.status = 'Vikram lander separated. Trajectory locked for descent.';
      this._speakISRO("Vikram lander separation successful. Beginning powered descent.");`
);

code = code.replace(
  `// Landing Powered Descent
      this.stage = 7;
      this.timeInStage = 0.0;
      this._startThrusterSound();
      this.telemetry.fuel -= 18.0;
      actionBtn.textContent = 'Hold Status...';
      actionBtn.disabled = true;`,
  `// Landing Powered Descent
      this.stage = 7;
      this.timeInStage = 0.0;
      this._startThrusterSound();
      this.telemetry.fuel -= 18.0;
      actionBtn.textContent = 'Hold Status...';
      actionBtn.disabled = true;
      this._speakISRO("Touchdown confirmed. Vikram has landed. Awaiting rover deployment.");
      
      // Setup Rover
      if (this.lander) {
        this.rover = new THREE.Group();
        const rGeo = new THREE.BoxGeometry(0.1, 0.05, 0.15);
        const rMat = new THREE.MeshStandardMaterial({color: 0x888888, metalness: 0.8});
        const rMesh = new THREE.Mesh(rGeo, rMat);
        this.rover.add(rMesh);
        this.rover.position.copy(this.lander.position);
        this.rover.position.y -= 0.1; // ground level
        this.renderer.scene.add(this.rover);
      }`
);

// 3. Update() modifications
code = code.replace(
  `// ── Core Simulation Updates ─────────────────────────────────────────────────
  update(delta) {
    this.timeInStage += delta;`,
  `// ── Core Simulation Updates ─────────────────────────────────────────────────
  update(delta) {
    this.timeInStage += delta;

    // Animate detached boosters falling
    this.detachedBoosters.forEach((b) => {
      if (b.mesh) {
        b.vel.y -= delta * 5.0; // gravity
        b.mesh.position.x += b.vel.x * delta;
        b.mesh.position.y += b.vel.y * delta;
        b.mesh.rotation.x += delta * 0.5;
        b.mesh.rotation.z += delta * 0.5;
      }
    });

    // Animate TLI Mini-game cursor if active
    if (this.stage === 4 || (this.stage === 3 && this.orbitStage >= 3)) {
      const minigame = document.getElementById('tli-minigame');
      if(minigame) minigame.style.display = 'block';
      this.tliSliderValue += delta * 80 * this.tliSliderDir;
      if (this.tliSliderValue >= 100) { this.tliSliderValue = 100; this.tliSliderDir = -1; }
      if (this.tliSliderValue <= 0) { this.tliSliderValue = 0; this.tliSliderDir = 1; }
      const cursor = document.getElementById('tli-cursor');
      if (cursor) cursor.style.left = this.tliSliderValue + '%';
    } else {
      const minigame = document.getElementById('tli-minigame');
      if (minigame) minigame.style.display = 'none';
    }

    // Rover Drive Mode (Stage 7)
    if (this.stage === 7 && this.rover) {
      const speed = 0.5;
      const turnSpeed = 1.0;
      if (this.roverKeys.w) this.rover.translateZ(-speed * delta);
      if (this.roverKeys.s) this.rover.translateZ(speed * delta);
      if (this.roverKeys.a) this.rover.rotation.y += turnSpeed * delta;
      if (this.roverKeys.d) this.rover.rotation.y -= turnSpeed * delta;
    }`
);

// Add Trajectory Drawing logic in update()
code = code.replace(
  `// Orbit mechanics and transitions`,
  `// Orbit mechanics and transitions
    if (this.stage >= 3 && this.stage <= 5) {
      if (!this.trajectoryLine && this.rocket) {
        const mat = new THREE.LineBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.6 });
        const geo = new THREE.BufferGeometry();
        this.trajectoryLine = new THREE.Line(geo, mat);
        this.renderer.scene.add(this.trajectoryLine);
      }
      if (this.trajectoryLine && this.rocket && this.timeInStage % 0.1 < delta) {
        this.trackPoints.push(this.rocket.position.clone());
        if (this.trackPoints.length > 500) this.trackPoints.shift();
        this.trajectoryLine.geometry.setFromPoints(this.trackPoints);
      }
    }`
);

// Cleanup Trajectory Line in exit()
code = code.replace(
  `disposeObj(this.trackLines);`,
  `disposeObj(this.trackLines);
    if(this.trajectoryLine) {
      this.renderer.scene.remove(this.trajectoryLine);
      if(this.trajectoryLine.geometry) this.trajectoryLine.geometry.dispose();
      this.trajectoryLine = null;
    }`
);

// 4. Camera overrides
code = code.replace(
  `// Disable default OrbitControls manual panning/zooming locks so we script cameras seamlessly
    this.renderer.controls.enablePan = false;
    this.renderer.controls.enableZoom = false;`,
  `// Disable default OrbitControls manual panning/zooming locks so we script cameras seamlessly
    this.renderer.controls.enablePan = false;
    this.renderer.controls.enableZoom = false;

    // Apply manual camera mode overrides
    if (this.activeCameraMode === 'Rocket' && this.rocket) {
      this.renderer.controls.target.copy(this.rocket.position);
      const camOffset = new THREE.Vector3(1.0, 0.5, -2.0);
      this.renderer.camera.position.copy(this.rocket.position).add(camOffset);
      this.renderer.controls.update();
      return;
    }
    if (this.activeCameraMode === 'Wide') {
      const moonEntry = this.renderer.planetMeshes.find(pm => pm.data.id === 'Moon');
      const earthPos = this.renderer.earth.position;
      const moonPos = moonEntry.mesh.position;
      const centerPoint = earthPos.clone().add(moonPos).multiplyScalar(0.5);
      this.renderer.controls.target.copy(centerPoint);
      const earthToMoon = new THREE.Vector3().subVectors(moonPos, earthPos);
      const sideDir = new THREE.Vector3(0, 1, 0).cross(earthToMoon).normalize();
      const camPos = centerPoint.clone().addScaledVector(sideDir, 280.0).add(new THREE.Vector3(0, 40.0, 0));
      this.renderer.camera.position.copy(camPos);
      this.renderer.controls.update();
      return;
    }
    if (this.stage === 7 && this.rover) {
      this.activeCameraMode = 'Rover';
    }
    if (this.activeCameraMode === 'Rover' && this.rover) {
      this.renderer.controls.target.copy(this.rover.position);
      const backward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.rover.quaternion);
      const camOffset = backward.multiplyScalar(0.8).add(new THREE.Vector3(0, 0.4, 0));
      this.renderer.camera.position.copy(this.rover.position).add(camOffset);
      this.renderer.controls.update();
      return;
    }
    // End of manual overrides, fallback to auto (cinematic) logic below.
`
);

fs.writeFileSync('src/MissionSimulator.js', code);
console.log('Patch successfully applied!');
