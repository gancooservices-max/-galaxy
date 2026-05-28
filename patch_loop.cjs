const fs = require('fs');

let c = fs.readFileSync('src/StarRenderer.js', 'utf8');

const bhLogic = `
      // --- BLACK HOLE LOGIC ---
      let timeScale = 1.0;
      if (this.blackHole) {
        this.blackHole.update(delta);
        
        if (this.lensingPass) {
          const bhPos = this.blackHole.group.position.clone();
          const distanceToBh = this.camera.position.distanceTo(bhPos);
          
          bhPos.project(this.camera);
          const screenX = (bhPos.x + 1) / 2;
          const screenY = (bhPos.y + 1) / 2;
          
          this.lensingPass.uniforms.bhScreenPos.value.set(screenX, screenY);
          this.lensingPass.uniforms.aspectRatio.value = window.innerWidth / window.innerHeight;
          
          const fov = this.camera.fov * (Math.PI / 180);
          // Scale it correctly
          const projectedRadius = (this.blackHole.radius / (distanceToBh * Math.tan(fov / 2))) / 2.0;
          this.lensingPass.uniforms.bhRadius.value = projectedRadius;
          
          let danger = 0.0;
          if (distanceToBh < 2000) {
            danger = Math.pow((2000 - distanceToBh) / 1900, 2.0); // 0 at 2000, 1 at 100
          }
          
          if (bhPos.z < 1.0 && danger > 0.0) {
            this.lensingPass.uniforms.distortionStrength.value = danger;
            this.lensingPass.uniforms.chromaticAberration.value = danger * 2.0;
            
            timeScale = Math.max(0.01, 1.0 - danger * 0.9);
            
            if (this.controls) {
               this.controls.target.lerp(this.blackHole.group.position, danger * 0.02);
               this.camera.position.lerp(this.blackHole.group.position, danger * 0.005); // Drifting
               if (danger > 0.1) {
                 this.camera.position.x += (Math.random() - 0.5) * danger * 2.0;
                 this.camera.position.y += (Math.random() - 0.5) * danger * 2.0;
               }
            }
            
            if (this.bhAudio) {
               this.bhAudio.setPlaybackRate(timeScale);
               this.bhAudio.setVolume(Math.min(1.0, danger * 2.0));
            }
            
            if (distanceToBh < this.blackHole.radius * 1.1) {
                const screen = document.getElementById('blackhole-death');
                if (screen) screen.style.opacity = '1';
            } else {
                const screen = document.getElementById('blackhole-death');
                if (screen) screen.style.opacity = '0';
            }
          } else {
            this.lensingPass.uniforms.distortionStrength.value = 0.0;
            if (this.bhAudio) this.bhAudio.setVolume(0);
          }
        }
      }
      let realDelta = delta * timeScale; // Apply time dilation to everything else
`;

c = c.replace('const delta = Math.min(0.05, this.clock.getDelta());', 'const delta = Math.min(0.05, this.clock.getDelta());\n' + bhLogic);

// Then I need to replace references to `delta` with `realDelta` for the rest of the loop?
// Actually, it's safer to just redefine `delta` if it was `let`, but it is `const`.
// So let's replace `const delta` with `let delta` and then do `delta *= timeScale`.

c = c.replace('const delta = Math.min(0.05, this.clock.getDelta());', 'let delta = Math.min(0.05, this.clock.getDelta());');
c = c.replace('let realDelta = delta * timeScale; // Apply time dilation to everything else', 'delta *= timeScale;');

fs.writeFileSync('src/StarRenderer.js', c);
