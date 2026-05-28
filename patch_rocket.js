import fs from 'fs';
let code = fs.readFileSync('src/MissionSimulator.js', 'utf8');

// 1. Sriharikota vector logic and Realistic Rocket Design
const buildSceneOld = /_buildMissionScene\(\) \{[\s\S]*?\}/;
const buildSceneNew = \`_buildMissionScene() {
    if (!this.renderer.earth) return;
    const earthPos = this.renderer.earth.position;

    // Sriharikota Lat 13.7N, Lon 80.2E
    const lat = 13.7 * (Math.PI / 180);
    const lon = 80.2 * (Math.PI / 180);
    
    // Normal vector from center of earth to Sriharikota surface
    this.launchDir = new THREE.Vector3(
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
      Math.cos(lat) * Math.cos(lon)
    ).normalize();

    // Procedural Rocket Construction (LVM3 Style)
    this.rocket = new THREE.Group();
    
    // Core Stage (White)
    const coreGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 16);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.25;
    this.rocket.add(core);

    // Upper Stage (Dark Grey)
    const upperGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.2, 16);
    const upperMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    const upper = new THREE.Mesh(upperGeo, upperMat);
    upper.position.y = 0.6;
    this.rocket.add(upper);

    // Nose Cone (White)
    const noseGeo = new THREE.ConeGeometry(0.045, 0.15, 16);
    const nose = new THREE.Mesh(noseGeo, coreMat);
    nose.position.y = 0.775;
    this.rocket.add(nose);

    // Two Solid Rocket Boosters (White with grey nose)
    for(let i=0; i<2; i++) {
      const booster = new THREE.Group();
      
      const bCoreGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 12);
      const bCore = new THREE.Mesh(bCoreGeo, coreMat);
      bCore.position.y = 0.225;
      booster.add(bCore);
      
      const bNoseGeo = new THREE.ConeGeometry(0.025, 0.08, 12);
      const bNoseMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
      const bNose = new THREE.Mesh(bNoseGeo, bNoseMat);
      bNose.position.y = 0.49;
      booster.add(bNose);
      
      booster.position.x = i === 0 ? 0.055 : -0.055;
      booster.position.y = 0.05;
      this.rocket.add(booster);
    }

    // Position rocket at Sriharikota
    this.rocket.position.copy(earthPos).addScaledVector(this.launchDir, this.earthRadius);
    
    // Rotate rocket to stand up relative to the planet surface
    this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.launchDir);
    
    this.renderer.scene.add(this.rocket);

    // Setup Camera Tracking
    if (this.renderer.controls) {
      this.renderer.controls.target.copy(this.rocket.position);
      // Let user zoom in/out, but restrict pan if desired (we'll leave pan on for freedom)
      this.renderer.controls.enableZoom = true;
      this.renderer.controls.minDistance = 0.1;
      this.renderer.controls.maxDistance = 50;
      
      // Move camera close to rocket for launch view
      const camOffset = this.launchDir.clone().multiplyScalar(0.2).add(new THREE.Vector3(0.3, 0.1, 0.3));
      this.renderer.camera.position.copy(this.rocket.position).add(camOffset);
      this.renderer.controls.update();
    }
  }\`;
code = code.replace(buildSceneOld, buildSceneNew);

// 2. Update logic to ascend along normal vector
const updateOld = /update\(delta\) \{[\s\S]*?\}\n\}/;
const updateNew = \`update(delta) {
    this.timeInStage += delta;

    const moonEntry = this.renderer.planetMeshes ? this.renderer.planetMeshes.find(pm => pm.data.id === 'Moon') : null;
    if (!this.renderer.earth || !moonEntry || !this.rocket) return;

    const earthPos = this.renderer.earth.position;
    const moonPos = moonEntry.mesh.position;

    if (this.stage === 2) {
      // Ascend along Sriharikota launch normal
      this.rocket.position.addScaledVector(this.launchDir, delta * 0.8);
      
      // Update camera target so it follows the rocket while allowing zoom
      if (this.renderer.controls) {
        this.renderer.controls.target.copy(this.rocket.position);
        this.renderer.controls.update();
      }
    } else if (this.stage === 3) {
      // Transfer to moon
      const dir = new THREE.Vector3().subVectors(moonPos, this.rocket.position).normalize();
      this.rocket.position.addScaledVector(dir, delta * 15.0);
      
      // Rotate rocket towards velocity direction
      this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      if (this.renderer.controls) {
        this.renderer.controls.target.copy(this.rocket.position);
        this.renderer.controls.update();
      }
    } else if (this.stage === 4) {
      // Orbit Moon
      this.rocket.position.copy(moonPos);
      this.rocket.position.addScaledVector(new THREE.Vector3(1, 0, 0), 4.5); // Start at offset
      
      // Orbit rotation logic
      const speed = delta * 0.5;
      const angle = this.timeInStage * speed;
      const rx = Math.cos(angle) * 4.5;
      const rz = Math.sin(angle) * 4.5;
      
      this.rocket.position.set(moonPos.x + rx, moonPos.y, moonPos.z + rz);
      
      // Tangent direction
      const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
      this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);

      if (this.renderer.controls) {
        this.renderer.controls.target.copy(this.rocket.position);
        this.renderer.controls.update();
      }
    }
  }
}\`;
code = code.replace(updateOld, updateNew);

fs.writeFileSync('src/MissionSimulator.js', code);
console.log('Patch applied successfully.');
