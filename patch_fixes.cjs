const fs = require('fs');

let code = fs.readFileSync('src/StarRenderer.js', 'utf-8');

// Fix 1: Camera position in Planetarium Mode (move slightly above horizon)
code = code.replace(
  `    const surfacePos = new THREE.Vector3(x, y, z);
    
    // Position camera
    this.camera.position.copy(surfacePos);

    // Setup Virtual Horizon Plane
    const upDir = surfacePos.clone().normalize();
    this.virtualHorizon.position.copy(surfacePos);`,
  `    const surfacePos = new THREE.Vector3(x, y, z);
    
    const upDir = surfacePos.clone().normalize();

    // Position camera slightly ABOVE the surface so it doesn't clip with the horizon plane
    this.camera.position.copy(surfacePos).add(upDir.multiplyScalar(0.05));

    // Setup Virtual Horizon Plane exactly at surfacePos
    this.virtualHorizon.position.copy(surfacePos);`
);

// Fix 2: Spaceship mode starting look direction (look at the Sun, not empty space)
code = code.replace(
  `    // Reset camera to orbit starting position if we were inside Earth
    if (this.camera.position.length() < 5) {
      this.camera.position.set(0, 0, 10);
      this.camera.lookAt(0, 0, 100);
    }`,
  `    // Reset camera to orbit starting position if we were inside Earth
    if (this.camera.position.length() < 5) {
      // Start spaceship a bit away, looking AT the Sun (origin)
      this.camera.position.set(0, 10, 100);
      this.camera.lookAt(0, 0, 0);
    }`
);

fs.writeFileSync('src/StarRenderer.js', code, 'utf-8');
console.log('Fixed Planetarium and Spaceship issues');
