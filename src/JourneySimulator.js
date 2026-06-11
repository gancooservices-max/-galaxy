import * as THREE from 'three';

export class JourneySimulator {
  constructor(renderer, uiLayerId = 'journey-ui-layer') {
    this.renderer = renderer;
    this.$uiLayer = document.getElementById(uiLayerId);
    this.active = false;
    this.targetStar = null;
    
    if (!this.$uiLayer) {
      this.$uiLayer = document.createElement('div');
      this.$uiLayer.id = uiLayerId;
      document.body.appendChild(this.$uiLayer);
    }
  }

  buildCockpitUI() {
    if (!this.$uiLayer) return;
    this.$uiLayer.innerHTML = `
      <div class="cockpit-overlay" id="j-cockpit">
        <div class="cockpit-top-frame">
          <div class="cockpit-title">INTERSTELLAR FLIGHT SYSTEM</div>
          <div class="cockpit-status-bar">SCENE-8 PROTOCOL ACTIVE</div>
        </div>
        
        <div class="cockpit-middle">
          <div class="cockpit-side-panel left">
            <div class="hud-box">
              <div class="hud-title">Navigation System</div>
              <div class="hud-value" id="nav-target">AWAITING LOCK</div>
            </div>
            <div class="hud-box">
              <div class="hud-title">Distance</div>
              <div class="hud-value" id="nav-dist">---</div>
            </div>
            <div class="hud-box">
              <div class="hud-title">Current Speed</div>
              <div class="hud-value highlight" id="nav-speed">0.00c</div>
            </div>
          </div>
          
          <div class="hud-reticle" id="j-reticle"></div>
          
          <div class="cockpit-side-panel right">
            <div class="hud-box">
              <div class="hud-title">Mission Dashboard</div>
              <div class="hud-value" id="mission-status">PRE-LAUNCH</div>
            </div>
            <div class="hud-box" id="j-holo-fact" style="opacity:0; transition: opacity 1s;">
              <div class="hud-title">AI Analysis</div>
              <div class="hud-value" id="holo-fact-text" style="font-size:12px; font-weight:normal;">Scanning...</div>
            </div>
          </div>
        </div>

        <!-- AI Voice Subtitles -->
        <div class="ai-voice-box">
          <div class="ai-waveform" id="ai-wave" style="opacity: 0;">
            <div class="ai-bar"></div><div class="ai-bar"></div><div class="ai-bar"></div><div class="ai-bar"></div><div class="ai-bar"></div>
          </div>
          <div class="ai-text" id="ai-text"></div>
        </div>

        <div class="cockpit-bottom-dash">
          <div class="cockpit-panel">
            <div class="cockpit-panel-title">SYSTEM STATUS</div>
            <div class="cockpit-panel-value" style="color: #4ade80;">NOMINAL</div>
          </div>
          <div class="cockpit-panel">
            <div class="cockpit-panel-title">WARP DRIVE</div>
            <div class="cockpit-panel-value" id="j-warp-status">STANDBY</div>
          </div>
        </div>
      </div>
      <div id="j-dynamic-ui" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;"></div>
    `;
    this.$uiLayer.classList.remove('journey-hidden');
  }

  async playAI(text, duration) {
    const $text = document.getElementById('ai-text');
    const $wave = document.getElementById('ai-wave');
    if ($text && $wave) {
      $wave.style.opacity = 1;
      $text.innerText = text;
      $text.style.animation = 'none';
      void $text.offsetWidth; 
      $text.style.animation = 'j-fadeIn 0.5s ease-out forwards';
      await this.sleep(duration);
      $wave.style.opacity = 0;
      $text.innerText = "";
    } else {
      await this.sleep(duration);
    }
  }

  hideUI() {
    const cockpit = document.getElementById('j-cockpit');
    if (cockpit) {
      cockpit.style.opacity = '0';
      cockpit.style.transition = 'opacity 2s';
      setTimeout(() => {
        if (cockpit.parentNode) cockpit.parentNode.removeChild(cockpit);
      }, 2000);
    }
  }

