const fs = require('fs');

let code = fs.readFileSync('src/StarRenderer.js', 'utf-8');

// 1. Import FlyControls
code = code.replace(
  `import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';`,
  `import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';`
);

// 2. Initialize FlyControls
code = code.replace(
  `  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping      = true;
    this.controls.dampingFactor      = 0.05;
    this.controls.enablePan          = false;
    this.controls.minDistance        = 5.5;
    this.controls.maxDistance        = 5000000;
    this.controls.autoRotateSpeed    = 0.5;
    this.autoRotate                  = true;
    this.controls.autoRotate         = true;
  }`,
  `  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping      = true;
    this.controls.dampingFactor      = 0.05;
    this.controls.enablePan          = false;
    this.controls.minDistance        = 5.5;
    this.controls.maxDistance        = 5000000;
    this.controls.autoRotateSpeed    = 0.5;
    this.autoRotate                  = true;
    this.controls.autoRotate         = true;

    this.flyControls = new FlyControls(this.camera, this.renderer.domElement);
    this.flyControls.movementSpeed = 150000; // 1.5 AU per second
    this.flyControls.rollSpeed = Math.PI / 4;
    this.flyControls.autoForward = false;
    this.flyControls.dragToLook = true;
    this.isFlyMode = false;
    this.isPlanetariumMode = false;
  }`
);

// 3. Update Render Loop for FlyControls
code = code.replace(
  `      this.controls.update(delta);
      this.renderer.render(this.scene, this.camera);`,
  `      if (this.isFlyMode || this.isPlanetariumMode) {
        this.flyControls.update(delta);
      } else {
        this.controls.update();
      }
      this.renderer.render(this.scene, this.camera);`
);

// 4. Add new feature methods
const newMethods = `
  enableSpaceshipMode() {
    this.isFlyMode = true;
    this.isPlanetariumMode = false;
    this.controls.enabled = false;
    this.flyControls.movementSpeed = 150000; 
    
    // Reset camera to orbit starting position if we were inside Earth
    if (this.camera.position.length() < 5) {
      this.camera.position.set(0, 0, 10);
    }
  }

  disableSpaceshipMode() {
    this.isFlyMode = false;
    this.isPlanetariumMode = false;
    this.controls.enabled = true;
    // ensure camera is not lost
    if (this.camera.position.length() < 5.5) {
      this.camera.position.set(0, 0, 10);
    }
    this.controls.target.set(0, 0, 0);
  }

  teleportToSurface(lat, lon) {
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
  }
`;

// Insert the methods before _addResizeListener
code = code.replace(
  `  _addResizeListener() {`,
  newMethods + `\n  _addResizeListener() {`
);

fs.writeFileSync('src/StarRenderer.js', code, 'utf-8');
console.log('StarRenderer patched for Spaceship & Map features.');
