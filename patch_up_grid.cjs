const fs = require('fs');

let code = fs.readFileSync('src/StarRenderer.js', 'utf-8');

// 1. Add GridHelper to Virtual Horizon
code = code.replace(
  `    this.virtualHorizon = new THREE.Mesh(geo, mat);
    this.virtualHorizon.visible = false;
    this.scene.add(this.virtualHorizon);`,
  `    this.virtualHorizon = new THREE.Mesh(geo, mat);
    this.virtualHorizon.visible = false;
    
    // Add a faint grid to the horizon so it feels like a surface
    const grid = new THREE.GridHelper(2000, 100, 0x00d4ff, 0x00d4ff);
    grid.material.opacity = 0.15;
    grid.material.transparent = true;
    grid.rotation.x = Math.PI / 2; // Align with PlaneGeometry
    this.virtualHorizon.add(grid);
    
    this.scene.add(this.virtualHorizon);`
);

// 2. Set Camera UP direction in teleportToSurface
code = code.replace(
  `    // Position camera slightly ABOVE the surface so it doesn't clip with the horizon plane
    this.camera.position.copy(surfacePos).add(upDir.multiplyScalar(0.05));

    // Setup Virtual Horizon Plane exactly at surfacePos
    this.virtualHorizon.position.copy(surfacePos);`,
  `    // Position camera slightly ABOVE the surface so it doesn't clip with the horizon plane
    this.camera.position.copy(surfacePos).add(upDir.multiplyScalar(0.05));

    // Fix the camera's UP direction so OrbitControls rotate naturally for the local surface
    this.camera.up.copy(upDir);

    // Setup Virtual Horizon Plane exactly at surfacePos
    this.virtualHorizon.position.copy(surfacePos);`
);

// 3. Reset Camera UP in resetView
code = code.replace(
  `  resetView() {
    this.isPlanetariumMode = false;
    this.isFlyMode = false;
    this.controls.minDistance = 5.5;`,
  `  resetView() {
    this.isPlanetariumMode = false;
    this.isFlyMode = false;
    this.camera.up.set(0, 1, 0); // Restore world UP
    this.controls.minDistance = 5.5;`
);

// 4. Also reset Camera UP in disableSpaceshipMode just in case
code = code.replace(
  `  disableSpaceshipMode() {
    this.isFlyMode = false;
    this.isPlanetariumMode = false;
    this.controls.enabled = true;`,
  `  disableSpaceshipMode() {
    this.isFlyMode = false;
    this.isPlanetariumMode = false;
    this.camera.up.set(0, 1, 0);
    this.controls.enabled = true;`
);

// 5. Ensure enableSpaceshipMode also has UP reset
code = code.replace(
  `  enableSpaceshipMode() {
    this.isFlyMode = true;
    this.isPlanetariumMode = false;
    this.controls.enabled = false;`,
  `  enableSpaceshipMode() {
    this.isFlyMode = true;
    this.isPlanetariumMode = false;
    this.camera.up.set(0, 1, 0);
    this.controls.enabled = false;`
);

fs.writeFileSync('src/StarRenderer.js', code, 'utf-8');
console.log('Fixed camera up and horizon visual');