  async startJourney(targetStar) {
    if (this.active) return;
    this.active = true;
    this.targetStar = targetStar;
    this.buildCockpitUI();
    
    console.log("▶️ SCENE 1: SPACECRAFT COCKPIT");
    
    // Hide all original solar system objects robustly
    this.renderer._clearActiveStarSystem();
    if (this.renderer._sunGlow) {
      this._originalSunScale = this.renderer._sunGlow.scale.clone();
      this.renderer._sunGlow.scale.set(0,0,0);
    }
    this._originalPlanetScales = new Map();
    if (this.renderer.planetMeshes) {
      this.renderer.planetMeshes.forEach(pm => {
        if (pm.mesh) {
          this._originalPlanetScales.set(pm.data.id, pm.mesh.scale.clone());
          pm.mesh.scale.set(0,0,0);
        }
      });
    }

    // Hide static background stars for true motion illusion
    if (this.renderer.skyGroup) {
      this.renderer.skyGroup.visible = false;
    }

    const elsToHide = ['app-header', 'bottom-controls', 'btn-toggle-features', 'corner-menubar', 'time-controller', 'side-panel', 'immersive-ui-container'];
    elsToHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    document.body.classList.add('is-immersive-view');
    
    // Create Proxies array
    this.proxies = [];
    this.warpTunnel = null;
    this.starStreamer = null;

    try {
      await this.sceneCockpit();
      await this.sceneLaunch();
      await this.sceneSolarSystem();
      await this.sceneLightspeedJump();
      await this.sceneDeepSpace();
      await this.sceneDestination();
      await this.sceneStarReveal();
      await this.sceneArrivalCeremony();
    } catch (e) {
      console.error("Journey failed:", e);
    }

    this.active = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  createCinematicPlanet(size, texPath, pos) {
    const texLoader = new THREE.TextureLoader();
    const geo = new THREE.SphereGeometry(size, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      map: texLoader.load(texPath),
      roughness: 0.8,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.renderer.scene.add(mesh);
    this.proxies.push(mesh);
    return mesh;
  }

  createWormhole() {
    const texLoader = new THREE.TextureLoader();
    // We use neptune's blue texture as a base for cosmic clouds, and sun for fiery plasma
    const texBlue = texLoader.load('/textures/neptune.png');
    texBlue.wrapS = THREE.RepeatWrapping;
    texBlue.wrapT = THREE.RepeatWrapping;
    texBlue.repeat.set(2, 10);
    
    const geo = new THREE.CylinderGeometry(200, 200, 4000, 32, 1, true);
    geo.rotateX(Math.PI / 2); // Align with Z axis
    
    const mat = new THREE.MeshBasicMaterial({
      map: texBlue,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.warpTunnel = new THREE.Mesh(geo, mat);
    this.renderer.scene.add(this.warpTunnel);
  }

  createStarStreamer() {
    this.starCount = 10000;
    const geo = new THREE.BufferGeometry();
    this.starPos = new Float32Array(this.starCount * 6); // 2 vertices per line (start and end)
    for(let i=0; i<this.starCount; i++) {
       const x = (Math.random() - 0.5) * 20000;
       const y = (Math.random() - 0.5) * 20000;
       const z = -Math.random() * 80000;
       
       this.starPos[i*6]   = x;
       this.starPos[i*6+1] = y;
       this.starPos[i*6+2] = z;
       this.starPos[i*6+3] = x;
       this.starPos[i*6+4] = y;
       this.starPos[i*6+5] = z + 10; // initial short length
    }
    geo.setAttribute('position', new THREE.BufferAttribute(this.starPos, 3));
    
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.starStreamer = new THREE.LineSegments(geo, mat);
    this.renderer.scene.add(this.starStreamer);
  }

  updateStarStreamer(speed) {
    if (!this.starStreamer) return;
    const positions = this.starStreamer.geometry.attributes.position.array;
    // Streak length is directly proportional to speed (motion blur)
    const streakLength = speed * 1.5; 

    for(let i=0; i<this.starCount; i++) {
       // Move both start and end points towards camera
       positions[i*6+2] += speed; 
       positions[i*6+5] = positions[i*6+2] + streakLength;

       // If passed behind camera, respawn far ahead
       if (positions[i*6+2] > 2000) { 
           const newZ = -80000 - Math.random() * 20000;
           positions[i*6+2] = newZ;
           positions[i*6+5] = newZ + streakLength;
           
           const newX = (Math.random() - 0.5) * 20000;
           const newY = (Math.random() - 0.5) * 20000;
           positions[i*6]   = newX;
           positions[i*6+1] = newY;
           positions[i*6+3] = newX;
           positions[i*6+4] = newY;
       }
    }
    this.starStreamer.geometry.attributes.position.needsUpdate = true;
    
    // Ensure streamer stays centered on camera
    this.starStreamer.position.copy(this.renderer.camera.position);
    this.starStreamer.quaternion.copy(this.renderer.camera.quaternion);
  }

  async sceneCockpit() {
    // SCENE 1: SPACECRAFT COCKPIT
    // Setup Earth proxy directly outside the window
    this.earthProxy = this.createCinematicPlanet(1000, '/textures/earth_color.jpg', new THREE.Vector3(0, -1050, -500));
    
    // Sunlight
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    this.sunLight.position.set(5000, 1000, 0);
    this.renderer.scene.add(this.sunLight);
    this.proxies.push(this.sunLight);
    
    this.renderer.camera.position.set(0, 0, 0);
    if (this.renderer.controls) {
      this.renderer.controls.target.set(0, 0, -2000);
      this.renderer.controls.update();
    }

    const distLY = (this.targetStar.dist || (Math.random() * 1000 + 100)).toFixed(2);
    document.getElementById('nav-target').innerText = this.targetStar.name || 'Star ' + this.targetStar.id;
    document.getElementById('nav-dist').innerText = distLY + " LY";

    await this.playAI("Welcome aboard, Explorer.", 2500);
    await this.playAI("Your destination has been locked.", 2500);
    await this.playAI("Preparing for departure.", 2500);
  }

  async sceneLaunch() {
    // SCENE 2: LAUNCH
    document.getElementById('mission-status').innerText = "LAUNCHING";
    
    await this.playAI("3...", 1000);
    await this.playAI("2...", 1000);
    await this.playAI("1...", 1000);
    
    const cockpit = document.getElementById('j-cockpit');
    if (cockpit) cockpit.classList.add('cockpit-shake');
    
    await this.playAI("ENGINES IGNITED", 2000);
    
    document.getElementById('nav-speed').innerText = "Sub-light Acceleration";
    document.getElementById('nav-speed').classList.add('highlight');
  }

  async sceneSolarSystem() {
    // SCENE 3: SOLAR SYSTEM JOURNEY
    document.getElementById('mission-status').innerText = "SYSTEM TRANSIT";
    const cockpit = document.getElementById('j-cockpit');
    if (cockpit) cockpit.classList.remove('cockpit-shake');

    // Create planetary line up (using .png so they don't break as black spheres!)
    this.createCinematicPlanet(500, '/textures/mars.png', new THREE.Vector3(1500, 0, -10000));
    this.createCinematicPlanet(3000, '/textures/jupiter.png', new THREE.Vector3(-4000, 1000, -25000));
    this.createCinematicPlanet(2500, '/textures/saturn.png', new THREE.Vector3(4000, -500, -40000));
    this.createCinematicPlanet(1200, '/textures/neptune.png', new THREE.Vector3(-2000, 500, -55000));

    // Initialize streaming stars to give a true sense of travel
    this.createStarStreamer();

    // Fly camera from Earth to deep space edge
    const startCam = this.renderer.camera.position.clone();
    const endCam = new THREE.Vector3(0, 0, -60000);
    const startTarget = this.renderer.controls.target.clone();
    const endTarget = new THREE.Vector3(0, 0, -65000);

    const duration = 12000;
    const startTime = performance.now();
    
    // We will trigger AI voice asynchronously at specific times during the flight
    setTimeout(() => this.playAI("Leaving Earth orbit...", 2000), 2000);
    setTimeout(() => this.playAI("Accelerating to deep space...", 2500), 7000);

    const anim = (now) => {
      if (!this.active) return;
      const t = Math.min(1, (now - startTime) / duration);
      const et = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this.renderer.camera.position.lerpVectors(startCam, endCam, et);
      this.renderer.controls.target.lerpVectors(startTarget, endTarget, et);
      this.renderer.controls.update();
      
      // Move stars past the window and stretch them based on speed (motion blur!)
      const travelSpeed = 300 + (t * 800); // speed increases over time
      this.updateStarStreamer(travelSpeed);
      
      // Update UI speed
      if (t < 0.5) document.getElementById('nav-speed').innerText = "0.01c";
      else if (t < 0.8) document.getElementById('nav-speed').innerText = "0.15c";
      else document.getElementById('nav-speed').innerText = "0.99c";

      if (t < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);

    await this.sleep(duration);
  }

  async sceneLightspeedJump() {
    // SCENE 4: LIGHTSPEED JUMP
    document.getElementById('mission-status').innerText = "WARP JUMP";
    await this.playAI("Interstellar jump sequence initiated.", 3000);

    const cockpit = document.getElementById('j-cockpit');
    if (cockpit) {
      cockpit.classList.add('cockpit-dimmed');
      cockpit.classList.add('cockpit-shake-heavy');
    }
    
    document.getElementById('j-warp-status').innerText = "ENGAGED";
    document.getElementById('j-warp-status').style.color = "#a855f7";
    document.getElementById('nav-speed').innerText = "LIGHTSPEED";

    // Flash effect
    const dynUI = document.getElementById('j-dynamic-ui');
    if (dynUI) {
      dynUI.innerHTML = `<div class="warp-flash warp-flash-active"></div>`;
    }

    // Create the highly realistic cinematic wormhole tunnel
    this.createWormhole();
    
    this.startFov = this.renderer.camera.fov;
    this.targetFov = 110; // Epic but not too distorted
    
    // Clean up proxies to avoid clipping during warp
    this.proxies.forEach(p => this.renderer.scene.remove(p));
    this.proxies = [];
    
    // Calculate world pos of target star
    let worldPos = null;
    const targetVec = new THREE.Vector3(this.targetStar.x || 0, this.targetStar.y || 0, this.targetStar.z || 0);
    if (this.renderer.skyGroup) {
      worldPos = targetVec.clone();
      this.renderer.skyGroup.updateMatrixWorld();
      worldPos.applyMatrix4(this.renderer.skyGroup.matrixWorld);
    } else {
      // For massive distant stars, FORCE worldPos to (0,0,0) to prevent WebGL float32 precision breakdown!
      // If we jump to 4.5 million units, the 3D star's vertices collapse due to math errors.
      worldPos = new THREE.Vector3(0,0,0);
    }

    this.startCam = this.renderer.camera.position.clone();
    this.startTarget = this.renderer.controls.target.clone();
    this.endCam = worldPos.clone().add(new THREE.Vector3(0, 0, 150));
    this.endTarget = worldPos.clone();
    this.warpStartTime = performance.now();
    this.warpDuration = 10000;

    const animWarp = (now) => {
      if (!this.active) return;
      const t = Math.min(1, (now - this.warpStartTime) / this.warpDuration);
      const et = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this.renderer.camera.position.lerpVectors(this.startCam, this.endCam, et);
      this.renderer.controls.target.lerpVectors(this.startTarget, this.endTarget, et);
      
      // Move stars incredibly fast, turning them into massive warp streaks!
      this.updateStarStreamer(6000);

      // Update realistic wormhole position to always encompass the camera
      if (this.warpTunnel) {
        this.warpTunnel.position.copy(this.renderer.camera.position);
        this.warpTunnel.position.add(new THREE.Vector3(0, 0, -1000)); // offset slightly forward
        // Look at target to align tunnel
        this.warpTunnel.lookAt(this.endTarget);
        // Animate the texture rushing past
        this.warpTunnel.material.map.offset.y -= 0.05;
        this.warpTunnel.rotation.z += 0.01; // Spin the tunnel
        
        // Fade out at the end
        if (t > 0.8) {
          this.warpTunnel.material.opacity = 0.6 * (1 - ((t - 0.8) / 0.2));
        }
      }

      if (t < 0.2) {
        this.renderer.camera.fov = this.startFov + (this.targetFov - this.startFov) * (t / 0.2);
      } else if (t > 0.8) {
        this.renderer.camera.fov = this.targetFov - (this.targetFov - this.startFov) * ((t - 0.8) / 0.2);
      } else {
        this.renderer.camera.fov = this.targetFov;
      }
      this.renderer.camera.updateProjectionMatrix();
      this.renderer.controls.update();

      if (t < 1) requestAnimationFrame(animWarp);
    };
    requestAnimationFrame(animWarp);
  }

  async sceneDeepSpace() {
    // SCENE 5: DEEP SPACE
    // We are warping right now!
    const hFact = document.getElementById('j-holo-fact');
    const hText = document.getElementById('holo-fact-text');
    
    if (hFact) hFact.style.opacity = '1';
    
    await this.sleep(2000);
    if (hText) hText.innerText = "Passing through Galactic Clouds...";
    await this.sleep(3000);
    if (hText) hText.innerText = "Analyzing binary star systems ahead.";
    await this.sleep(3000);
    
    if (hFact) hFact.style.opacity = '0';
  }

  async sceneDestination() {
    // SCENE 6: DESTINATION DETECTED
    document.getElementById('j-warp-status').innerText = "DISENGAGED";
    document.getElementById('j-warp-status').style.color = "#94a3b8";
    document.getElementById('nav-speed').innerText = "Sub-light Approach";
    document.getElementById('mission-status').innerText = "ARRIVED";

    // Clean up wormhole & streaming stars
    if (this.warpTunnel) {
      this.renderer.scene.remove(this.warpTunnel);
      this.warpTunnel.material.map.dispose();
      this.warpTunnel.geometry.dispose();
      this.warpTunnel.material.dispose();
      this.warpTunnel = null;
    }
    if (this.starStreamer) {
      this.renderer.scene.remove(this.starStreamer);
      this.starStreamer.geometry.dispose();
      this.starStreamer.material.dispose();
      this.starStreamer = null;
    }

    this.renderer.camera.fov = 60;
    this.renderer.camera.updateProjectionMatrix();

    const isPlanet = this.targetStar.isPlanet || this.targetStar.isSatellite || this.targetStar.id === 'Sun' || this.targetStar.name === 'Sun' || this.targetStar.body !== undefined;

    // 1. Restore all solar system objects robustly BEFORE the approach, so if we are flying to a planet/Sun, it is visible!
    if (this.renderer._sunGlow && this._originalSunScale) {
      this.renderer._sunGlow.scale.copy(this._originalSunScale);
      this.renderer._sunGlow.visible = true; // explicitly ensure visible
    }
    if (this.renderer.planetMeshes && this._originalPlanetScales) {
      this.renderer.planetMeshes.forEach(pm => {
        if (pm.mesh && this._originalPlanetScales.has(pm.data.id)) {
          pm.mesh.scale.copy(this._originalPlanetScales.get(pm.data.id));
          pm.mesh.visible = true; // explicitly ensure visible
        }
      });
    }

    // 2. Compute precise world position and final distance for the target
    let worldPos = new THREE.Vector3(0,0,0);
    let finalDist = 150;

    if (isPlanet) {
      // Target is a Planet or the Sun
      const pm = this.renderer.planetMeshes ? this.renderer.planetMeshes.find(p => p.data.id === this.targetStar.id || p.data.name === this.targetStar.name) : null;
      if (pm && pm.mesh) {
        pm.mesh.getWorldPosition(worldPos);
      }
      const size = this.targetStar.size || this.targetStar.radius || 10;
      finalDist = (this.targetStar.id === 'Sun' || this.targetStar.name === 'Sun') ? 3000 : (size * 5);
      
      // Auto-select the planet in UI if applicable
      if (this.renderer.selectPlanet) this.renderer.selectPlanet(pm ? pm.data : this.targetStar);
    } else {
      // Target is a massive distant 3D star
      finalDist = 10; // Mega Zoom
      
      // EXTREMELY CRITICAL: Force worldPos to (0,0,0) to completely avoid WebGL Float32 precision limits
      // at 4.5 million units which causes the star to become an invisible glitch!
      worldPos = new THREE.Vector3(0,0,0);
      
      try {
        // Prevent viewStar3D from placing the star far away
        this.targetStar.position = new THREE.Vector3(0,0,0);
        this.renderer.viewStar3D(this.targetStar, true);
        
        // HIDE the Solar System to prevent it from overlapping the new 3D Star at (0,0,0)
        if (this.renderer._sunGlow) this.renderer._sunGlow.visible = false;
        if (this.renderer.planetMeshes) {
          this.renderer.planetMeshes.forEach(pm => { if (pm.mesh) pm.mesh.visible = false; });
        }
        
        if (this.renderer._active3DStar) {
          this.renderer._active3DStar.position.set(0,0,0);
          worldPos.copy(this.renderer._active3DStar.position);
        }
      } catch (e) {
        console.error("Failed to create 3D star", e);
      }
    }

    const endApproachTarget = worldPos.clone();

    // 4. Determine camera direction for the approach
    let dir = new THREE.Vector3().subVectors(this.renderer.camera.position, endApproachTarget).normalize();
    if (dir.lengthSq() === 0) dir.set(0, 0, 1);

    const endApproachCam = endApproachTarget.clone().add(dir.clone().multiplyScalar(finalDist));
    const startApproachCam = endApproachTarget.clone().add(dir.clone().multiplyScalar(finalDist + 15000));
    
    // Ensure background stars (Milky Way) are visible now that the 3D star is safely at origin
    if (this.renderer.skyGroup) {
      this.renderer.skyGroup.visible = true;
    }
    
    this.renderer.camera.position.copy(startApproachCam);
    this.renderer.controls.target.copy(endApproachTarget);
    this.renderer.controls.update();

    // 6. Animate the approach flight towards the PERFECT orbit position!
    const approachDuration = 4500;
    const approachStartTime = performance.now();
    const animApproach = (now) => {
      if (!this.active) return;
      const t = Math.min(1, (now - approachStartTime) / approachDuration);
      // easeOutCubic for smooth deceleration
      const et = 1 - Math.pow(1 - t, 3);
      
      this.renderer.camera.position.lerpVectors(startApproachCam, endApproachCam, et);
      this.renderer.controls.update();
      
      if (t < 1) requestAnimationFrame(animApproach);
    };
    requestAnimationFrame(animApproach);

    await this.playAI("Destination acquired.", 2000);
    await this.playAI(`Approaching ${this.targetStar.name || 'target'}.`, 2500);
  }

  async sceneStarReveal() {
    // SCENE 7: STAR REVEAL
    // The approach is finished. Start orbiting!
    document.getElementById('nav-speed').innerText = "Orbit Established";
    
    if (this.renderer.controls) {
      this.renderer.controls.autoRotate = true;
      this.renderer.controls.autoRotateSpeed = 2.0;
    }

    // Fade out cockpit UI
    this.hideUI();

    const dynUI = document.getElementById('j-dynamic-ui');
    if (dynUI) {
      dynUI.innerHTML = `
        <div style="position:absolute; bottom:15%; left:10%; background:rgba(0,20,40,0.6); padding:20px; border-radius:10px; border-left:4px solid #0ea5e9; color:white; font-family:'Inter', sans-serif; backdrop-filter:blur(10px); animation: j-slideUp 1s forwards;">
          <div style="font-size:24px; font-weight:bold; letter-spacing:2px; color:#38bdf8; margin-bottom:10px;">⭐ ${this.targetStar.name || 'Star ' + this.targetStar.id}</div>
          <div style="color:#cbd5e1; font-size:14px; margin-bottom:5px;">🌌 Constellation: Unknown</div>
          <div style="color:#cbd5e1; font-size:14px; margin-bottom:5px;">📍 Distance: ${(this.targetStar.dist || 0).toFixed(2)} LY</div>
          <div style="color:#cbd5e1; font-size:14px;">☀ Type: Stellar Class G</div>
        </div>
      `;
    }

    await this.sleep(4000);
  }

  async sceneArrivalCeremony() {
    // SCENE 8: ARRIVAL CEREMONY
    // Create a fresh arrival container directly inside the UI layer
    const arrivalDiv = document.createElement('div');
    arrivalDiv.id = 'journey-arrival-container';
    arrivalDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:10001;pointer-events:auto;';
    arrivalDiv.innerHTML = `
      <div style="text-align:center; animation: j-fadeIn 2s forwards;">
        <div style="font-size:20px; font-style:italic; color:#e2e8f0; text-shadow:0 0 15px white; line-height:2; margin-bottom:40px;">
          "After crossing unimaginable distances, you have arrived."<br>
          "This star is now part of your story."<br>
          "Welcome home, Explorer."
        </div>
        <button id="btn-exit-journey" style="
          background: rgba(14,165,233,0.25);
          border: 2px solid #0ea5e9;
          color: #38bdf8;
          padding: 16px 48px;
          border-radius: 40px;
          font-size: 16px;
          font-weight: 600;
          font-family: Inter, sans-serif;
          cursor: pointer;
          pointer-events: auto;
          letter-spacing: 2px;
          box-shadow: 0 0 30px rgba(14,165,233,0.4);
          transition: all 0.3s ease;
        ">🚀 EXIT JOURNEY</button>
      </div>
    `;

    if (this.$uiLayer) {
      this.$uiLayer.appendChild(arrivalDiv);
      this.$uiLayer.classList.remove('journey-hidden');
      this.$uiLayer.style.display = '';
    }

    // Attach click listener to Exit button
    const btn = document.getElementById('btn-exit-journey');
    if (btn) {
      btn.addEventListener('click', () => {
        // Remove the arrival overlay
        if (arrivalDiv.parentNode) arrivalDiv.parentNode.removeChild(arrivalDiv);

        // Clear and hide the whole journey layer
        if (this.$uiLayer) {
          this.$uiLayer.innerHTML = '';
          this.$uiLayer.classList.add('journey-hidden');
          this.$uiLayer.style.display = 'none';
        }

        // Restore all UI elements hidden during startJourney
        const elsToRestore = ['app-header', 'bottom-controls', 'btn-toggle-features', 'corner-menubar', 'time-controller', 'side-panel', 'immersive-ui-container'];
        elsToRestore.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = '';
        });
        document.body.classList.remove('is-immersive-view');

        // Open the immersive star feature menu
        if (this.renderer && this.renderer.app && this.renderer.app.ui) {
          this.renderer.app.ui.openImmersiveUI(this.targetStar);
        }

        this.active = false;
      });
    }
  }
}
