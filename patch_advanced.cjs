const fs = require('fs');

let code = fs.readFileSync('src/StarRenderer.js', 'utf-8');

// 1. Add _isShiftDown and Horizon mesh in _createControls or init
code = code.replace(
  `    this.isFlyMode = false;
    this.isPlanetariumMode = false;
  }`,
  `    this.isFlyMode = false;
    this.isPlanetariumMode = false;

    // Shift Key tracking for Hyperdrive
    this._isShiftDown = false;
    window.addEventListener('keydown', (e) => { if (e.key === 'Shift') this._isShiftDown = true; });
    window.addEventListener('keyup', (e) => { if (e.key === 'Shift') this._isShiftDown = false; });

    // Virtual Horizon for Planetarium Mode
    const geo = new THREE.PlaneGeometry(2000, 2000);
    const mat = new THREE.MeshBasicMaterial({ 
      color: 0x02050a, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    this.virtualHorizon = new THREE.Mesh(geo, mat);
    this.virtualHorizon.visible = false;
    this.scene.add(this.virtualHorizon);
  }`
);

// 2. Update Render Loop to apply Hyperdrive speed
code = code.replace(
  `      if (this.isFlyMode || this.isPlanetariumMode) {
        this.flyControls.update(delta);
      }`,
  `      if (this.isFlyMode) {
        this.flyControls.movementSpeed = this._isShiftDown ? 7500000 : 150000;
        this.flyControls.update(delta);
      } else if (this.isPlanetariumMode) {
        // In planetarium mode we use OrbitControls for panorama now
        this.controls.update();
      }`
);

// 3. Update enableSpaceshipMode
code = code.replace(
  `  enableSpaceshipMode() {
    this.isFlyMode = true;
    this.isPlanetariumMode = false;
    this.controls.enabled = false;
    this.flyControls.movementSpeed = 150000; 
    
    // Reset camera to orbit starting position if we were inside Earth
    if (this.camera.position.length() < 5) {
      this.camera.position.set(0, 0, 10);
    }`,
  `  enableSpaceshipMode() {
    this.isFlyMode = true;
    this.isPlanetariumMode = false;
    this.controls.enabled = false;
    this.flyControls.movementSpeed = 150000; 
    this.virtualHorizon.visible = false;
    
    // Reset camera to orbit starting position if we were inside Earth
    if (this.camera.position.length() < 5) {
      this.camera.position.set(0, 0, 10);
      this.camera.lookAt(0, 0, 100);
    }`
);

// 4. Update disableSpaceshipMode
code = code.replace(
  `  disableSpaceshipMode() {
    this.isFlyMode = false;
    this.isPlanetariumMode = false;
    this.controls.enabled = true;
    // ensure camera is not lost
    if (this.camera.position.length() < 5.5) {
      this.camera.position.set(0, 0, 10);
    }
    this.controls.target.set(0, 0, 0);
  }`,
  `  disableSpaceshipMode() {
    this.isFlyMode = false;
    this.isPlanetariumMode = false;
    this.controls.enabled = true;
    this.virtualHorizon.visible = false;
    this.controls.minDistance = 5.5;
    this.controls.maxDistance = 5000000;
    
    // ensure camera is not lost
    if (this.camera.position.length() < 5.5) {
      this.camera.position.set(0, 0, 10);
    }
    this.controls.target.set(0, 0, 0);
  }`
);

