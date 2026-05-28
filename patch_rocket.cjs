const fs = require('fs');
let lines = fs.readFileSync('src/MissionSimulator.js', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('// Core Stage (White Metallic)'));
const end = lines.findIndex(l => l.includes('// Force matrix update so getWorldPosition returns correct values immediately'));

if (start !== -1 && end !== -1) {
  const replacement = `    // Materials
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.4, roughness: 0.6 }); // L110 Liquid Core (Greyish)
    const boosterMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.8 }); // S200 Solid Boosters (White)
    const upperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.5 }); // C25 Upper Stage & Fairing
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.3 }); // Engine Nozzles / Interstage

    // Core Stage (L110)
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 32), coreMat);
    core.position.y = 0.2;
    this.rocket.add(core);

    // Twin Core Engine Nozzles (Vikas engines)
    for(let i=0; i<2; i++) {
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 16, 1, true), darkMat);
      nozzle.position.set(i===0? 0.015 : -0.015, -0.02, 0);
      nozzle.rotation.x = Math.PI;
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
    this.engineLight = new THREE.PointLight(0xffaa00, 0, 50 * SCALE);
    this.engineLight.position.y = -0.1 * SCALE;
    this.rocket.add(this.engineLight);

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
`;
  lines.splice(start, end - start, replacement);
  fs.writeFileSync('src/MissionSimulator.js', lines.join('\n'));
} else {
  console.log('Lines not found');
}
