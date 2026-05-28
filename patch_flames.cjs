const fs = require('fs');
let lines = fs.readFileSync('src/MissionSimulator.js', 'utf8').split('\n');

const stage1ExhaustStart = lines.findIndex(l => l.includes('// Heavy dark exhaust smoke from engines'));
if (stage1ExhaustStart !== -1) {
  lines.splice(stage1ExhaustStart, 8, `      // Heavy dark exhaust smoke from all 3 engines
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
      spawnEngineExhaust(coreLocal, false);
      
      // Side Boosters (S200) - Huge exhaust!
      spawnEngineExhaust(leftLocal, true);
      spawnEngineExhaust(leftLocal, false);
      spawnEngineExhaust(leftLocal, false); // Extra fire
      
      spawnEngineExhaust(rightLocal, true);
      spawnEngineExhaust(rightLocal, false);
      spawnEngineExhaust(rightLocal, false); // Extra fire
      
      if(this.engineLight) this.engineLight.intensity = (this.timeInStage / 3.0) * 15.0;`);
}

const stage2ExhaustStart = lines.findIndex(l => l.includes('const exhaustWorldPos = new THREE.Vector3();'));
if (stage2ExhaustStart !== -1) {
  lines.splice(stage2ExhaustStart, 9, `      const worldDir = this.launchDir.clone().applyQuaternion(this.renderer.earth.quaternion);
      
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
      spawnEngineExhaust(coreLocal, false);
      
      // Side Boosters (S200) - Huge exhaust!
      spawnEngineExhaust(leftLocal, false);
      spawnEngineExhaust(leftLocal, false);
      
      spawnEngineExhaust(rightLocal, false);
      spawnEngineExhaust(rightLocal, false);

      if (this.timeInStage < 5.0) {
        spawnEngineExhaust(coreLocal, true);
        spawnEngineExhaust(leftLocal, true);
        spawnEngineExhaust(rightLocal, true);
      }
      
      if(this.engineLight) this.engineLight.intensity = 10.0 + Math.random() * 5.0;`);
}

fs.writeFileSync('src/MissionSimulator.js', lines.join('\n'));
