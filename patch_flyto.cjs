const fs = require('fs');

let code = fs.readFileSync('src/StarRenderer.js', 'utf-8');

code = code.replace(
`  flyTo(targetPos, duration = 1800) {
    const startCam    = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    // Aim camera at star from a close distance
    const dir  = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z).normalize();
    const endCam = dir.clone().multiplyScalar(30);

    const startTime = performance.now();`,
`  flyTo(targetData, duration = 1800) {
    const startCam    = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    const pos = targetData.position || targetData;
    const targetVec = new THREE.Vector3(pos.x, pos.y, pos.z);
    
    let endCam;
    if (targetData.isPlanet) {
      // Fly close to the planet
      const size = targetData.size || 10;
      // offset towards the camera or origin
      const offsetDir = startCam.clone().sub(targetVec).normalize();
      if (offsetDir.lengthSq() === 0) offsetDir.set(0, 0, 1);
      endCam = targetVec.clone().add(offsetDir.multiplyScalar(size * 3));
    } else {
      // For stars (which are far away at 4,000,000 units), just look at them from near Earth
      const dir  = targetVec.clone().normalize();
      endCam = dir.clone().multiplyScalar(30);
    }

    const startTime = performance.now();`
);

code = code.replace(
`      this.controls.target.lerpVectors(
        startTarget,
        new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z),
        et,
      );`,
`      this.controls.target.lerpVectors(
        startTarget,
        targetVec,
        et,
      );`
);

fs.writeFileSync('src/StarRenderer.js', code, 'utf-8');

let mainCode = fs.readFileSync('src/main.js', 'utf-8');
mainCode = mainCode.replace(
`  // Search click / fly to
  ui.onStarClick = (star) => {
    renderer.selectStar(star);
    renderer.flyTo(star.position);`,
`  // Search click / fly to
  ui.onStarClick = (star) => {
    renderer.selectStar(star);
    renderer.flyTo(star);`
);

mainCode = mainCode.replace(
`  // Fly-to button in panel
  ui.onFlyTo = (star) => {
    renderer.flyTo(star.position);`,
`  // Fly-to button in panel
  ui.onFlyTo = (star) => {
    renderer.flyTo(star);`
);

mainCode = mainCode.replace(
`  // Panel fly btn
  ui.$panelFlyBtn.addEventListener('click', () => {
    if (ui.currentStar) renderer.flyTo(ui.currentStar.position);
  });`,
`  // Panel fly btn
  ui.$panelFlyBtn.addEventListener('click', () => {
    if (ui.currentStar) renderer.flyTo(ui.currentStar);
  });`
);

fs.writeFileSync('src/main.js', mainCode, 'utf-8');
console.log('flyTo patched');