// 5. Update teleportToSurface
code = code.replace(
  `  teleportToSurface(lat, lon) {
    this.isPlanetariumMode = true;
    this.isFlyMode = false;
    this.controls.enabled = false;
    this.flyControls.movementSpeed = 0; // Disable movement, only look around

    // Force Earth to align with current IST so surface matches exactly
    const nowMs = Date.now();
    const offsetIST = 5.5 * 60 * 60 * 1000;
    const msInDay = 86400000;
    const timeOfDay = (nowMs + offsetIST) % msInDay;
    const rotationRatio = timeOfDay / msInDay;
    const currentEarthRotY = -(rotationRatio * Math.PI * 2) - Math.PI / 2;
    if (this.earth) this.earth.rotation.y = currentEarthRotY;

    // Calculate surface point in world coordinates
    const R = 4.05; // Slightly above Earth radius (4.0)
    
    // Adjust longitude by Earth's current rotation
    // Three.js rotation.y is counter-clockwise.
    // We add the rotation to the longitude.
    const rotDeg = currentEarthRotY * (180 / Math.PI);
    const finalLon = lon + rotDeg;

    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (finalLon + 180) * (Math.PI / 180);

    const x = -(R * Math.sin(phi) * Math.cos(theta));
    const z = (R * Math.sin(phi) * Math.sin(theta));
    const y = (R * Math.cos(phi));

    const surfacePos = new THREE.Vector3(x, y, z);
    this.camera.position.copy(surfacePos);

    // Look straight up into the sky from the surface
    const upDir = surfacePos.clone().normalize();
    const lookTarget = surfacePos.clone().add(upDir.multiplyScalar(100));
    this.camera.lookAt(lookTarget);
  }`,
  `  teleportToSurface(lat, lon) {
    this.isPlanetariumMode = true;
    this.isFlyMode = false;
    
    // We will use OrbitControls for a Panorama effect
    this.controls.enabled = true;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    // Set distances very small to simulate standing in place and looking around
    this.controls.minDistance = 0.01;
    this.controls.maxDistance = 0.01;

    // Force Earth to align with current IST so surface matches exactly
    const nowMs = Date.now();
    const offsetIST = 5.5 * 60 * 60 * 1000;
    const msInDay = 86400000;
    const timeOfDay = (nowMs + offsetIST) % msInDay;
    const rotationRatio = timeOfDay / msInDay;
    const currentEarthRotY = -(rotationRatio * Math.PI * 2) - Math.PI / 2;
    if (this.earth) this.earth.rotation.y = currentEarthRotY;

    // Calculate surface point
    const R = 4.05; 
    const rotDeg = currentEarthRotY * (180 / Math.PI);
    const finalLon = lon + rotDeg;

    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (finalLon + 180) * (Math.PI / 180);

    const x = -(R * Math.sin(phi) * Math.cos(theta));
    const z = (R * Math.sin(phi) * Math.sin(theta));
    const y = (R * Math.cos(phi));

    const surfacePos = new THREE.Vector3(x, y, z);
    
    // Position camera
    this.camera.position.copy(surfacePos);

    // Setup Virtual Horizon Plane
    const upDir = surfacePos.clone().normalize();
    this.virtualHorizon.position.copy(surfacePos);
    
    // The plane's normal is Z by default. We want it to face "upDir"
    const targetLook = surfacePos.clone().add(upDir);
    this.virtualHorizon.lookAt(targetLook);
    this.virtualHorizon.visible = true;

    // Look towards the horizon (South/North), slightly angled up (20 degrees)
    // Find a tangent vector (horizon direction)
    const worldUp = new THREE.Vector3(0, 1, 0);
    let right = new THREE.Vector3().crossVectors(worldUp, upDir).normalize();
    if (right.lengthSq() < 0.001) right = new THREE.Vector3(1, 0, 0);
    const forwardHorizon = new THREE.Vector3().crossVectors(upDir, right).normalize();

    // Blend forward with up to get a 20 degree elevation
    const viewDir = forwardHorizon.multiplyScalar(0.9).add(upDir.multiplyScalar(0.4)).normalize();
    
    const lookTarget = surfacePos.clone().add(viewDir.multiplyScalar(0.01));
    this.controls.target.copy(lookTarget);
    this.camera.lookAt(lookTarget);
    this.controls.update();
  }`
);

// 6. Restore controls settings in resetView if needed
code = code.replace(
  `  resetView() {
    this.camera.position.set(0, 0, 15);
    this.controls.target.set(0, 0, 0);`,
  `  resetView() {
    this.controls.minDistance = 5.5;
    this.controls.maxDistance = 5000000;
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.virtualHorizon.visible = false;
    this.camera.position.set(0, 0, 15);
    this.controls.target.set(0, 0, 0);`
);

fs.writeFileSync('src/StarRenderer.js', code, 'utf-8');
console.log('Advanced features patched');
