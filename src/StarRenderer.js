/**
 * StarRenderer.js
 * Three.js scene setup, star geometry, milky way band, and render loop.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { getPlanetsData, calculateLST } from './PlanetData.js';
import { FAMOUS_MISSIONS } from './StarData.js';
import { MissionSimulator } from './MissionSimulator.js';
import { Constellations, CONSTELLATION_DATA } from './Constellations.js';
import { Asterisms } from './Asterisms.js';
// satellite.js is loaded globally via CDN in index.html

export class StarRenderer {
  constructor(container) {
    this.container = container;
    this.stars     = [];
    this.planets   = [];
    this.scene     = null;
    this.skyGroup  = null;
    this.camera    = null;
    this.renderer  = null;
    this.controls  = null;
    this.pointsMesh = null;
    this.milkyWay  = null;
    this.selectionRing = null;
    this.selectionStar = null;
    this.animateId = null;
    this.autoRotate = false;
    this.is2DMapMode = false;
    this._mapModeValue = 0;
    this.clock     = new THREE.Clock();
    this.onReady   = null;
    // FPS tracking
    this._frameCount = 0;
    this._fpsLast    = performance.now();
    this._fps        = 60;

    this.simulationTime = new Date();
    this.timeScale = 1.0; 
    this.isTimePaused = false;
    this.onPlanetMarkerClick = null;
    this._targetCamGoal = null;
    
    // Procedural features
    this._activeExoplanetGroup = null;
    this._activeExoplanets = [];
    this._solarFlareMaterials = [];
    this._sunFlareMaterials = [];

    // Supernova Explosion sequence state
    this._supernovaActive = false;
    this._supernovaState = 'idle'; // 'idle' | 'expanding' | 'exploding' | 'ejecting' | 'nebula'
    this._supernovaTime = 0.0;
    this._supernovaRemnants = [];

    // Mission Simulator reference
    this.missionSimulator = null;

    // Constellation lines group
    this.constellationLinesData = null;
    this.constellationLinesGroup = new THREE.Group();
    this._originalCameraState = null;
  }

  init() {
    this._createScene();
    this.skyGroup = new THREE.Group();
    this.scene.add(this.skyGroup);
    this.scene.add(this.constellationLinesGroup);
    this._createCamera();
    this._createRenderer();
    this._createControls();
    this._createMilkyWay();
    this._createNebulae();
    this._createShootingStars();
    this._createWarpDust();
    this._createCelestialGrid();
    this._createEarth();
    this._initSatellites();
    this._addResizeListener();
    this.missionSimulator = new MissionSimulator(this);
    this._loadConstellationLines();
    return this;
  }

  _createShootingStars() {
    this._shootingStars = [];
    const colors = [
      new THREE.Color(0.2, 0.9, 1.0), // cyan-blue / magnesium ionization
      new THREE.Color(0.3, 1.0, 0.5), // emerald-green / nickel-iron friction
      new THREE.Color(1.0, 0.92, 0.65), // golden yellow / sodium combustion
      new THREE.Color(1.0, 0.48, 0.18)  // fiery orange-red / silicate vaporization
    ];

    for (let i = 0; i < 15; i++) {
      const geo = new THREE.BufferGeometry();
      const segments = 25;
      const positions = new Float32Array(segments * 3);
      const progress = new Float32Array(segments);
      for (let j = 0; j < segments; j++) {
        const t = j / (segments - 1);
        positions[j * 3 + 0] = 0;
        positions[j * 3 + 1] = 0;
        positions[j * 3 + 2] = -t * 120.0; // Longer, more realistic tail trail
        progress[j] = t;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('aProgress', new THREE.BufferAttribute(progress, 1));

      const headTint = colors[i % colors.length];

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uHeadTint: { value: headTint },
          uOpacity:  { value: 0.0 }
        },
        vertexShader: /* glsl */`
          attribute float aProgress;
          varying float vProgress;
          void main() {
            vProgress = aProgress;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */`
          varying float vProgress;
          uniform vec3 uHeadTint;
          uniform float uOpacity;
          void main() {
            // Realistic friction-induced meteor colors
            vec3 headCol = uHeadTint;
            vec3 midCol  = vec3(1.0, 0.45, 0.1);
            vec3 tailCol = vec3(0.5, 0.05, 0.0);

            vec3 col;
            if (vProgress < 0.15) {
              col = mix(vec3(1.0, 1.0, 1.0), headCol, vProgress / 0.15);
            } else if (vProgress < 0.40) {
              col = mix(headCol, midCol, (vProgress - 0.15) / 0.25);
            } else {
              col = mix(midCol, tailCol, (vProgress - 0.40) / 0.60);
            }

            // Exponential tail taper fade
            float fade = pow(1.0 - vProgress, 3.0);
            
            // Core plasma head glow
            float headGlow = smoothstep(0.05, 0.0, vProgress) * 6.0;
            
            gl_FragColor = vec4(col * (fade * 4.0 + headGlow), fade * uOpacity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const mesh = new THREE.Line(geo, mat);
      mesh.visible = false;
      this.skyGroup.add(mesh);
      
      const ss = { 
        mesh, 
        dir: new THREE.Vector3(), 
        speed: 0, 
        life: 0, 
        maxLife: 0, 
        delay: Math.random() * 25 
      };
      this._shootingStars.push(ss);
    }
  }

  _createWarpDust() {
    const count = 400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3 * 2);

    this._warpParticles = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 600;
      const y = (Math.random() - 0.5) * 600;
      const z = -Math.random() * 1200; // spread out ahead
      this._warpParticles.push(new THREE.Vector3(x, y, z));

      pos[i*6]   = x; pos[i*6+1] = y; pos[i*6+2] = z;
      pos[i*6+3] = x; pos[i*6+4] = y; pos[i*6+5] = z;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xaadaff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this._warpDustMesh = new THREE.LineSegments(geo, mat);
    this._warpDustMesh.visible = false;
    this.scene.add(this._warpDustMesh);
  }

  _createCelestialGrid() {
    this.celestialGridGroup = new THREE.Group();
    const radius = 3800000; // slightly inside stars
    const mat = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    // 1. Draw circles of constant Declination (horizontal rings)
    const decAngles = [-60, -30, 0, 30, 60];
    decAngles.forEach(deg => {
      const rad = deg * Math.PI / 180;
      const ringRadius = radius * Math.cos(rad);
      const y = radius * Math.sin(rad);

      const points = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          ringRadius * Math.cos(theta),
          ringRadius * Math.sin(theta),
          y
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, mat);
      this.celestialGridGroup.add(line);
    });

    // 2. Draw meridians of constant Right Ascension
    const raSegments = 24;
    for (let h = 0; h < raSegments; h++) {
      const angle = (h / raSegments) * Math.PI * 2;
      const points = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const phi = (i / segments) * Math.PI - Math.PI / 2;
        points.push(new THREE.Vector3(
          radius * Math.cos(phi) * Math.cos(angle),
          radius * Math.cos(phi) * Math.sin(angle),
          radius * Math.sin(phi)
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, mat);
      this.celestialGridGroup.add(line);
    }

    this.celestialGridGroup.visible = false; // off by default
    this.scene.add(this.celestialGridGroup);
  }

  _resetShootingStar(ss) {
    if (this.isPlanetariumMode) {
       // EARTH VIEW: Meteors are very rare and very far away!
       const r = 2000 + Math.random() * 2000; 
       const theta = Math.random() * Math.PI * 2;
       const phi   = Math.acos(2 * Math.random() - 1); 
       
       const offset = new THREE.Vector3(
         r * Math.sin(phi) * Math.cos(theta),
         r * Math.sin(phi) * Math.sin(theta),
         r * Math.cos(phi),
       );
       
       ss.mesh.position.copy(this.camera.position).add(offset);
       // Completely random direction for earth-view streaks
       ss.dir.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
       
       // CORRECT quaternion: tail is along -Z in local space.
       // Tail should trail BEHIND motion, so -Z must point in -ss.dir (opposite of travel).
       // setFromUnitVectors( (0,0,-1), -ss.dir ) achieves this.
       ss.mesh.quaternion.setFromUnitVectors(
         new THREE.Vector3(0, 0, -1),
         ss.dir.clone().negate()
       );
       
       ss.mesh.scale.set(100, 100, 100);
       ss.speed = 2800 + Math.random() * 3200;
       
       ss.maxLife = 2.5 + Math.random() * 2.5; 
       ss.delay = 10 + Math.random() * 50; // VERY rare in Earth view
    } else {
       // SPACE VIEW: Meteors buzz past the camera
       // Pick a random spawn distance from camera (5 to 80 units)
       const r = 5 + Math.random() * 75;
       const theta = Math.random() * Math.PI * 2;
       const phi   = Math.acos(2 * Math.random() - 1);

       const offset = new THREE.Vector3(
         r * Math.sin(phi) * Math.cos(theta),
         r * Math.sin(phi) * Math.sin(theta),
         r * Math.cos(phi),
       );

       if (this.camera) {
         const candidatePos = this.camera.position.clone().add(offset);

         // --- Planet proximity check: skip if too close to any planet ---
         let tooCloseToPlanet = false;
         if (this.planetMeshes) {
           for (const pm of this.planetMeshes) {
             if (pm.mesh && pm.mesh.position.distanceTo(candidatePos) < 30) {
               tooCloseToPlanet = true;
               break;
             }
           }
         }
         if (tooCloseToPlanet) {
           // Push the meteor far from the planet — offset outward by extra 60 units
           offset.normalize().multiplyScalar(60 + Math.random() * 40);
           candidatePos.copy(this.camera.position).add(offset);
         }

         ss.mesh.position.copy(candidatePos);

         // DIRECTION: meteor flies toward the camera with a natural spread.
         // toCamera = unit vector from spawn point → camera.
         // Adding spread makes it fly "past" the camera, not perfectly at it.
         const toCamera = this.camera.position.clone().sub(candidatePos).normalize();
         const spread = new THREE.Vector3(
           (Math.random() - 0.5) * 0.9,
           (Math.random() - 0.5) * 0.9,
           (Math.random() - 0.5) * 0.9
         );
         ss.dir.addVectors(toCamera, spread).normalize();

         // CORRECT quaternion: geometry tail is along local -Z.
         // For tail to trail BEHIND motion, local -Z must align with -ss.dir.
         // setFromUnitVectors( (0,0,-1), -ss.dir ) does exactly that.
         ss.mesh.quaternion.setFromUnitVectors(
           new THREE.Vector3(0, 0, -1),
           ss.dir.clone().negate()
         );

         // Store spawn distance so animate loop can scale speed correctly
         ss._spawnDist = candidatePos.distanceTo(this.camera.position);
      } else {
         ss.mesh.position.copy(offset);
         ss.dir.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
         ss.mesh.quaternion.setFromUnitVectors(
           new THREE.Vector3(0, 0, -1),
           ss.dir.clone().negate()
         );
         ss._spawnDist = r;
      }

      ss.mesh.scale.set(1, 1, 1);
      // Base speed stored — actual speed applied per-frame based on distance
      ss._baseSpeed = 12 + Math.random() * 18;
      ss.speed = ss._baseSpeed;
      ss.maxLife = 2.0 + Math.random() * 2.0;
      ss.delay = Math.random() * 5; // Frequent in space view
    }
    ss.life = ss.maxLife;
    ss.mesh.visible = true;
  }

  _createScene() {
    this.scene = new THREE.Scene();
    // Add deep space fog to make distant stars and planets fade in smoothly as we approach
    this.scene.fog = new THREE.FogExp2(0x010206, 0.00000015);
    
    // Deep space gradient background sphere
    const bgGeo = new THREE.SphereGeometry(5000000, 32, 32);
    const bgMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {},
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        void main() {
          float y = normalize(vWorldPos).y;
          vec3 deep   = vec3(0.002, 0.003, 0.01);
          vec3 mid    = vec3(0.004, 0.006, 0.02);
          vec3 zenith = vec3(0.008, 0.004, 0.016);
          vec3 col = mix(mid, deep, smoothstep(0.0, -0.5, y));
          col = mix(col, zenith, smoothstep(0.0, 0.8, y));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this._bgSphere = new THREE.Mesh(bgGeo, bgMat);
    this.scene.add(this._bgSphere);
    // Ambient light to fill shadows
    this.scene.add(new THREE.AmbientLight(0x334455, 1.2));
  }

  _createCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.0001, 10000000);
    this.camera.position.set(0, 180000, 280000);
    
    // Add a dim headlight to the spaceship so planets aren't completely pitch black on their dark sides
    this.headlight = new THREE.PointLight(0xffeedd, 0.2, 0, 0); // Very dim, just enough to see silhouettes
    this.camera.add(this.headlight);
    this.scene.add(this.camera);
  }

  _createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.xr.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.7;
    this.container.appendChild(this.renderer.domElement);
    
    // Ensure the canvas can receive keyboard events for FlyControls
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.focus();

    // Setup Post-Processing (Bloom) at half resolution for massive performance boost
    const renderScene = new RenderPass(this.scene, this.camera);
    const bloomRes = new THREE.Vector2(Math.floor(window.innerWidth / 4), Math.floor(window.innerHeight / 4));
    const bloomPass = new UnrealBloomPass(bloomRes, 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.75; // Only glow very bright things (bright stars, sun core)
    bloomPass.strength = 0.4;   // Lower overall bloom for a realistic dark space look
    bloomPass.radius = 0.5;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    // Auto-focus on click so it receives keyboard input
    this.renderer.domElement.addEventListener('click', () => {
      this.renderer.domElement.focus();
    });
    // Try to focus immediately
    setTimeout(() => this.renderer.domElement.focus(), 100);
  }

  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.18; // Higher value = zoom stops faster, less drift after scroll
    this.controls.minDistance = 5.5;
    this.controls.maxDistance = 5000000;
    this.controls.maxPolarAngle = Math.PI;

    // Track W/S keys for manual travel
    this.keys = { w: false, s: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key.toLowerCase() === 'w') this.keys.w = true;
      if (e.key.toLowerCase() === 's') this.keys.s = true;
      if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key.toLowerCase() === 'w') this.keys.w = false;
      if (e.key.toLowerCase() === 's') this.keys.s = false;
      if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = false;
    });
    this.controls.rotateSpeed      = 0.8;  // Increased from 0.4 for faster, more responsive panning
    this.controls.zoomSpeed        = 2.0;  // Increased for easier zooming
    this.controls.minDistance      = 0.5;
    this.controls.maxDistance      = 5000000;
    this.controls.enablePan        = true;
    this.controls.enableRotate     = true; // Enable standard rotation
    this.controls.enableZoom       = true; // Enable standard zoom
    this.controls.autoRotate       = false;
    this.controls.autoRotateSpeed  = 0.12;
    this.controls.enabled          = true; // OrbitControls is the primary controller

    // Handle zooming via FOV in modes where camera position shouldn't change
    this.renderer.domElement.addEventListener('wheel', (e) => {
      if (this.isPlanetariumMode && this.camera) {
        const delta = e.deltaY > 0 ? 1.1 : 0.9;
        this.camera.fov = THREE.MathUtils.clamp(this.camera.fov * delta, 10, 165);
        this.camera.updateProjectionMatrix();
      }
    });

    this.isFlyMode = false; // Spaceship driving mode is completely removed
    this.isPlanetariumMode = false;

    // Raycaster for object selection
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 3.0; // Easier star picking
    this.mouse = new THREE.Vector2();

    // === Stellarium-Style Terrain Silhouette Sphere ===
    // (Removed tree effects per user request, replaced with empty group to preserve API)
    this.virtualHorizon = new THREE.Group();
    this.virtualHorizon.visible = false;
    this.scene.add(this.virtualHorizon);

    // === Flat dark ground disc (to seal the hemisphere bottom if needed) ===
    const groundDiscGeo = new THREE.CircleGeometry(10000000, 64);
    const groundDiscMat = new THREE.MeshBasicMaterial({
      color: 0x020305,
      side: THREE.DoubleSide,
      depthWrite: true
    });
    this._groundDisc = new THREE.Mesh(groundDiscGeo, groundDiscMat);
    this._groundDisc.visible = false;
    this.scene.add(this._groundDisc);

    // === Atmospheric Horizon Haze Ring ===
    // A subtle warm glow band at the horizon (visible at night like in Stellarium)
    const hazeGeo = new THREE.CylinderGeometry(1480, 1480, 60, 64, 1, true);
    const hazeMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uSunAlt;
        varying vec2 vUv;
        void main() {
          // Vertical gradient: strongest at center (horizon), fading up and down
          float horizonFactor = 1.0 - abs(vUv.y - 0.5) * 2.0;
          horizonFactor = pow(horizonFactor, 3.0); // Sharp falloff

          // Night: subtle warm brown-orange airglow (like real atmosphere)
          // Day: bright warm white-blue atmospheric scattering
          vec3 nightHaze = vec3(0.12, 0.08, 0.04);  // Warm brown airglow
          vec3 dayHaze   = vec3(0.55, 0.65, 0.8);   // Bright atmospheric blue
          vec3 sunsetHaze = vec3(0.7, 0.3, 0.08);    // Warm sunset orange

          float alt = uSunAlt;
          vec3 hazeColor;
          float hazeStrength;

          if (alt > 0.15) {
            // Day
            hazeColor = dayHaze;
            hazeStrength = 0.4;
          } else if (alt > 0.0) {
            // Sunset/Sunrise
            float t = alt / 0.15;
            hazeColor = mix(sunsetHaze, dayHaze, t);
            hazeStrength = mix(0.5, 0.4, t);
          } else if (alt > -0.15) {
            // Twilight
            float t = (alt + 0.15) / 0.15;
            hazeColor = mix(nightHaze, sunsetHaze, t);
            hazeStrength = mix(0.12, 0.5, t);
          } else {
            // Night
            hazeColor = nightHaze;
            hazeStrength = 0.12;
          }

          gl_FragColor = vec4(hazeColor, horizonFactor * hazeStrength);
        }
      `,
      uniforms: {
        uSunAlt: { value: 0.0 }
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this._horizonHaze = new THREE.Mesh(hazeGeo, hazeMat);
    this._horizonHaze.visible = false;
    this.scene.add(this._horizonHaze);

    // Initialize sky dome for atmospheric rendering
    this._createSkyDome();
  }

  _createSkyDome() {
    // Cinematic Sky Dome with Rayleigh & Mie Scattering
    const geo = new THREE.SphereGeometry(2000000, 64, 32); // Full sphere for full sky
    
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;

    const fragmentShader = `
      uniform vec3 uSunPos;
      uniform vec3 uCameraPos;
      varying vec3 vWorldPosition;

      // Atmosphere constants
      const vec3 rayleighColor = vec3(0.15, 0.35, 0.75); // Blue sky
      const vec3 sunsetColor = vec3(0.8, 0.3, 0.1);      // Orange/Red sunset
      const vec3 nightColor = vec3(0.01, 0.02, 0.05);    // Dark night

        uniform vec3 uUpDir;

      void main() {
        vec3 viewDir = normalize(vWorldPosition - uCameraPos);
        vec3 sunDir = normalize(uSunPos - uCameraPos); // Direction from camera to sun
        
        // Calculate elevation using uUpDir instead of global Y
        float sunAltitude = dot(sunDir, uUpDir);
        
        // Base sky color transition based on sun altitude
        float dayFactor = smoothstep(-0.05, 0.2, sunAltitude);
        float twilightFactor = smoothstep(-0.15, 0.05, sunAltitude) - smoothstep(0.05, 0.2, sunAltitude);
        
        vec3 baseSky = mix(nightColor, rayleighColor, dayFactor);
        baseSky = mix(baseSky, sunsetColor, twilightFactor * 0.8);
        
        // Atmospheric gradient (darker at zenith, brighter at horizon)
        float viewAltitude = max(0.0, dot(viewDir, uUpDir));
        float horizonGlow = pow(1.0 - viewAltitude, 4.0);
        baseSky = mix(baseSky, mix(vec3(1.0), sunsetColor, twilightFactor), horizonGlow * 0.5 * (dayFactor + twilightFactor));

        // Sun Halo (Mie Scattering)
        float sunDot = max(0.0, dot(viewDir, sunDir));
        float miePhase = pow(sunDot, 500.0) * 2.0; // Sun disc
        miePhase += pow(sunDot, 50.0) * 0.5; // Inner glow
        miePhase += pow(sunDot, 10.0) * 0.1; // Outer glow
        
        // Only show sun glow if sun is above horizon
        vec3 sunGlow = vec3(1.0, 0.9, 0.8) * miePhase * smoothstep(-0.1, 0.1, sunAltitude);
        
        vec3 finalColor = baseSky + sunGlow;
        
        // Tonemapping & Gamma
        finalColor = finalColor / (finalColor + vec3(1.0));
        finalColor = pow(finalColor, vec3(1.0 / 2.2));

        // Fade out atmosphere at night to reveal the deep space galaxy and stars
        float skyAlpha = max(dayFactor, twilightFactor);
        skyAlpha = clamp(skyAlpha + max(sunGlow.r, sunGlow.g), 0.0, 1.0);
        
        // Keep a tiny bit of atmospheric haze even at night near horizon
        float nightHaze = (1.0 - viewAltitude) * 0.1 * (1.0 - skyAlpha);
        skyAlpha = clamp(skyAlpha + nightHaze, 0.0, 1.0);

        gl_FragColor = vec4(finalColor, skyAlpha);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uSunPos: { value: new THREE.Vector3(0, 0, 0) },
        uCameraPos: { value: new THREE.Vector3(0, 0, 0) },
        uUpDir: { value: new THREE.Vector3(0, 1, 0) }
      },
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });

    this.skyDome = new THREE.Mesh(geo, mat);
    this.skyDome.visible = false;
    this.skyGroup.add(this.skyDome); // Add to skyGroup so it rotates with stars!
  }

  _createMilkyWay() {
    const geo = new THREE.SphereGeometry(4500000, 64, 64);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uCameraPos: { value: new THREE.Vector3() },
        uTime:      { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        uniform vec3 uCameraPos;
        uniform float uTime;
        
        float hash(vec3 p) {
            p = fract(p * 0.3183099 + .1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        
        float noise(vec3 x) {
            vec3 i = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            
            return mix(mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
                           mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                       mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
                           mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
        }

        float fbm(vec3 p) {
            float f = 0.0;
            float amp = 0.5;
            for(int i=0; i<5; i++) {
                f += amp * noise(p);
                p *= 2.0;
                amp *= 0.5;
            }
            return f;
        }

        void main() {
          vec3 offset = (uCameraPos * 0.00001) + vec3(uTime * 0.001, 0.0, uTime * 0.0005);
          vec3 dir = normalize(vWorldPosition);
          
          // Lower frequency for larger, more realistic, fluffy cloud patches
          float n1 = fbm(dir * 1.5 + offset);
          float n2 = fbm(dir * 3.0 - offset * 0.5);
          float n3 = fbm(dir * 6.0 + offset * 1.5);
          
          // Isolate patches to make them look like distant nebula clouds
          float cloud1 = smoothstep(0.35, 0.75, n1);
          float cloud2 = smoothstep(0.45, 0.85, n2);
          float cloud3 = smoothstep(0.55, 0.95, n3);
          
          // Colors matching the user's target image (Deep dark blue, cyan, and black)
          // Increased brightness significantly so the effect is actually visible!
          vec3 voidColor  = vec3(0.00, 0.00, 0.01); 
          vec3 cloudBlue  = vec3(0.04, 0.12, 0.22);  // Rich dark blue/grey clouds
          vec3 cloudCyan  = vec3(0.02, 0.18, 0.35);  // Subtle cyan highlights
          vec3 faintGlow  = vec3(0.08, 0.12, 0.16);  // Faint greyish blue
          
          vec3 finalColor = voidColor;
          finalColor = mix(finalColor, cloudBlue, cloud1);
          finalColor = mix(finalColor, faintGlow, cloud2 * 0.8);
          finalColor += cloudCyan * cloud3 * 0.6;
          
          // Adding a very large scale dark dust layer to create empty voids
          float darkVoid = fbm(dir * 1.8 - vec3(1.0, 2.0, 3.0));
          finalColor *= smoothstep(0.1, 0.9, darkVoid);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.milkyWaySphere = new THREE.Mesh(geo, mat);
    this.skyGroup.add(this.milkyWaySphere);
  }

  _createNebulae() {
    // Deliberately empty: Removed fake procedural noise clouds.
    // Realistic deep space is a pure dark void. This allows the thousands of 
    // calculated stars to shine clearly and crisply without looking like a painting.
  }

  /**
   * Generate a unique satellite code like LMR-001, LMR-ISS, etc.
   * Famous satellites get a short mnemonic; TLE satellites get a padded index.
   */
  _generateSatCode(name, index) {
    // Mnemonic codes for famous / well-known satellites
    const MNEMONICS = {
      'ISS':        'LMR-ISS',
      'ZARYA':      'LMR-ISS',
      'CSS':        'LMR-CSS',
      'TIANGONG':   'LMR-CSS',
      'HUBBLE':     'LMR-HST',
      'WEBB':       'LMR-JWT',
      'JAMES WEBB': 'LMR-JWT',
      'GPS':        'LMR-GPS',
      'NAVSTAR':    'LMR-GPS',
      'STARLINK':   'LMR-SLK',
      'VOYAGER 1':  'LMR-V1X',
      'VOYAGER 2':  'LMR-V2X',
      'MANGALYAAN': 'LMR-MOM',
      'GALILEO':    'LMR-GAL',
    };
    const upper = name.toUpperCase();
    for (const [key, code] of Object.entries(MNEMONICS)) {
      if (upper.includes(key)) return code;
    }
    return `LMR-${String(index + 1).padStart(3, '0')}`;
  }

  async _initSatellites() {
    this.satellites = [];
    this._satelliteMeshes = new THREE.Group();
    this.skyGroup.add(this._satelliteMeshes);

    try {
      let text = '';
      try {
        const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle');
        text = await response.text();
        if (text.trim().startsWith('<')) throw new Error("Received HTML error page instead of TLE");
      } catch (e) {
        console.warn("Using fallback TLE due to fetch error:", e);
        text = `ISS (ZARYA)
1 25544U 98067A   23272.50000000  .00000000  00000-0  00000-0 0  9999
2 25544  51.6400 333.0000 0000000   0.0000   0.0000 15.50000000000000
CSS (TIANGONG)
1 48274U 21035A   23272.50000000  .00000000  00000-0  00000-0 0  9999
2 48274  41.4686  68.2163 0005727  67.4357  81.1856 15.60255459135431`;
      }
      
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      for (let i = 0; i < lines.length; i += 3) {
        if (i + 2 >= lines.length) break;
        const name = lines[i];
        const tleLine1 = lines[i + 1];
        const tleLine2 = lines[i + 2];
        
        if (name && tleLine1 && tleLine2 && window.satellite) {
          const satrec = window.satellite.twoline2satrec(tleLine1, tleLine2);
          
          let mesh;
          const isMain = name.includes('ISS') || name.includes('ZARYA') || name.includes('CSS');
          
          const satCode = this._generateSatCode(name, this.satellites.length);

          if (isMain) {
            // Build a 3D model for the main space station
            mesh = this._buildSatelliteMesh('station', name);
            
            // Render at a compromise scale of 0.5 to mask GPU floating point vibration
            mesh.scale.set(0.5, 0.5, 0.5); 
            
            // Add HTML Label — shows CODE only, not the full name
            const label = document.createElement('div');
            label.className = 'hud-marker-label sat-code-label';
            label.style.position = 'absolute';
            label.style.color = '#00ffcc';
            label.style.fontSize = '9px';
            label.style.fontWeight = 'bold';
            label.style.fontFamily = 'monospace';
            label.style.letterSpacing = '1px';
            label.style.background = 'rgba(0,0,0,0.55)';
            label.style.padding = '1px 5px';
            label.style.borderRadius = '3px';
            label.style.border = '1px solid rgba(0,255,204,0.4)';
            label.style.pointerEvents = 'none';
            label.style.whiteSpace = 'nowrap';
            label.textContent = satCode;
            document.body.appendChild(label);
            mesh.userData.labelEl = label;
          } else {
            // Generic dots for other satellites (hidden by default to avoid clutter)
            const geo = new THREE.SphereGeometry(0.002, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0x444444 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false; 
          }
          
          this._satelliteMeshes.add(mesh);
          const satData = {
            name,
            code: satCode,
            id: name,
            satrec,
            mesh,
            isMain,
            isSatellite: true,
            data: { id: name, size: isMain ? 0.1 : 0.05 }
          };
          mesh.userData.satData = satData;
          this.satellites.push(satData);
        }
      }
    } catch(e) {
      console.error('Failed to load satellite TLEs', e);
    } finally {
      this._initFamousMissions();
    }
  }

  _initFamousMissions() {
    Object.entries(FAMOUS_MISSIONS).forEach(([key, mission]) => {
      if (mission.targetId) {
        const existing = this.satellites.find(s => s.name.includes(mission.targetId));
        if (existing) {
          existing.famousData = mission;
        } else {
          this._createSyntheticMission(mission);
        }
      } else {
        this._createSyntheticMission(mission);
      }
    });
  }

  _buildSatelliteMesh(type, name) {
    const group = new THREE.Group();
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1144aa, metalness: 0.5, roughness: 0.1, side: THREE.DoubleSide });
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.2 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
    
    if (type === 'station') {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.05, 16), bodyMat);
      body.rotation.z = Math.PI / 2;
      group.add(body);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.001, 0.08), panelMat);
      panel.position.set(0.015, 0, 0);
      group.add(panel);
      const panel2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.001, 0.08), panelMat);
      panel2.position.set(-0.015, 0, 0);
      group.add(panel2);
    } else if (type === 'jwst') {
      const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.001, 6), goldMat);
      mirror.rotation.x = Math.PI / 2;
      mirror.position.z = 0.005;
      group.add(mirror);
      const shieldMat = new THREE.MeshStandardMaterial({ color: 0xaa55ff, metalness: 0.1, roughness: 0.8 });
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.001, 0.015), shieldMat);
      shield.position.y = -0.005;
      group.add(shield);
    } else if (type === 'telescope') {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.025, 16), bodyMat);
      body.rotation.x = Math.PI / 2;
      group.add(body);
      const flap = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.001, 16), bodyMat);
      flap.rotation.x = Math.PI / 2;
      flap.rotation.y = Math.PI / 4;
      flap.position.set(0, 0.006, 0.012);
      group.add(flap);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.001, 0.006), panelMat);
      group.add(panel);
    } else if (type === 'galileo') {
      // Main Body: octagonal cylinder wrapped in gold foil
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.015, 8), goldMat);
      body.rotation.z = Math.PI / 2;
      group.add(body);
      
      // High Gain Antenna (Large Gold Dish)
      const dishMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.7, roughness: 0.6, side: THREE.DoubleSide });
      const dish = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.006, 24, 1, true), dishMat); // open cone
      dish.rotation.z = -Math.PI / 2;
      dish.position.x = -0.01;
      group.add(dish);

      // Antenna boom sticking out of dish center
      const centerBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.0003, 0.0003, 0.015), bodyMat);
      centerBoom.rotation.z = Math.PI / 2;
      centerBoom.position.x = -0.018;
      group.add(centerBoom);

      // Magnetometer boom (long thin arm pointing up/out)
      const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.0003, 0.0003, 0.04), bodyMat);
      magBoom.rotation.z = Math.PI / 6;
      magBoom.position.set(0.01, 0.02, 0);
      group.add(magBoom);

      // RTG (Radioisotope Thermoelectric Generator) on the side
      const rtgMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.2, roughness: 0.8 });
      const rtgBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.0005, 0.0005, 0.015), bodyMat);
      rtgBoom.rotation.x = Math.PI / 2;
      rtgBoom.position.set(0.005, 0, 0.01);
      group.add(rtgBoom);

      const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.006, 8), rtgMat);
      rtg.rotation.x = Math.PI / 2;
      rtg.position.set(0.005, 0, 0.02);
      group.add(rtg);

    } else if (type === 'probe') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), goldMat);
      group.add(body);
      const dish = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.005, 16), bodyMat);
      dish.position.y = 0.007;
      group.add(dish);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.0005, 0.0005, 0.02), bodyMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.x = 0.015;
      group.add(arm);
    } else {
      // generic satellite (GPS, Starlink, etc)
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.008), bodyMat);
      group.add(body);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.001, 0.006), panelMat);
      group.add(panel);
    }
    return group;
  }

  _createSyntheticMission(mission) {
    let type = 'satellite';
    if (mission.name.includes('Station')) type = 'station';
    else if (mission.name.includes('Webb')) type = 'jwst';
    else if (mission.name.includes('Telescope')) type = 'telescope';
    else if (mission.name.includes('Galileo')) type = 'galileo';
    else if (mission.name.includes('Voyager') || mission.name.includes('Mangalyaan') || mission.name.includes('Chandrayaan')) type = 'probe';

    const satCode = this._generateSatCode(mission.name, this.satellites.length);

    const mesh = this._buildSatelliteMesh(type, mission.name);
    mesh.scale.set(0.5, 0.5, 0.5); // Compromise scale to prevent WebGL floating point jitter
    
    // Add Label — shows CODE only, not mission name
    const label = document.createElement('div');
    label.className = 'hud-marker-label sat-code-label';
    label.style.position = 'absolute';
    label.style.color = '#ffaa00';
    label.style.fontSize = '9px';
    label.style.fontWeight = 'bold';
    label.style.fontFamily = 'monospace';
    label.style.letterSpacing = '1px';
    label.style.background = 'rgba(0,0,0,0.55)';
    label.style.padding = '1px 5px';
    label.style.borderRadius = '3px';
    label.style.border = '1px solid rgba(255,170,0,0.45)';
    label.style.pointerEvents = 'none';
    label.style.whiteSpace = 'nowrap';
    label.textContent = satCode;
    document.getElementById('hud-container').appendChild(label);
    mesh.userData.labelEl = label;

    mesh.scale.set(15, 15, 15);

    if (mission.staticPos) {
      mesh.position.set(mission.staticPos.x, mission.staticPos.y, mission.staticPos.z);
    }
    
    this.skyGroup.add(mesh);

    const satData = {
      name: mission.name,
      code: satCode,
      id: mission.name,
      mesh: mesh,
      isMain: true,
      isSatellite: true,
      famousData: mission,
      orbitParams: mission.orbitParams || (mission.staticPos ? null : { target: 'Earth', distance: 6 + Math.random() * 4, speed: 0.2, size: 0.05 }),
      orbitAngle: Math.random() * Math.PI * 2,
      data: { id: mission.name, size: mission.size || 0.1 }
    };
    mesh.userData.satData = satData;
    this.satellites.push(satData);
  }

  _updateSatellites() {
    if (!this.satellites || this.satellites.length === 0 || !this.earth) return;
    
    const date = new Date(this.simulationTime);
    
    for (const sat of this.satellites) {
      if (sat.satrec) {
        const positionAndVelocity = window.satellite.propagate(sat.satrec, date);
        const positionEci = positionAndVelocity.position;
        
        if (positionEci && typeof positionEci !== 'boolean') {
          const scale = 4.0 / 6371.0;
          const localPos = new THREE.Vector3(
            (positionEci.x * scale),
            (positionEci.z * scale),
            -(positionEci.y * scale)
          );
          sat.mesh.position.copy(this.earth.position).add(localPos);

          if (sat.isMain) {
             const velEci = positionAndVelocity.velocity;
             if (velEci) {
                 sat.mesh.lookAt(sat.mesh.position.clone().add(new THREE.Vector3(velEci.x, velEci.z, -velEci.y)));
             }
          }
        }
      } else if (sat.orbitParams && !sat.staticPos) {
        // Synthetic satellite orbit update
        const targetId = sat.orbitParams.target || 'Earth';
        let targetPos = new THREE.Vector3();
        if (targetId === 'Earth') {
           targetPos.copy(this.earth.position);
        } else if (this.planetMeshes) {
           const pm = this.planetMeshes.find(p => p.data.id === targetId);
           if (pm && pm.mesh.visible) targetPos.copy(pm.mesh.position);
        }
        
        // Use timeScale to ensure speed matches real-time settings, and slow down base speed to be realistic (like ISS taking ~90 mins)
        const timeScaleMultiplier = (this.timeScale !== undefined) ? this.timeScale : 1;
        sat.orbitAngle += (sat.orbitParams.speed * 0.0002) * timeScaleMultiplier;
        const d = sat.orbitParams.distance;
        sat.mesh.position.set(
           targetPos.x + Math.cos(sat.orbitAngle) * d,
           targetPos.y,
           targetPos.z + Math.sin(sat.orbitAngle) * d
        );
        sat.mesh.rotation.y += 0.005;
      }

      // Orient and update label for main satellite
      if (sat.isMain) {
           const distToSat = this.camera.position.distanceTo(sat.mesh.position);
           
           // Hide satellites if the camera is too far away
           if (distToSat > 60) {
               sat.mesh.visible = false;
               if (sat.mesh.userData.labelEl) {
                   sat.mesh.userData.labelEl.style.display = 'none';
               }
           } else {
               sat.mesh.visible = true;
               if (sat.mesh.userData.labelEl && this.earth && this.earth.visible) {
                 const tempV = sat.mesh.position.clone();
                 tempV.project(this.camera);
                 
                 // Check if behind Earth
                 const distToEarthCenter = this.camera.position.distanceTo(this.earth.position);
                 
                 const safeLocalLength = sat.mesh.position.clone().sub(this.earth.position).length();
                 if (tempV.z > 1.0 || (distToSat > distToEarthCenter && safeLocalLength < 4.5)) {
                   sat.mesh.userData.labelEl.style.display = 'none';
                 } else {
                   const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
                   const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;
                   sat.mesh.userData.labelEl.style.display = 'block';
                   sat.mesh.userData.labelEl.style.transform = `translate(-50%, -50%) translate(${x}px, ${y - 15}px)`;
                 }
               }
           }
      }
    }
  }

  /**
   * Build star points geometry from catalog data.
   * @param {Array} starData - Processed star records
   */
  selectStar(starData) {
    this._selectedCelestial = starData;
    this._trackedPlanet = null;
    this._clearSelection();
    this.selectionStar = starData;

    // ── Get world position of this star ──────────────────────────────────
    let worldPos = null;
    if (starData.mesh && starData.mesh.position) {
      worldPos = starData.mesh.position.clone();
    } else if (starData.position) {
      const local = new THREE.Vector3(starData.position.x || 0, starData.position.y || 0, starData.position.z || 0);
      // Stars are inside skyGroup — convert to world coords
      if (this.skyGroup) {
        worldPos = local.clone();
        this.skyGroup.updateMatrixWorld();
        worldPos.applyMatrix4(this.skyGroup.matrixWorld);
      } else {
        worldPos = local;
      }
    }

    if (!worldPos) return;

    // ── Update min/max distance for zooming and set a target pan goal
    if (this.controls && !this.isFlyMode && !this._isCinematicFlight) {
      this.controls.minDistance = 0.5;
      this.controls.maxDistance = 5000000;
      // We explicitly DO NOT snap this.controls.target here so the view doesn't jump.
      // Instead, we set a goal to smoothly rotate towards it in the render loop.
      this._targetPanGoal = worldPos.clone();
    }

    // ── Place a glowing 3D selection sprite at the star position ─────────
    this._placeStarSelectionMarker(worldPos, starData);
  }

  _placeStarSelectionMarker(worldPos, starData) {
    // Remove old marker
    if (this._starSelectMarker) {
      this.scene.remove(this._starSelectMarker);
      this._starSelectMarker.material.dispose();
      this._starSelectMarker = null;
    }
    if (this._starSelectMarker2) {
      this.scene.remove(this._starSelectMarker2);
      this._starSelectMarker2.material.dispose();
      this._starSelectMarker2 = null;
    }

    if (starData.isPlanet || starData.isSatellite) return; // planets/sats have their own rings

    const starColor = starData.color || '#aaddff';

    // Outer thin circular ring (hollow inside so the star is perfectly visible!)
    const outerCanvas = document.createElement('canvas');
    outerCanvas.width = outerCanvas.height = 128;
    const octx = outerCanvas.getContext('2d');
    
    // Draw a thin circular stroke with a hollow center
    octx.strokeStyle = 'rgba(255, 255, 255, 0.85)'; // Neutral white/translucent ring (will be tinted by starColor)
    octx.lineWidth = 2.0;
    octx.beginPath();
    octx.arc(64, 64, 42, 0, Math.PI * 2);
    octx.stroke();

    // Add 4 delicate crosshair tick marks on the ring (top, bottom, left, right)
    octx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    octx.lineWidth = 1.5;
    // Top
    octx.beginPath(); octx.moveTo(64, 12); octx.lineTo(64, 20); octx.stroke();
    // Bottom
    octx.beginPath(); octx.moveTo(64, 108); octx.lineTo(64, 116); octx.stroke();
    // Left
    octx.beginPath(); octx.moveTo(12, 64); octx.lineTo(20, 64); octx.stroke();
    // Right
    octx.beginPath(); octx.moveTo(108, 64); octx.lineTo(116, 64); octx.stroke();

    const outerTex = new THREE.CanvasTexture(outerCanvas);

    // Constant screen-space size so the selection reticle remains perfectly visible at all zoom levels and distances!
    const markerScreenSize = 0.055;

    const outerMat = new THREE.SpriteMaterial({
      map: outerTex,
      color: new THREE.Color(starColor),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: false,
    });
    const outerSprite = new THREE.Sprite(outerMat);
    outerSprite.scale.set(markerScreenSize, markerScreenSize, 1);
    outerSprite.position.copy(worldPos);
    this.scene.add(outerSprite);
    this._starSelectMarker = outerSprite;
    this._starSelectMarker._birthTime = performance.now();
    this._starSelectMarker._baseSize = markerScreenSize;

    // No inner solid core, to keep the star perfectly visible and clean
    this._starSelectMarker2 = null;
  }

  buildStars(starData) {
    this.stars = starData;
    const count = starData.length;

    const geo    = new THREE.BufferGeometry();
    const pos    = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes  = new Float32Array(count);
    const mags   = new Float32Array(count);
    const categories = new Float32Array(count);
    const isConstellationAttr = new Float32Array(count);
    const filterAlphas = new Float32Array(count);
    const isRegisteredAttr = new Float32Array(count);

    const constellationStarIds = new Set();
    if (typeof CONSTELLATION_DATA !== 'undefined') {
      CONSTELLATION_DATA.forEach(c => c.lines.forEach(line => {
        constellationStarIds.add(line[0]);
        constellationStarIds.add(line[1]);
      }));
    }

    starData.forEach((star, i) => {
      const { x, y, z } = star.position;
      pos[i*3]   = x;
      pos[i*3+1] = y;
      pos[i*3+2] = z;

      // Parse hex color
      const c = new THREE.Color(star.color || '#cce8ff');
      colors[i*3]   = c.r;
      colors[i*3+1] = c.g;
      colors[i*3+2] = c.b;

      // Compute size based on star magnitude (brighter stars are larger)
      const mag = star.mag !== undefined ? star.mag : 5.0;
      const clipped = Math.max(-2.0, Math.min(6.5, mag));
      sizes[i] = Math.max(0.6, 6.5 - clipped * 0.85) * 1.55;
      mags[i] = mag;
      isConstellationAttr[i] = constellationStarIds.has(star.id) ? 1.0 : 0.0;
      
      const typeStr = star.type ? star.type.charAt(0).toUpperCase() : 'G';
      const typeMap = { 'O':0, 'B':1, 'A':2, 'F':3, 'G':4, 'K':5, 'M':6 };
      categories[i] = typeMap[typeStr] !== undefined ? typeMap[typeStr] : 4;
      filterAlphas[i] = 1.0;
    });

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('mag',      new THREE.BufferAttribute(mags, 1));
    geo.setAttribute('category', new THREE.BufferAttribute(categories, 1));
    geo.setAttribute('isConstellation', new THREE.BufferAttribute(isConstellationAttr, 1));
    geo.setAttribute('aFilterAlpha', new THREE.BufferAttribute(filterAlphas, 1));
    geo.setAttribute('aIsRegistered', new THREE.BufferAttribute(isRegisteredAttr, 1));

    // Star texture (soft glowing circle)
    const tex = this._createStarTexture();

    // Custom shader for twinkling stars, horizon clipping, and daylight fading
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: tex },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uObserverPos: { value: new THREE.Vector3(0,0,0) },
        uUpDir: { value: new THREE.Vector3(0,1,0) },
        uSunAlt: { value: 1.0 },
        uIsPlanetarium: { value: 0.0 },
        uTelescopeMode: { value: 0.0 },
        uLimitingMag: { value: 6.0 },
        uCategoryVisibility: { value: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0] }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float mag;
        attribute float category;
        attribute float isConstellation;
        attribute float aFilterAlpha;
        attribute float aIsRegistered;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform vec3 uObserverPos;
        uniform vec3 uUpDir;
        uniform float uSunAlt;
        uniform float uIsPlanetarium;
        uniform float uTelescopeMode;
        uniform float uLimitingMag;
        uniform float uCategoryVisibility[7];
        
        varying vec3 vColor;
        varying float vTwinkle;
        varying float vVisibility;
        varying float vIsRegistered;

        void main() {
          vIsRegistered = aIsRegistered;
          vColor = color;
          
          vec3 pos3D = position;
          vec4 worldPos = modelMatrix * vec4(pos3D, 1.0);
          
          float visibility = 1.0;
          if (uIsPlanetarium > 0.5) {
            // Vector from observer to star
            vec3 starDir = normalize(worldPos.xyz - uObserverPos);
            float alt = dot(starDir, uUpDir);
            
          // Clip below horizon
            if (alt < -0.02) {
              visibility = 0.0;
            } else {
              // Atmospheric extinction (dimming near horizon)
              float extinction = smoothstep(-0.02, 0.15, alt);
              visibility *= extinction;
            }
            
            // Fade out stars fainter than the limiting magnitude
            float magFade = 1.0 - smoothstep(uLimitingMag - 0.5, uLimitingMag + 0.5, mag);
            visibility *= magFade;
          }
          
          vVisibility = visibility * uCategoryVisibility[int(category)] * aFilterAlpha;

          // Spectral color
          vec3 baseColor = color;
          
          if (uIsPlanetarium > 0.5) {
             vec3 starDir = normalize(worldPos.xyz - uObserverPos);
             float alt = dot(starDir, uUpDir);
             
             // Reddening near horizon
             float extinction = pow(1.0 - max(0.0, alt), 3.0) * 0.8;
             baseColor = mix(baseColor, vec3(1.0, 0.6, 0.4), extinction);
             // Naked eye desaturates colors for faint stars!
             float desaturation = smoothstep(1.5, 5.0, mag);
             vec3 luma = vec3(dot(baseColor, vec3(0.299, 0.587, 0.114)));
             baseColor = mix(baseColor, luma, desaturation * 0.9); // Mostly white for faint stars
          }
          vColor = baseColor;
          
          vec4 mvPos = viewMatrix * worldPos;
          
          // Twinkle effect (random phase based on position)
          float twinkle = 1.0;
          if (uIsPlanetarium > 0.5) {
            float phase = position.x * 0.5 + position.y * 0.3 + position.z * 0.1;
            float sineWave = sin(uTime * 4.0 + phase);
            twinkle = 0.5 + 0.5 * (sineWave * 0.5 + 0.5); // Smoother, less aggressive twinkle
          }
          
          float sizeMultiplier = 1.0;
          if (uTelescopeMode > 0.5 && aFilterAlpha > 0.9 && mag < 4.5) {
            // Gentle blink for the main stars connected by lines
            float phase = position.x * 0.5 + position.y * 0.3;
            float pulse = sin(uTime * 4.0 + phase);
            twinkle = 0.7 + 0.8 * (pulse * 0.5 + 0.5); // 0.7x to 1.5x brightness
            sizeMultiplier = 1.0 + 0.3 * (pulse * 0.5 + 0.5); // 1.0x to 1.3x size
          }
          // Registered stars look exactly like normal stars; no special highlighting.

          vColor = baseColor;
          vTwinkle = twinkle;
          
          // Fixed pixel size for stars so they remain visible regardless of distance, giving a true point-light feel
          gl_PointSize = max(1.5, size * vTwinkle * uPixelRatio) * sizeMultiplier;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vTwinkle;
        varying float vVisibility;
        varying float vIsRegistered;
        
        void main() {
          if (vVisibility < 0.01) discard;
          
          vec4 uTextureColor = texture2D(uTexture, gl_PointCoord);
          
          // Soft circular alpha
          float dist = distance(gl_PointCoord, vec2(0.5));
          float alpha = smoothstep(0.5, 0.1, dist);
          
          // Boost star colors for the bloom pass to catch them
          vec3 bloomingColor = vColor * 2.0;

          gl_FragColor = vec4(bloomingColor * uTextureColor.rgb, vVisibility * alpha * vTwinkle);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this._starMaterial = mat;

    if (this.pointsMesh) this.scene.remove(this.pointsMesh);
    this.pointsMesh = new THREE.Points(geo, mat);
    this.skyGroup.add(this.pointsMesh);

    // Build floating star name labels (Stellarium style)
    this._buildStarLabels(starData);

    // Initialize Constellations
    if (!this.constellations) {
      this.constellations = new Constellations(this.skyGroup, starData);
      this.constellations.build();
      this.constellations.hide(); // Hidden by default
    }

    // Initialize Asterisms
    if (!this.asterisms) {
      this.asterisms = new Asterisms(this.skyGroup, starData);
      this.asterisms.build();
      this.asterisms.hide();
    }
  }

  filterStars(category, subCategory) {
    if (!this.pointsMesh || !this.pointsMesh.geometry) return;
    const geo = this.pointsMesh.geometry;
    const filterAlphas = geo.attributes.aFilterAlpha.array;
    
    // Dim unselected stars so the background universe is still visible but very faint
    const DIM_OPACITY = 0.015; 
    
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      let visible = true;
      
      if (category === 'named') {
        visible = star.isNamed === true;
      } else if (category === 'constellation') {
        if (subCategory && subCategory !== 'all') {
          visible = (star.con === subCategory);
        } else {
          visible = (star.con && star.con.trim() !== '');
        }
      }
      
      filterAlphas[i] = visible ? 1.0 : DIM_OPACITY;
    }
    
    geo.attributes.aFilterAlpha.needsUpdate = true;
  }

  highlightRegisteredStars(registeredMap) {
    if (!this.stars || !this.pointsMesh) return;
    
    const geo = this.pointsMesh.geometry;
    const isRegisteredAttr = geo.attributes.aIsRegistered.array;
    
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      if (registeredMap[star.id]) {
        isRegisteredAttr[i] = 1.0;
      } else {
        isRegisteredAttr[i] = 0.0;
      }
    }
    
    geo.attributes.aIsRegistered.needsUpdate = true;
  }

  async _loadConstellationLines() {
    try {
      const res = await fetch('/data/constellations.lines.json');
      this.constellationLinesData = await res.json();
    } catch (e) {
      console.error("Failed to load constellation lines:", e);
    }
  }

  enterTelescopeMode(conId) {
    if (!this.constellationLinesData) return;

    // Clear existing lines
    while (this.constellationLinesGroup.children.length > 0) {
      const child = this.constellationLinesGroup.children[0];
      this.constellationLinesGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    const feature = this.constellationLinesData.features.find(f => f.id === conId);
    if (!feature) return;

    // Radius matching celestial grid / stars
    const radius = 3800000;

    const points = [];
    let centerX = 0, centerY = 0, centerZ = 0;
    let pointCount = 0;

    const coords = feature.geometry.coordinates;
    coords.forEach(lineString => {
      for (let i = 0; i < lineString.length; i++) {
        const [raDeg, decDeg] = lineString[i];
        
        // Convert RA/Dec to Cartesian matching HYG format:
        // HYG x = r * cos(Dec)*cos(RA), y = r * cos(Dec)*sin(RA), z = r * sin(Dec)
        // Wait, the grid uses: phi = Dec, angle = RA.
        // x = r * cos(phi)*cos(angle), y = r * sin(phi), z = r * cos(phi)*sin(angle)
        // Let's use the grid spherical coordinates:
        const phi = decDeg * Math.PI / 180;
        const raRad = raDeg * Math.PI / 180;
        const x = radius * Math.cos(phi) * Math.cos(raRad);
        const y = radius * Math.cos(phi) * Math.sin(raRad);
        const z = radius * Math.sin(phi);

        points.push(new THREE.Vector3(x, y, z));
        centerX += x; centerY += y; centerZ += z;
        pointCount++;
      }
    });

    if (pointCount > 0) {
      centerX /= pointCount;
      centerY /= pointCount;
      centerZ /= pointCount;
    }

    // Since it's a MultiLineString, we can't draw it as a single Line loop, 
    // we need to draw each lineString separately.
    const material = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    coords.forEach(lineString => {
      const linePoints = [];
      lineString.forEach(pt => {
        const raRad = pt[0] * Math.PI / 180;
        const decRad = pt[1] * Math.PI / 180;
        // In fetch_hyg: x=col17, y=col18, z=col19 (Cartesian)
        // Standard astronomical Cartesian:
        const x = radius * Math.cos(decRad) * Math.cos(raRad);
        const y = radius * Math.cos(decRad) * Math.sin(raRad);
        const z = radius * Math.sin(decRad);
        linePoints.push(new THREE.Vector3(x, y, z));
      });
      const geo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMesh = new THREE.Line(geo, material);
      this.constellationLinesGroup.add(lineMesh);
    });

    // Save camera state
    if (!this._originalCameraState) {
      this._originalCameraState = {
        position: this.camera.position.clone(),
        target: this.controls.target.clone()
      };
    }

    // Telescope View: Move camera to origin, look at constellation center
    const targetDir = new THREE.Vector3(centerX, centerY, centerZ).normalize();
    this.camera.position.set(0, 0, 0);
    this.controls.target.copy(targetDir.multiplyScalar(100)); // Target a point along the vector
    this.controls.update();

    if (this.pointsMesh) {
      this.pointsMesh.material.uniforms.uTelescopeMode.value = 1.0;
    }

    // Hide Sun and Planets to prevent occlusion from origin
    if (this.planetMeshes) {
      this.planetMeshes.forEach(pm => { if (pm.mesh) pm.mesh.visible = false; });
    }
    if (this._orbitLines) {
      Object.values(this._orbitLines).forEach(line => line.visible = false);
    }
    if (this._sunGlow) this._sunGlow.visible = false;
  }

  exitTelescopeMode() {
    // Clear lines
    while (this.constellationLinesGroup.children.length > 0) {
      const child = this.constellationLinesGroup.children[0];
      this.constellationLinesGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    // Restore camera
    if (this._originalCameraState) {
      this.camera.position.copy(this._originalCameraState.position);
      this.controls.target.copy(this._originalCameraState.target);
      this.controls.update();
      this._originalCameraState = null;
    }

    if (this.pointsMesh) {
      this.pointsMesh.material.uniforms.uTelescopeMode.value = 0.0;
    }

    // Show Sun and Planets
    if (this.planetMeshes) {
      this.planetMeshes.forEach(pm => { if (pm.mesh) pm.mesh.visible = true; });
    }
    if (this._orbitLines) {
      Object.values(this._orbitLines).forEach(line => line.visible = true);
    }
    if (this._sunGlow) this._sunGlow.visible = true;

    this.filterStars('all', 'all');
  }

  _buildStarLabels(starData) {
    // Disabled as per user request for cleaner visualization
  }

  _updateStarLabels() {
    if (!this._starLabelData || !this.isPlanetariumMode) {
      if (this._starLabelEls) this._starLabelEls.forEach(el => el.style.display = 'none');
      return;
    }
    const tempV = new THREE.Vector3();
    const upDir = this._lastUpDir || new THREE.Vector3(0,1,0);
    this.skyGroup.updateMatrixWorld();
    
    this._starLabelData.forEach(({ el, pos }) => {
      tempV.copy(pos);
      tempV.applyMatrix4(this.skyGroup.matrixWorld);
      
      const worldPos = tempV.clone();
      tempV.project(this.camera);
      
      const isBehind = tempV.z > 1;
      if (isBehind) { el.style.display = 'none'; return; }
      
      // Horizon clip
      const dir = worldPos.sub(this.camera.position).normalize();
      const alt = dir.dot(upDir);
      if (alt < 0.02) { el.style.display = 'none'; return; }
      
      const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
      const y = (tempV.y * -0.5 + 0.5) * window.innerHeight;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.display = 'block';
    });
  }

  _updatePlanetLabels(sunAlt) {
    if (!this.planetMeshes) return;
    const tempV = new THREE.Vector3();
    const upDir = this._lastUpDir || new THREE.Vector3(0,1,0);
    this.planetMeshes.forEach(pm => {
      if (!pm.mesh || !pm.mesh.visible) {
        const el = document.getElementById(`hud-marker-${pm.data.id}`);
        if (el) el.classList.add('hidden');
        return;
      }
      
      const el = document.getElementById(`hud-marker-${pm.data.id}`);
      if (!el) return;
      
      const dist = pm.mesh.position.distanceTo(this.camera.position);

      // In planetarium mode, hide Earth (we're standing on it) and hidden Sun
      if (this.isPlanetariumMode) {
        if (pm.data.id === 'Earth') { el.classList.add('hidden'); return; }
        if (pm.data.id === 'Sun' && sunAlt < 0) { el.classList.add('hidden'); return; }
      }

      // Hide if camera is too close (e.g. standing on or very near the planet) or too far
      const hideThreshold = pm.data.id === 'Earth' ? pm.data.size * 50 : pm.data.size * 15;
      if (dist < hideThreshold || dist > 4500000) {
        el.classList.add('hidden');
        return;
      }

      // Project to screen
      tempV.copy(pm.mesh.position);
      tempV.project(this.camera);
      const isBehind = tempV.z > 1;
      if (isBehind) { el.classList.add('hidden'); return; }

      // Horizon check ONLY in planetarium mode
      if (this.isPlanetariumMode) {
        const dir = pm.mesh.position.clone().sub(this.camera.position).normalize();
        const alt = dir.dot(upDir);
        if (alt < -0.02) { el.classList.add('hidden'); return; }
      }

      const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
      const y = (tempV.y * -0.5 + 0.5) * window.innerHeight;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      
      const distAu = dist / 93924.2;
      const distText = distAu < 0.1
        ? `${(distAu * 149597870.7).toFixed(0)} km`
        : `${distAu.toFixed(2)} AU`;
      const distSpan = el.querySelector('.hud-marker-dist');
      if (distSpan) distSpan.textContent = distText;
      el.classList.remove('hidden');
    });
  }

  _createStarTexture() {
    const canvas  = document.createElement('canvas');
    canvas.width  = 64;
    canvas.height = 64;
    const ctx     = canvas.getContext('2d');
    const cx = 32, cy = 32;

    // Draw a sharp core with a soft halo
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32);
    grad.addColorStop(0.0,  'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.08, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2,  'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1.0,  'rgba(255, 255, 255, 0.0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
  }

  _createTerrainSilhouetteTexture() {
    // Creates a 1D strip texture: trees/hills silhouette at the top, dark ground below
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Fully transparent background
    ctx.clearRect(0, 0, 1024, 256);

    // Draw dark ground fill (bottom 70%)
    const groundY = 80; // Where the tree line starts
    ctx.fillStyle = '#030508';
    ctx.fillRect(0, groundY, 1024, 256 - groundY);

    // Draw procedural tree/hill silhouette along the top edge
    ctx.fillStyle = '#030508';
    ctx.beginPath();
    ctx.moveTo(0, groundY);

    for (let x = 0; x <= 1024; x += 2) {
      // Large rolling hills
      const hill1 = Math.sin(x * 0.006) * 18;
      const hill2 = Math.sin(x * 0.015 + 1.2) * 10;
      const hill3 = Math.sin(x * 0.003 + 0.5) * 25;

      // Individual trees (spiky noise)
      const tree1 = Math.sin(x * 0.12) * 6 * (0.5 + 0.5 * Math.sin(x * 0.008));
      const tree2 = Math.sin(x * 0.25 + 3.0) * 4 * (0.5 + 0.5 * Math.sin(x * 0.01 + 2.0));
      const tree3 = Math.sin(x * 0.5 + 1.5) * 2;

      // Random fine detail
      const noise = (Math.random() - 0.5) * 3;

      const y = groundY - hill1 - hill2 - hill3 - Math.max(0, tree1) - Math.max(0, tree2) - Math.abs(tree3) + noise;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(1024, groundY);
    ctx.closePath();
    ctx.fill();

    // Subtle green-brown tint on the very top edge of the treeline for realism
    const edgeGrad = ctx.createLinearGradient(0, groundY - 50, 0, groundY + 10);
    edgeGrad.addColorStop(0, 'rgba(15, 30, 15, 0.0)');
    edgeGrad.addColorStop(0.4, 'rgba(15, 30, 15, 0.35)');
    edgeGrad.addColorStop(1, 'rgba(5, 8, 5, 0.0)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, groundY - 50, 1024, 60);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  _createEarth() {
    // Earth is now created in addPlanets dynamically based on astronomy-engine data.
    // We just keep ambient light. The Sun is a PointLight in addPlanets.
    const ambientLight = new THREE.AmbientLight(0x112244, 0.02); // Very dim - space has almost no ambient
    this.scene.add(ambientLight);
  }

  _createTelescopeUI() {}
  toggleTelescopeMode() {}
  _createGasGiantTexture(planetId) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (planetId === 'Uranus') {
      // Uranus: Soft, pale cyan-blue with very subtle banding and polar bright zones
      for (let y = 0; y < canvas.height; y++) {
        const lat = (y / canvas.height) * Math.PI - Math.PI / 2;
        let r = 175;
        let g = 228;
        let b = 233;

        const band = Math.sin(lat * 8.0) * Math.cos(lat * 3.0);
        r += band * 6;
        g += band * 4;
        b += band * 3;

        const polarBright = Math.pow(Math.abs(Math.sin(lat)), 1.5);
        r += polarBright * 18;
        g += polarBright * 12;
        b += polarBright * 8;

        ctx.fillStyle = `rgb(${Math.min(255, Math.floor(r))}, ${Math.min(255, Math.floor(g))}, ${Math.min(255, Math.floor(b))})`;
        ctx.fillRect(0, y, canvas.width, 1);
      }
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let i = 0; i < 15; i++) {
        const y = Math.random() * canvas.height;
        const h = 4 + Math.random() * 12;
        ctx.fillRect(0, y, canvas.width, h);
      }
    } else if (planetId === 'Neptune') {
      // Neptune: Deep royal blue with darker bands and bright white/cyan clouds
      for (let y = 0; y < canvas.height; y++) {
        const lat = (y / canvas.height) * Math.PI - Math.PI / 2;
        let r = 25;
        let g = 65;
        let b = 185;

        const band = Math.sin(lat * 10.0) * Math.cos(lat * 4.0);
        r += band * 12;
        g += band * 15;
        b += band * 25;

        const polarDark = Math.pow(Math.abs(Math.sin(lat)), 2.0);
        r -= polarDark * 10;
        g -= polarDark * 20;
        b -= polarDark * 45;

        ctx.fillStyle = `rgb(${Math.max(0, Math.floor(r))}, ${Math.max(0, Math.floor(g))}, ${Math.max(0, Math.floor(b))})`;
        ctx.fillRect(0, y, canvas.width, 1);
      }

      ctx.fillStyle = 'rgba(100, 200, 255, 0.08)';
      for (let i = 0; i < 8; i++) {
        const y = canvas.height * 0.3 + Math.random() * canvas.height * 0.4;
        const x = Math.random() * canvas.width;
        const w = 150 + Math.random() * 250;
        const h = 3 + Math.random() * 8;
        
        const grad = ctx.createLinearGradient(x, 0, x + w, 0);
        grad.addColorStop(0, 'rgba(100, 200, 255, 0)');
        grad.addColorStop(0.5, 'rgba(180, 220, 255, 0.15)');
        grad.addColorStop(1, 'rgba(100, 200, 255, 0)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
        if (x + w > canvas.width) {
          ctx.fillRect(x - canvas.width, y, w, h);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  _createCityLightsTexture(earthImage) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Draw earth image to inspect pixels
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 512;
    tempCanvas.height = 256;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(earthImage, 0, 0, 512, 256);
    
    const imgData = tempCtx.getImageData(0, 0, 512, 256);
    const pixels = imgData.data;
    
    // Clear canvas to black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1024, 512);
    
    const outImgData = ctx.createImageData(1024, 512);
    const outPixels = outImgData.data;
    
    const cities = [
      { x: 280, y: 160, size: 25 },  // East Coast US (New York/Boston)
      { x: 500, y: 140, size: 30 },  // Western Europe (London/Paris)
      { x: 835, y: 162, size: 28 },  // Tokyo/Japan
      { x: 690, y: 202, size: 22 },  // India (Mumbai/Delhi)
      { x: 740, y: 190, size: 25 },  // Eastern China (Shanghai/Beijing)
      { x: 330, y: 380, size: 15 },  // Rio de Janeiro/Sao Paulo
      { x: 520, y: 240, size: 12 },  // Cairo/Egypt
      { x: 560, y: 350, size: 10 },  // Johannesburg
      { x: 890, y: 395, size: 15 },  // Sydney/Melbourne
      { x: 170, y: 175, size: 20 },  // US West Coast (LA/SF)
      { x: 240, y: 190, size: 12 },  // Chicago
      { x: 580, y: 165, size: 15 },  // Moscow
      { x: 790, y: 245, size: 10 }   // Singapore
    ];
    
    for (let y = 0; y < 512; y++) {
      const srcY = Math.floor(y / 2);
      for (let x = 0; x < 1024; x++) {
        const srcX = Math.floor(x / 2);
        const idx = (srcY * 512 + srcX) * 4;
        const r = pixels[idx];
        const g = pixels[idx+1];
        const b = pixels[idx+2];
        
        // Detect land
        const isOcean = (b > r * 1.1 && b > 80 && r < 70) || (r < 25 && g < 40 && b > 50);
        const isLand = !isOcean;
        
        const outIdx = (y * 1024 + x) * 4;
        
        if (isLand) {
          let cityInfluence = 0;
          for (let i = 0; i < cities.length; i++) {
            const c = cities[i];
            const dx = x - c.x;
            const dy = y - c.y;
            const distSq = dx*dx + dy*dy;
            const rSq = c.size * c.size;
            if (distSq < rSq * 4.0) {
              const dist = Math.sqrt(distSq);
              cityInfluence += Math.max(0, 1.0 - dist / (c.size * 2.0));
            }
          }
          
          const noise = Math.sin(x * 0.9) * Math.cos(y * 1.1) * Math.sin(x * 0.2 + y * 0.3);
          
          if (cityInfluence > 0.1 || (noise > 0.85 && Math.random() < 0.2)) {
            const intensity = Math.min(1.0, cityInfluence * 0.75 + (noise * 0.25 + 0.25));
            outPixels[outIdx]   = Math.floor(255 * intensity);
            outPixels[outIdx+1] = Math.floor(190 * intensity * 0.95);
            outPixels[outIdx+2] = Math.floor(110 * intensity * 0.65);
            outPixels[outIdx+3] = 255;
          } else {
            outPixels[outIdx]   = 0;
            outPixels[outIdx+1] = 0;
            outPixels[outIdx+2] = 0;
            outPixels[outIdx+3] = 255;
          }
        } else {
          outPixels[outIdx]   = 0;
          outPixels[outIdx+1] = 0;
          outPixels[outIdx+2] = 0;
          outPixels[outIdx+3] = 255;
        }
      }
    }
    
    ctx.putImageData(outImgData, 0, 0);
    
    cities.forEach(c => {
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size * 1.5);
      grad.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
      grad.addColorStop(0.3, 'rgba(255, 180, 80, 0.15)');
      grad.addColorStop(1, 'rgba(255, 180, 80, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  _createCloudsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 1024, 512);
    
    const imgData = ctx.createImageData(1024, 512);
    const pixels = imgData.data;
    
    for (let y = 0; y < 512; y++) {
      const lat = (y / 512) * Math.PI - Math.PI / 2;
      for (let x = 0; x < 1024; x++) {
        let n = 0;
        n += 0.50 * (Math.sin(x * 0.05) * Math.cos(y * 0.04) * Math.sin(x * 0.01 + y * 0.02));
        n += 0.25 * (Math.sin(x * 0.12 + y * 0.08) * Math.cos(x * 0.06 - y * 0.15));
        n += 0.15 * (Math.sin(x * 0.35 - y * 0.25) * Math.cos(x * 0.18 + y * 0.40));
        n += 0.10 * (Math.sin(x * 0.80 + y * 0.60) * Math.cos(x * 0.45 - y * 0.75));
        
        n = (n + 1.0) * 0.5;
        
        const band = 0.45 + 0.5 * Math.sin(lat * 5.0) * Math.cos(lat * 2.0);
        const density = Math.max(0, n * band - 0.22) * 1.55;
        
        const idx = (y * 1024 + x) * 4;
        const val = Math.min(255, Math.floor(220 + 35 * density));
        
        pixels[idx]   = val;
        pixels[idx+1] = val;
        pixels[idx+2] = Math.min(255, val + 15);
        pixels[idx+3] = Math.min(255, Math.floor(density * 255));
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }


  // Real orbital periods (days) for sampling orbit path
  static ORBITAL_PERIODS = {
    Mercury: 87.97,
    Venus:   224.70,
    Earth:   365.25,
    Mars:    686.97,
    Jupiter: 4332.59,
    Saturn:  10759.22,
    Uranus:  30688.50,
    Neptune: 60182.0,
  };

  // Real axial tilts (degrees from perpendicular to orbit)
  static AXIAL_TILTS = {
    Mercury: 0.034,
    Venus:   177.4,
    Earth:   23.44,
    Mars:    25.19,
    Jupiter: 3.13,
    Saturn:  26.73,
    Uranus:  97.77,
    Neptune: 28.32,
    Moon:    6.68,
  };

  _computeOrbitPath(planetDef, baseDate) {
    // getPlanetsData is imported at top of file
    const period = StarRenderer.ORBITAL_PERIODS[planetDef.id];
    if (!period) return [];
    const steps  = 180;
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const offsetDays = (i / steps) * period;
      const sampleDate = new Date(baseDate.getTime() + offsetDays * 86400000);
      try {
        const data = getPlanetsData(sampleDate);
        const pData = data.find(d => d.id === planetDef.id);
        if (pData) points.push(pData.position.clone());
      } catch(e) { /* skip */ }
    }
    return points;
  }

  addPlanets(planetsData) {
    this.planets = planetsData;
    const loader = new THREE.TextureLoader();
    this.planetMeshes = [];

    // Create HUD container in DOM if not exists
    let hudContainer = document.getElementById('hud-container');
    if (!hudContainer) {
      hudContainer = document.createElement('div');
      hudContainer.id = 'hud-container';
      document.body.appendChild(hudContainer);
    }
    hudContainer.innerHTML = '';

    planetsData.forEach(p => {
      const { x, y, z } = p.position;
      const isHighRes = (p.id === 'Earth' || p.id === 'Moon' || p.id === 'Jupiter');
      const geo = new THREE.SphereGeometry(p.size, isHighRes ? 128 : 64, isHighRes ? 128 : 64);
      let mat;

      // Real elliptical orbit path — sample planet position over one full orbit
      if (p.id !== 'Sun' && p.id !== 'Moon') {
        const orbitPoints = this._computeOrbitPath(p, new Date(this.simulationTime));
        if (orbitPoints.length > 1) {
          const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
          const orbitMat = new THREE.LineBasicMaterial({
            color: 0x2255aa,
            transparent: true,
            opacity: 0.28,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
          this.skyGroup.add(orbitLine);
          // Store for later update
          if (!this._orbitLines) this._orbitLines = {};
          this._orbitLines[p.id] = orbitLine;
        }
      }

      if (p.id === 'Sun') {
        mat = new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color('#ffcc00') },
            uTime:  { value: 0.0 }
          },
          vertexShader: /* glsl */`
            varying vec3 vNorm;
            varying vec3 vPos;
            void main() {
              vNorm = normalize(normalMatrix * normal);
              vPos  = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: /* glsl */`
            uniform vec3  uColor;
            uniform float uTime;
            varying vec3  vNorm;
            varying vec3  vPos;

            /* ---- value noise helpers ---- */
            float h(vec3 p) {
              p = fract(p * 0.3183099 + 0.1);
              p *= 17.0;
              return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }
            float vnoise(vec3 p) {
              vec3 i = floor(p);
              vec3 f = fract(p);
              f = f*f*(3.0-2.0*f);
              float a = h(i);
              float b = h(i+vec3(1.0, 0.0, 0.0));
              float c = h(i+vec3(0.0, 1.0, 0.0));
              float d = h(i+vec3(1.0, 1.0, 0.0));
              float e = h(i+vec3(0.0, 0.0, 1.0));
              float g = h(i+vec3(1.0, 0.0, 1.0));
              float k = h(i+vec3(0.0, 1.0, 1.0));
              float m = h(i+vec3(1.0, 1.0, 1.0));
              return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),
                         mix(mix(e,g,f.x),mix(k,m,f.x),f.y), f.z);
            }
            float fbm(vec3 p) {
              float v = 0.0, amp = 0.5;
              for (int i = 0; i < 6; i++) {
                v += amp * vnoise(p);
                p *= 2.01;
                amp *= 0.5;
              }
              return v;
            }
            /* ---- main ---- */
            void main() {
              vec3 p = normalize(vPos) * 6.0; // Higher frequency for detail

              /* animated turbulence */
              float t1 = fbm(p + vec3(uTime*0.08, uTime*0.05, uTime*0.06));
              float t2 = fbm(p * 2.5 - vec3(uTime*0.04, uTime*0.01, uTime*0.05));
              float t3 = fbm(p * 5.0 + vec3(0.0, 0.0, uTime*0.03));

              /* granulation cells */
              float cells = fbm(p * 15.0 + vec3(uTime*0.02));
              float bright = smoothstep(0.3, 0.7, cells);

              /* combine */
              float r = (t1 + t2 + t3*0.5) * 0.4;

              /* colour layers: lava crust → deep red → fiery orange → bright yellow */
              vec3 lavaCrust = vec3(0.15, 0.0, 0.0);
              vec3 deepRed   = vec3(0.65, 0.05, 0.0);
              vec3 fieryOrange = vec3(1.0, 0.3, 0.0);
              vec3 whiteHot  = vec3(1.0, 0.9, 0.3);

              vec3 col = mix(lavaCrust, deepRed, smoothstep(0.1, 0.4, r + bright*0.2));
              col = mix(col, fieryOrange, smoothstep(0.4, 0.7, r + bright*0.4));
              col = mix(col, whiteHot, smoothstep(0.7, 0.95, r + bright*0.5));

              /* realistic limb darkening */
              float viewAngle = max(0.0, dot(vNorm, vec3(0.0, 0.0, 1.0)));
              float limb = pow(viewAngle, 0.35); // Solar limb darkening profile

              gl_FragColor = vec4(col * limb * 1.5, 1.0); // Vivid brightness
            }
          `,
          transparent: false
        });
        this._sunMat = mat;

        // Add subtle corona glow
        const glowGeo = new THREE.SphereGeometry(p.size * 1.25, 64, 64); // Increased corona size
        const glowMat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0.0 }
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            varying vec3 vNormal;
            varying vec3 vPosition;

            // Simple 3D noise for corona spikes
            float hash(vec3 p) {
              p = fract(p * 0.3183099 + 0.1);
              p *= 17.0;
              return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }
            float noise(vec3 x) {
              vec3 i = floor(x);
              vec3 f = fract(x);
              f = f * f * (3.0 - 2.0 * f);
              return mix(mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
                             mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                         mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
                             mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
            }

            void main() {
              float viewAngle = dot(vNormal, vec3(0.0, 0.0, 1.0));
              // Edge intensity for scattering glow (softer, thicker corona)
              float edge = pow(max(0.0, 1.0 - viewAngle), 2.2);
              
              // Dynamic solar wind spikes
              vec3 p = normalize(vPosition) * 5.0;
              float n1 = noise(p * 1.2 - vec3(0.0, uTime * 0.3, uTime * 0.1));
              float n2 = noise(p * 2.5 + vec3(uTime * 0.2, 0.0, 0.0));
              float spikes = 0.4 + 0.6 * sin((n1 + n2 * 0.5) * 6.28);
              
              vec3 coronaOuter = vec3(0.85, 0.15, 0.0); // Rich deep red
              vec3 coronaInner = vec3(1.0, 0.5, 0.05);  // Fiery orange/yellow
              
              vec3 finalColor = mix(coronaOuter, coronaInner, spikes * edge);
              
              gl_FragColor = vec4(finalColor, 1.0) * edge * spikes * 0.8; // Stronger, beautiful glow
            }
          `,
          side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(x, y, z);
        this.skyGroup.add(glow);
        this._sunGlow = glow; // Track for planetarium horizon-based visibility

        // Realistic sunlight — zero decay, placed at the Sun (origin) so ALL planets are lit from the correct angle
        this._sunLight = new THREE.PointLight(0xfff8f0, 2.2, 0, 0); // Calibrated sunlight intensity
        this._sunLight.position.set(0, 0, 0); 
        this.skyGroup.add(this._sunLight);

        // Removed Lensflare completely because it was masking the beautiful Sun shader with a flat white circle

      } else if (p.id === 'Moon') {
        // Attractive and Realistic Moon Material
        mat = new THREE.MeshStandardMaterial({
          roughness: 0.85,  // Slightly less rough to catch more light beautifully
          metalness: 0.0,  // Non-metallic
          color: 0xffffff, // Pure white base
          emissive: 0xffffff, // Add earthshine
          emissiveIntensity: 0.55 // Maximum realistic brightness without blowing out details
        });
        const tl = new THREE.TextureLoader();
        tl.load(
          p.texture,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            mat.map = tex;
            mat.emissiveMap = tex; // Make the dark side show crater details softly
            mat.bumpMap = tex; 
            mat.bumpScale = 0.035; // Increased bump for better realism and shadow play
            mat.needsUpdate = true;
          }
        );
      } else if (p.id === 'Earth') {
        // ── Clean, Reliable, Realistic Earth ──
        // MeshPhongMaterial provides excellent handling of specular maps for ocean reflections
        mat = new THREE.MeshPhongMaterial({
          color:            0xffffff,
          specular:         new THREE.Color(0x333333), // Shine strength for oceans
          shininess:        35, // Glossiness of the water
        });

        const tl = new THREE.TextureLoader();

        // Load day (color) texture
        tl.load(
          p.texture,
          (dayTex) => {
            dayTex.colorSpace = THREE.SRGBColorSpace;
            mat.map = dayTex;
            mat.needsUpdate = true;
          },
          undefined,
          (err) => console.error('Earth day texture failed:', err)
        );

        // Normal map — deep terrain depth
        tl.load('/textures/earth_normal.jpg', (nrm) => {
          mat.normalMap = nrm;
          mat.normalScale.set(3.0, 3.0); // Dramatically increased depth for realism
          mat.needsUpdate = true;
        });

        // Specular map — makes oceans reflect the sun beautifully while land stays matte
        tl.load('/textures/earth_specular.jpg', (spec) => {
          mat.specularMap = spec;
          mat.needsUpdate = true;
        });

        this._earthMat = mat;
      } else {
        mat = new THREE.MeshPhongMaterial({ shininess: 5 });
      }

      if (p.id === 'Uranus' || p.id === 'Neptune') {
        mat.map = this._createGasGiantTexture(p.id);
        mat.needsUpdate = true;
      } else if (p.id !== 'Earth' && p.id !== 'Moon') {
        loader.load(p.texture, (tex) => {
          mat.map = tex;
          mat.needsUpdate = true;
        });
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      
      if (p.id === 'Sun') {
        this._createSunSolarFlares(mesh, p.size);
      }
      
      // Attach Distant Star Sprite
      if (p.id !== 'Sun' && p.id !== 'Moon') {
        const spriteMat = new THREE.SpriteMaterial({
          map: this._createGlowTexture(),
          color: p.color || 0xddddff,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: false // Keeps it the same pixel size on screen at any distance!
        });
        const starSprite = new THREE.Sprite(spriteMat);
        // Base screen size (will scale slightly with planet size)
        const baseSize = 0.015; 
        starSprite.scale.set(baseSize, baseSize, 1);
        
        mesh.userData.starSprite = starSprite;
        mesh.add(starSprite);
      }

      // Planet Tilts
      if (p.id === 'Saturn') {
        mesh.rotation.z = 26.73 * Math.PI / 180;

        // Create Saturn Rings with realistic details and planet shadow
        const innerRadius = p.size * 1.35;
        const outerRadius = p.size * 2.3;
        const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        const ringMat = new THREE.ShaderMaterial({
          vertexShader: `
            varying vec3 vLocalPos;
            void main() {
              vLocalPos = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vLocalPos;
            uniform float uInner;
            uniform float uOuter;
            uniform vec3 uLightDirLocal;
            uniform float uPlanetRadius;
            void main() {
              float d = length(vLocalPos.xy);
              if (d < uInner || d > uOuter) discard;
              
              float r = (d - uInner) / (uOuter - uInner);
              vec3 baseColor = vec3(0.85, 0.78, 0.68); // Warm, dusty ring color
              
              float bands = 0.5 + 0.5 * sin(r * 40.0) * sin(r * 15.0) * cos(r * 100.0);
              vec3 col = baseColor * (0.85 + 0.2 * bands);
              
              float alpha = 0.85 * (0.6 + 0.4 * sin(r * 25.0) * cos(r * 80.0));
              if (r > 0.46 && r < 0.52) alpha *= 0.05; // Cassini division
              if (r > 0.82 && r < 0.84) alpha *= 0.1;  // Encke Gap
              
              alpha *= smoothstep(0.0, 0.08, r);
              alpha *= smoothstep(1.0, 0.92, r);
              
              // Shadow of Saturn on its rings
              // The ring geometry is flat on XY, but rotated by pi/2 on X,
              // so in local space it lies on the X-Z plane: (x, 0.0, y)
              vec3 pLocal = vec3(vLocalPos.x, 0.0, vLocalPos.y);
              float dotL = dot(pLocal, uLightDirLocal);
              if (dotL > 0.0) { // shadow side
                vec3 proj = dotL * uLightDirLocal;
                float distToAxis = length(pLocal - proj);
                if (distToAxis < uPlanetRadius) {
                  float shadowFactor = smoothstep(uPlanetRadius - 1.5, uPlanetRadius, distToAxis);
                  col *= mix(0.12, 1.0, shadowFactor);
                  alpha *= mix(0.7, 1.0, shadowFactor);
                }
              }
              
              gl_FragColor = vec4(col, alpha);
            }
          `,
          uniforms: {
            uInner: { value: innerRadius },
            uOuter: { value: outerRadius },
            uLightDirLocal: { value: new THREE.Vector3(1, 0, 0) },
            uPlanetRadius: { value: p.size }
          },
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false // Fixes stars disappearing behind rings
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2; // Flat relative to planet's equator
        mesh.add(ringMesh);

        // Keep reference to Saturn's ring to update lighting in render loop
        this.saturnRing = ringMesh;

        // Saturn Atmosphere Glow
        const atmosGeo = new THREE.SphereGeometry(p.size * 1.06, 32, 32);
        const atmosMat = new THREE.ShaderMaterial({
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
              gl_FragColor = vec4(0.85, 0.75, 0.55, 1.0) * intensity * 1.5;
            }
          `,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false
        });
        const saturnAtmos = new THREE.Mesh(atmosGeo, atmosMat);
        mesh.add(saturnAtmos);
      }

      if (p.id === 'Uranus') {
        mesh.rotation.z = 97.77 * Math.PI / 180;

        // Uranus vertical ring system (13 thin, sharp rings)
        const innerRadius = p.size * 1.35;
        const outerRadius = p.size * 2.15;
        const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        const ringMat = new THREE.ShaderMaterial({
          vertexShader: `
            varying vec3 vLocalPos;
            void main() {
              vLocalPos = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vLocalPos;
            uniform float uInner;
            uniform float uOuter;
            void main() {
              float d = length(vLocalPos.xy);
              if (d < uInner || d > uOuter) discard;
              
              float r = (d - uInner) / (uOuter - uInner);
              vec3 baseColor = vec3(0.55, 0.78, 0.92);
              
              // Multi-band narrow rings pattern
              float ringPattern = step(0.65, sin(r * 80.0) * cos(r * 25.0));
              if (ringPattern < 0.1) discard;
              
              float alpha = 0.4 * ringPattern;
              alpha *= smoothstep(0.0, 0.05, r);
              alpha *= smoothstep(1.0, 0.95, r);
              
              gl_FragColor = vec4(baseColor, alpha);
            }
          `,
          uniforms: {
            uInner: { value: innerRadius },
            uOuter: { value: outerRadius }
          },
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2; // Flat relative to equator
        mesh.add(ringMesh);

        // Uranus Atmosphere Glow
        const atmosGeo = new THREE.SphereGeometry(p.size * 1.05, 32, 32);
        const atmosMat = new THREE.ShaderMaterial({
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
              gl_FragColor = vec4(0.4, 0.8, 0.95, 1.0) * intensity * 1.6;
            }
          `,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false
        });
        const uranusAtmos = new THREE.Mesh(atmosGeo, atmosMat);
        mesh.add(uranusAtmos);
      }

      if (p.id === 'Jupiter') {
        // Jupiter Atmosphere Glow
        const atmosGeo = new THREE.SphereGeometry(p.size * 1.05, 32, 32);
        const atmosMat = new THREE.ShaderMaterial({
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
              gl_FragColor = vec4(0.9, 0.72, 0.55, 1.0) * intensity * 1.5;
            }
          `,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false
        });
        const jupiterAtmos = new THREE.Mesh(atmosGeo, atmosMat);
        mesh.add(jupiterAtmos);
      }

      if (p.id === 'Neptune') {
        // Neptune Atmosphere Glow
        const atmosGeo = new THREE.SphereGeometry(p.size * 1.05, 32, 32);
        const atmosMat = new THREE.ShaderMaterial({
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
              gl_FragColor = vec4(0.2, 0.45, 0.95, 1.0) * intensity * 1.6;
            }
          `,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false
        });
        const neptuneAtmos = new THREE.Mesh(atmosGeo, atmosMat);
        mesh.add(neptuneAtmos);
      }

      this.skyGroup.add(mesh);
      this.planetMeshes.push({ data: p, mesh });

      // Save Earth reference and attach atmosphere
      if (p.id === 'Earth') {
        this.earth = mesh;

        // Higher-res cloud layer
        try {
          const cloudGeo = new THREE.SphereGeometry(p.size * 1.012, 128, 128);
          const cloudTex = this._createCloudsTexture();
          const cloudMat = new THREE.MeshPhongMaterial({
            map: cloudTex,
            transparent: true,
            opacity: 0.55,
            blending: THREE.NormalBlending,
            depthWrite: false,
            side: THREE.FrontSide,
          });
          this.earthClouds = new THREE.Mesh(cloudGeo, cloudMat);
          mesh.add(this.earthClouds);
        } catch (e) {
          console.error('Failed to create clouds:', e);
        }

        // Physically accurate multi-layer atmosphere
        // Inner glow (blue)
        const atmosGeo = new THREE.SphereGeometry(p.size * 1.04, 64, 64);
        const atmosMat = new THREE.ShaderMaterial({
          uniforms: {
            uSunDir:    { value: new THREE.Vector3(1, 0, 0) },
            uDayColor:  { value: new THREE.Color(0x4488ff) },
            uDawnColor: { value: new THREE.Color(0xff8844) },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vWorldPos;
            void main() {
              vNormal   = normalize(mat3(modelMatrix) * normal);
              vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
              gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPos, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 uSunDir;
            uniform vec3 uDayColor;
            uniform vec3 uDawnColor;
            varying vec3 vNormal;
            varying vec3 vWorldPos;
            void main() {
              vec3 viewDir = normalize(cameraPosition - vWorldPos);
              float rim    = 1.0 - abs(dot(vNormal, viewDir));
              rim = pow(rim, 3.5);

              float NdotS  = dot(normalize(vNormal), normalize(uSunDir));
              float dawn   = smoothstep(-0.3, 0.3, NdotS);

              vec3 color   = mix(uDawnColor, uDayColor, dawn);
              float alpha  = rim * (0.4 + 0.6 * smoothstep(-0.5, 0.5, NdotS));
              gl_FragColor = vec4(color * rim, alpha * 0.85);
            }
          `,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        });
        this._atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
        this._atmosphereMat = atmosMat;
        this.skyGroup.add(this._atmosphere);
      }

      // Apply real axial tilt to planet
      const tiltDeg = StarRenderer.AXIAL_TILTS[p.id] || 0;
      if (tiltDeg !== 0) {
        mesh.rotation.z = tiltDeg * (Math.PI / 180);
      }

      // Add HUD marker in DOM
      if (p.id !== 'Sun' && p.id !== 'Moon') {
        const marker = document.createElement('div');
        marker.className = 'hud-planet-marker hidden';
        marker.id = `hud-marker-${p.id}`;
        marker.innerHTML = `
          <div class="hud-reticle"></div>
          <div class="hud-marker-dot"></div>
          <div class="hud-marker-label">${p.id}</div>
          <div class="hud-marker-dist">0 AU</div>
        `;
        marker.addEventListener('click', (e) => {
          e.stopPropagation(); // prevent triggering other clicks
          // Only select, do not fly immediately
          if (this.onPlanetMarkerClick) {
            this.onPlanetMarkerClick(p);
          }
        });
        
        // Use the new hud-targeting-layer
        const targetLayer = document.getElementById('hud-targeting-layer') || hudContainer;
        targetLayer.appendChild(marker);
      }
    });

    // Build Earth map features (graticule + city labels)
    if (this.earth) {
      // this._createEarthGraticule(this.earth, 4.0); // Removed Earth grid lines
      // this._createCityMarkers(this.earth, 4.0); // Removed Earth city/country names
    }

    // Build live telemetry overlay panel
    this._buildTelemetryPanel();
    this._buildEarthZoomOverlay();
  }

  _createGlowTexture() {
    if (this._sharedGlowTex) return this._sharedGlowTex;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    this._sharedGlowTex = new THREE.CanvasTexture(canvas);
    return this._sharedGlowTex;
  }

  _createLensflareTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const center = 256;
    
    if (type === 'core') {
      const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.1, 'rgba(255,255,255,0.9)');
      grad.addColorStop(0.3, 'rgba(255,255,255,0.4)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    } else if (type === 'ghost') {
      // Hexagonal ghost
      ctx.beginPath();
      for(let i=0; i<6; i++) {
        const angle = i * Math.PI / 3;
        ctx.lineTo(center + 200 * Math.cos(angle), center + 200 * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  // ── Earth Graticule (Lat/Lon grid) ──────────────────────────────────────
  _createEarthGraticule(earthMesh, radius) {
    const group = new THREE.Group();
    const matMinor = new THREE.LineBasicMaterial({
      color: 0x00aaff, transparent: true, opacity: 0.18,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const matMajor = new THREE.LineBasicMaterial({
      color: 0x33ccff, transparent: true, opacity: 0.38,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });

    // Latitude circles every 10°
    for (let lat = -80; lat <= 80; lat += 10) {
      const isMajor = lat % 30 === 0;
      const phi = (90 - lat) * Math.PI / 180;
      const r   = radius * Math.sin(phi);
      const y   = radius * Math.cos(phi);
      const pts = [];
      for (let i = 0; i <= 72; i++) {
        const theta = (i / 72) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.LineLoop(geo, isMajor ? matMajor : matMinor));
    }

    // Longitude lines every 10°
    for (let lon = 0; lon < 360; lon += 10) {
      const isMajor = lon % 30 === 0;
      const lonRad  = lon * Math.PI / 180;
      const pts     = [];
      for (let i = 0; i <= 64; i++) {
        const phi = (i / 64) * Math.PI; // 0 → π (pole to pole)
        pts.push(new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(lonRad),
          radius * Math.cos(phi),
          -radius * Math.sin(phi) * Math.sin(lonRad)
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(geo, isMajor ? matMajor : matMinor));
    }

    group.visible = false;
    earthMesh.add(group);      // Rotates automatically with Earth ✓
    this._graticule = group;
  }

  // ── City Dot Markers (3D dots on Earth surface) ─────────────────────────
  static CITIES = [
    { name: 'New Delhi',    lat:  28.6, lon:  77.2, pop: 5 },
    { name: 'Mumbai',       lat:  19.1, lon:  72.9, pop: 4 },
    { name: 'London',       lat:  51.5, lon:  -0.1, pop: 5 },
    { name: 'New York',     lat:  40.7, lon: -74.0, pop: 5 },
    { name: 'Tokyo',        lat:  35.7, lon: 139.7, pop: 5 },
    { name: 'Beijing',      lat:  39.9, lon: 116.4, pop: 5 },
    { name: 'Sydney',       lat: -33.9, lon: 151.2, pop: 4 },
    { name: 'Dubai',        lat:  25.2, lon:  55.3, pop: 4 },
    { name: 'Paris',        lat:  48.9, lon:   2.3, pop: 4 },
    { name: 'Moscow',       lat:  55.8, lon:  37.6, pop: 4 },
    { name: 'Los Angeles',  lat:  34.0, lon:-118.2, pop: 4 },
    { name: 'São Paulo',    lat: -23.5, lon: -46.6, pop: 4 },
    { name: 'Cairo',        lat:  30.0, lon:  31.2, pop: 4 },
    { name: 'Singapore',    lat:   1.3, lon: 103.8, pop: 4 },
    { name: 'Lagos',        lat:   6.5, lon:   3.4, pop: 3 },
    { name: 'Nairobi',      lat:  -1.3, lon:  36.8, pop: 3 },
    { name: 'Toronto',      lat:  43.7, lon: -79.4, pop: 3 },
    { name: 'Buenos Aires', lat: -34.6, lon: -58.4, pop: 3 },
  ];

  _latLonToLocal(lat, lon, radius) {
    // Three.js SphereGeometry UV: longitude L → local (cos L, *, -sin L) at equator
    const phi    = (90 - lat) * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(lonRad),
      radius * Math.cos(phi),
      -radius * Math.sin(phi) * Math.sin(lonRad)
    );
  }

  _createCityMarkers(earthMesh, radius) {
    this._cityGroup = new THREE.Group();
    this._cityGroup.visible = false;
    const dotGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, depthWrite: false });

    StarRenderer.CITIES.forEach(city => {
      const localPos = this._latLonToLocal(city.lat, city.lon, radius * 1.002);
      const dot = new THREE.Mesh(dotGeo, dotMat.clone());
      dot.position.copy(localPos);
      dot.userData.cityName = city.name;
      this._cityGroup.add(dot);
    });

    earthMesh.add(this._cityGroup); // Rotates with Earth ✓
    this._cityDots = this._cityGroup.children;
  }

  // ── Earth Zoom Overlay (HTML labels + info panel) ────────────────────────
  _buildEarthZoomOverlay() {
    // City label container
    let c = document.getElementById('earth-city-labels');
    if (c) c.remove();
    c = document.createElement('div');
    c.id = 'earth-city-labels';
    c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:88;';
    document.body.appendChild(c);
    this._cityLabelContainer = c;

    // Create one label per city
    this._cityLabels = StarRenderer.CITIES.map(city => {
      const el = document.createElement('div');
      el.className = 'earth-city-label';
      el.innerHTML = `<span class="city-dot-marker"></span>${city.name}`;
      el.style.cssText = `
        position:absolute;display:none;pointer-events:none;
        color:rgba(255,240,140,0.92);font-size:11px;font-family:'Inter',sans-serif;
        font-weight:500;white-space:nowrap;letter-spacing:0.03em;
        text-shadow:0 0 8px rgba(0,0,0,1),0 0 4px rgba(0,0,0,1),1px 1px 2px rgba(0,0,0,0.9);
        transform:translate(8px,-50%);
      `;
      c.appendChild(el);
      return { el, city };
    });

    // Earth zoom info pill
    let pill = document.getElementById('earth-zoom-pill');
    if (pill) pill.remove();
    pill = document.createElement('div');
    pill.id = 'earth-zoom-pill';
    pill.style.cssText = `
      position:fixed;top:80px;left:50%;transform:translateX(-50%);
      z-index:96;background:rgba(4,12,28,0.85);border:1px solid rgba(0,180,255,0.3);
      border-radius:99px;padding:8px 20px;display:none;pointer-events:none;
      backdrop-filter:blur(16px);font-family:'Inter',sans-serif;
      box-shadow:0 4px 24px rgba(0,180,255,0.15);
    `;
    pill.innerHTML = `
      <span style="font-size:12px;color:#4af;font-weight:600;letter-spacing:0.06em;">
        🌍 EARTH &nbsp;·&nbsp; <span id="earth-alt-km">—</span>
      </span>
    `;
    document.body.appendChild(pill);
    this._earthZoomPill = pill;

    // ── N/S/E/W Compass Labels ──────────────────────────────────────────────
    this._buildCompassLabels();

    // ── Exit Surface Button ─────────────────────────────────────────────────
    this._buildExitSurfaceBtn();

    // ── Leaflet Map Overlay (shown when very close to Earth surface) ──
    this._injectLeaflet();
    this._buildLeafletOverlay();
  }

  _buildCompassLabels() {
    // Remove old
    ['earth-compass-N','earth-compass-S','earth-compass-E','earth-compass-W','earth-compass-rose']
      .forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });

    const labelStyle = (color) => `
      position:fixed;display:none;pointer-events:none;z-index:92;
      font-family:'Inter',sans-serif;font-weight:800;font-size:15px;
      letter-spacing:0.04em;text-align:center;
      color:${color};
      text-shadow:0 0 12px ${color},0 0 6px rgba(0,0,0,1),1px 1px 4px rgba(0,0,0,0.95);
      transform:translate(-50%,-50%);
      transition:opacity 0.3s ease;
    `;

    const makeLabel = (id, text, color) => {
      const el = document.createElement('div');
      el.id = id;
      el.innerHTML = `<div style="font-size:18px;line-height:1;">${text[0]}</div><div style="font-size:9px;opacity:0.75;margin-top:1px;">${text.slice(1)}</div>`;
      el.style.cssText = labelStyle(color);
      document.body.appendChild(el);
      return el;
    };

    this._compassN = makeLabel('earth-compass-N', 'N▲ORTH', '#ff6b6b');
    this._compassS = makeLabel('earth-compass-S', 'S▼OUTH', '#74b9ff');
    this._compassE = makeLabel('earth-compass-E', 'E▶AST',  '#ffeaa7');
    this._compassW = makeLabel('earth-compass-W', 'W◀EST',  '#a29bfe');

    // Compass Rose widget (bottom-right corner)
    const rose = document.createElement('div');
    rose.id = 'earth-compass-rose';
    rose.style.cssText = `
      position:fixed;bottom:30px;right:30px;width:72px;height:72px;
      z-index:93;display:none;pointer-events:none;
      filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8));
      transition:opacity 0.4s ease;
    `;
    rose.innerHTML = `
      <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer ring -->
        <circle cx="36" cy="36" r="34" fill="rgba(4,12,30,0.8)" stroke="rgba(0,180,255,0.35)" stroke-width="1"/>
        <!-- Cardinal ticks -->
        <g stroke="rgba(0,180,255,0.5)" stroke-width="1">
          <line x1="36" y1="4" x2="36" y2="12"/>
          <line x1="36" y1="60" x2="36" y2="68"/>
          <line x1="4" y1="36" x2="12" y2="36"/>
          <line x1="60" y1="36" x2="68" y2="36"/>
        </g>
        <!-- North arrow (red) -->
        <polygon id="compass-arrow-n" points="36,8 32,36 36,30 40,36" fill="#ff6b6b" opacity="0.95"/>
        <!-- South arrow (blue) -->
        <polygon id="compass-arrow-s" points="36,64 32,36 36,42 40,36" fill="#74b9ff" opacity="0.9"/>
        <!-- Center dot -->
        <circle cx="36" cy="36" r="3" fill="white" opacity="0.9"/>
        <!-- N label -->
        <text id="compass-rose-n" x="36" y="6" fill="#ff6b6b" font-size="8" font-weight="800"
              font-family="Inter,sans-serif" text-anchor="middle">N</text>
        <!-- S label -->
        <text id="compass-rose-s" x="36" y="71" fill="#74b9ff" font-size="8" font-weight="700"
              font-family="Inter,sans-serif" text-anchor="middle">S</text>
        <!-- E label -->
        <text id="compass-rose-e" x="70" y="39" fill="#ffeaa7" font-size="8" font-weight="700"
              font-family="Inter,sans-serif" text-anchor="middle">E</text>
        <!-- W label -->
        <text id="compass-rose-w" x="2" y="39" fill="#a29bfe" font-size="8" font-weight="700"
              font-family="Inter,sans-serif" text-anchor="middle">W</text>
      </svg>
    `;
    document.body.appendChild(rose);
    this._compassRose = rose;

    // Store local-space anchor positions (in Earth mesh local space)
    // These rotate with Earth automatically when we call localToWorld
    const R = 4.0; // earth radius
    this._compassPoints = [
      { el: this._compassN, local: new THREE.Vector3( 0,  R * 1.12, 0)           }, // North Pole
      { el: this._compassS, local: new THREE.Vector3( 0, -R * 1.12, 0)           }, // South Pole
      { el: this._compassE, local: new THREE.Vector3( 0, 0,  -R * 1.12)          }, // 90°E equator (local -Z = East)
      { el: this._compassW, local: new THREE.Vector3( 0, 0,   R * 1.12)          }, // 90°W equator (local +Z = West)
    ];
  }

  _buildExitSurfaceBtn() {
    // Remove old if any
    const old = document.getElementById('exit-surface-btn');
    if (old) old.remove();

    const btn = document.createElement('button');
    btn.id = 'exit-surface-btn';
    btn.innerHTML = `
      <span style="font-size:18px;">🚀</span>
      <span style="margin-left:8px;font-size:13px;font-weight:700;letter-spacing:0.04em;">Exit to Space</span>
    `;
    btn.style.cssText = `
      display: none;
      position: fixed;
      bottom: 90px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 200;
      align-items: center;
      background: linear-gradient(135deg, rgba(0,20,50,0.92) 0%, rgba(0,40,90,0.92) 100%);
      border: 1.5px solid rgba(0,200,255,0.55);
      border-radius: 50px;
      padding: 12px 28px;
      color: #7df;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      backdrop-filter: blur(18px);
      box-shadow: 0 4px 32px rgba(0,180,255,0.25), 0 0 0 0 rgba(0,200,255,0.4);
      transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
      animation: exit-btn-pulse 2.5s ease-in-out infinite;
    `;

    // Pulse animation
    if (!document.getElementById('exit-surface-btn-style')) {
      const style = document.createElement('style');
      style.id = 'exit-surface-btn-style';
      style.textContent = `
        @keyframes exit-btn-pulse {
          0%, 100% { box-shadow: 0 4px 32px rgba(0,180,255,0.25), 0 0 0 0 rgba(0,200,255,0.35); }
          50%       { box-shadow: 0 4px 40px rgba(0,180,255,0.45), 0 0 0 8px rgba(0,200,255,0); }
        }
        #exit-surface-btn:hover {
          transform: translateX(-50%) scale(1.07) !important;
          border-color: rgba(0,220,255,0.9) !important;
          background: linear-gradient(135deg, rgba(0,30,70,0.97) 0%, rgba(0,60,130,0.97) 100%) !important;
          color: #aff !important;
          box-shadow: 0 8px 48px rgba(0,180,255,0.5), 0 0 24px rgba(0,220,255,0.2) !important;
        }
        #exit-surface-btn:active {
          transform: translateX(-50%) scale(0.97) !important;
        }
      `;
      document.head.appendChild(style);
    }

    btn.addEventListener('click', () => {
      this.exitSurface();
    });

    document.body.appendChild(btn);
    this._exitSurfaceBtn = btn;
  }

  /**
   * Exit Earth surface / planetarium mode and return to space.
   * Called by the Exit to Space button.
   */
  exitSurface() {
    this.isPlanetariumMode = false;
    this.isFlyMode = false;
    this._isTransitioning = false;

    // Hide surface overlays
    if (this.skyDome) this.skyDome.visible = false;
    if (this.virtualHorizon) this.virtualHorizon.visible = false;
    if (this._groundDisc) this._groundDisc.visible = false;
    if (this._horizonHaze) this._horizonHaze.visible = false;

    // Restore Earth
    if (this.earth) {
      this.earth.visible = true;
      this.earth.material.opacity = 1;
      this.earth.material.transparent = false;
    }
    if (this._atmosphere) {
      this._atmosphere.visible = true;
      this._atmosphere.material.opacity = 1;
    }

    // Restore Sun
    const sunEntry = this.planetMeshes ? this.planetMeshes.find(pm => pm.data.id === 'Sun') : null;
    if (sunEntry) sunEntry.mesh.visible = true;
    if (this._sunGlow) {
      this._sunGlow.visible = true;
      this._sunGlow.material.opacity = 1.0;
    }

    // Restore controls
    this.controls.enabled = true;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 5000000;
    this.camera.up.set(0, 1, 0);
    this._trackedPlanet = null;
    this.camera.fov = 60;
    this.camera.updateProjectionMatrix();

    // Restore star shader to space mode
    if (this.pointsMesh && this.pointsMesh.material.uniforms) {
      this.pointsMesh.material.uniforms.uIsPlanetarium.value = 0.0;
    }

    // Fly camera smoothly out to orbital view of Earth
    if (this.earth) {
      const earthWorldPos = new THREE.Vector3();
      this.earth.getWorldPosition(earthWorldPos);

      const startCam    = this.camera.position.clone();
      const startTarget = this.controls.target.clone();
      const endTarget   = earthWorldPos.clone();

      // Place camera at a nice orbital distance above Earth
      const outDir = startCam.clone().sub(earthWorldPos).normalize();
      if (outDir.lengthSq() < 0.001) outDir.set(0, 1, 0);
      const endCam = earthWorldPos.clone().addScaledVector(outDir, 25);

      const duration  = 2200;
      const startTime = performance.now();
      this._isCinematicFlight = true;

      const anim = (now) => {
        const t  = Math.min(1, (now - startTime) / duration);
        const et = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
        this.camera.position.lerpVectors(startCam, endCam, et);
        this.controls.target.lerpVectors(startTarget, endTarget, et);
        this.controls.update();

            if (t < 1) {
          requestAnimationFrame(anim);
        } else {
          this._isCinematicFlight = false;
        }
      };
      requestAnimationFrame(anim);
    }

    // Hide the exit button
    if (this._exitSurfaceBtn) this._exitSurfaceBtn.style.display = 'none';

    // Restore bottom controls UI (in case they were hidden)
    const btmCtrl = document.getElementById('bottom-controls');
    if (btmCtrl) btmCtrl.classList.remove('hidden');
    const planUi = document.getElementById('planetarium-ui');
    if (planUi) planUi.classList.add('hidden');
  }

  _injectLeaflet() {
    if (document.getElementById('leaflet-css')) return;
    const css = document.createElement('link');
    css.id  = 'leaflet-css';
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const js = document.createElement('script');
    js.id  = 'leaflet-js';
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = () => { this._leafletReady = true; };
    document.head.appendChild(js);
  }

  _buildLeafletOverlay() {
    let overlay = document.getElementById('earth-map-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'earth-map-overlay';
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:200;
      background:#020810;
      opacity:0; pointer-events:none;
      transition:opacity 0.55s cubic-bezier(0.16,1,0.3,1);
      display:flex; flex-direction:column;
    `;

    overlay.innerHTML = `
      <!-- Top bar -->
      <div style="
        flex:0 0 auto; display:flex; align-items:center; justify-content:space-between;
        padding:14px 20px; background:rgba(2,8,20,0.95);
        border-bottom:1px solid rgba(0,180,255,0.15);
        backdrop-filter:blur(20px);
      ">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:22px;">🌍</span>
          <div>
            <div style="font-size:15px;font-weight:700;color:#e8f4ff;font-family:'Inter',sans-serif;letter-spacing:-0.01em;">Earth Surface Map</div>
            <div style="font-size:11px;color:#4a8caa;font-family:'Inter',sans-serif;" id="map-coords-display">Loading position…</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <!-- Map style selector -->
          <select id="map-layer-select" style="
            background:rgba(0,180,255,0.1);border:1px solid rgba(0,180,255,0.25);
            border-radius:8px;padding:6px 10px;color:#a0d0ee;font-size:12px;
            font-family:'Inter',sans-serif;cursor:pointer;outline:none;
          ">
            <option value="osm">🗺 Street Map</option>
            <option value="satellite">🛰 Satellite</option>
            <option value="topo">🏔 Terrain</option>
            <option value="dark">🌑 Dark</option>
          </select>
          <button id="earth-map-done" style="
            background:rgba(0,255,170,0.12);border:1px solid rgba(0,255,170,0.3);
            border-radius:10px;padding:8px 16px;color:#00ffaa;font-size:13px;
            font-family:'Inter',sans-serif;font-weight:600;cursor:pointer;
            transition:all 0.2s ease;
          " onmouseover="this.style.background='rgba(0,255,170,0.25)'"
             onmouseout="this.style.background='rgba(0,255,170,0.12)'">
            🔭 View Sky From Here
          </button>
          <button id="earth-map-close" style="
            background:rgba(255,60,60,0.12);border:1px solid rgba(255,60,60,0.3);
            border-radius:10px;padding:8px 16px;color:#ff7070;font-size:13px;
            font-family:'Inter',sans-serif;font-weight:600;cursor:pointer;
            transition:all 0.2s ease;
          " onmouseover="this.style.background='rgba(255,60,60,0.25)'"
             onmouseout="this.style.background='rgba(255,60,60,0.12)'">
            ✕ Back to Space
          </button>
        </div>
      </div>
      <!-- Map container -->
      <div id="leaflet-map-container" style="flex:1;position:relative;"></div>
      <!-- Bottom info bar -->
      <div style="
        flex:0 0 auto;padding:10px 20px;
        background:rgba(2,8,20,0.9);border-top:1px solid rgba(0,180,255,0.1);
        display:flex;gap:24px;align-items:center;
        font-family:'Inter',sans-serif;font-size:11px;color:#4a8caa;
      ">
        <span>📍 <span id="map-lat-lon">—</span></span>
        <span>🔭 OpenStreetMap · Real-time position from astronomy-engine</span>
        <span style="margin-left:auto;">Scroll to zoom · Drag to pan</span>
      </div>
    `;

    document.body.appendChild(overlay);
    this._earthMapOverlay = overlay;
    this._mapVisible = false;

    // ── Button listeners ──────────────────────────────
    const btnClose = overlay.querySelector('#earth-map-close');
    const btnDone = overlay.querySelector('#earth-map-done');
    
    if (btnClose) {
      btnClose.onclick = () => {
        this._hideEarthMap(true); // animate camera back to space
      };
    }
    
    if (btnDone) {
      btnDone.onclick = () => {
        try {
          const coords = this._selectedLatLon || (this._leafletMap ? this._leafletMap.getCenter() : null);
          if (coords) {
            this._hideEarthMap(false); // Close map without flying to space
            this.teleportToSurface(coords.lat, coords.lng, 500); // Fast transition since already close
            
            // Show Planetarium UI safely
            const planetariumUi = document.getElementById('planetarium-ui');
            if (planetariumUi) planetariumUi.classList.remove('hidden');
            const bottomControls = document.getElementById('bottom-controls');
            if (bottomControls) bottomControls.classList.add('hidden');
          }
        } catch (err) {
          console.error("Error in teleport button:", err);
          this._hideEarthMap(true);
        }
      };
    }

    // ── Escape key also closes map ─────────────────────────────────────────
    this._mapEscHandler = (e) => {
      if (e.key === 'Escape' && this._mapVisible) this._hideEarthMap(true);
    };
    // Add simple look-around handler for planetarium mode
    let isDraggingSky = false;
    let previousMouse = { x: 0, y: 0 };
    
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      if (this.isPlanetariumMode) {
        isDraggingSky = true;
        previousMouse.x = e.clientX;
        previousMouse.y = e.clientY;
      }
    });
    
    window.addEventListener('pointerup', () => {
      isDraggingSky = false;
    });
    
    this.renderer.domElement.addEventListener('pointermove', (e) => {
      if (this.isPlanetariumMode && isDraggingSky) {
        const deltaX = e.clientX - previousMouse.x;
        const deltaY = e.clientY - previousMouse.y;
        previousMouse.x = e.clientX;
        previousMouse.y = e.clientY;
        
        // Rotate the target around the camera
        const offset = this.controls.target.clone().sub(this.camera.position);
        
        // Horizontal rotation around local Up
        offset.applyAxisAngle(this.camera.up, -deltaX * 0.003);
        
        // Vertical rotation around local Right
        const right = new THREE.Vector3().crossVectors(this.camera.up, offset).normalize();
        offset.applyAxisAngle(right, -deltaY * 0.003);
        
        this.controls.target.copy(this.camera.position).add(offset);
      }
    });

    window.addEventListener('keydown', this._mapEscHandler);

    // Layer switcher
    overlay.querySelector('#map-layer-select').addEventListener('change', (e) => {
      this._switchMapLayer(e.target.value);
    });
  }

  _showEarthMap(lat, lon) {
    if (this._mapVisible) return;
    this._mapVisible = true;

    const overlay = this._earthMapOverlay;
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';

    // Disable 3D orbit controls while map is open
    if (this.controls) this.controls.enabled = false;

    if (this._leafletReady && window.L) {
      if (!this._leafletMap) {
        this._leafletMap = window.L.map('leaflet-map-container', {
          center: [lat, lon], zoom: 5,
          zoomControl: true,
          attributionControl: true,
        });
        
        // ── Zoom-out to return to space ────────────────────────────────────────────
        this._leafletMap.on('zoomend', () => {
          if (!this._mapVisible) return;
          // If user zooms out to see the whole world (zoom < 3), exit to 3D space
          if (this._leafletMap.getZoom() < 3) {
            this._hideEarthMap(true /* zoom out to space */);
          }
        });

        this._leafletLayers = {
          osm: window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors', maxZoom: 19,
          }),
          satellite: window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri', maxZoom: 18,
          }),
          topo: window.L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenTopoMap', maxZoom: 17,
          }),
          dark: window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© CARTO', maxZoom: 19,
          }),
        };
        this._currentLayer = 'osm';
        this._leafletLayers.osm.addTo(this._leafletMap);

        // Live coords display
        this._leafletMap.on('mousemove', (e) => {
          const el = document.getElementById('map-lat-lon');
          if (el) el.textContent = `${e.latlng.lat.toFixed(4)}°, ${e.latlng.lng.toFixed(4)}°`;
        });
        
        // Click to drop pin
        this._mapMarker = window.L.marker([lat, lon]).addTo(this._leafletMap);
        this._selectedLatLon = { lat, lng: lon };
        this._leafletMap.on('click', (e) => {
          this._mapMarker.setLatLng(e.latlng);
          this._selectedLatLon = e.latlng;
        });
        
      } else {
        this._leafletMap.setView([lat, lon], 5);
        if (this._mapMarker) this._mapMarker.setLatLng([lat, lon]);
        this._selectedLatLon = { lat, lng: lon };
        setTimeout(() => this._leafletMap.invalidateSize(), 100);
      }

      // Update coords display
      const coordEl = document.getElementById('map-coords-display');
      if (coordEl) coordEl.textContent = `${lat.toFixed(2)}°, ${lon.toFixed(2)}° · Scroll down to return to space`;

      setTimeout(() => this._leafletMap.invalidateSize(), 300);
    } else {
      // Leaflet not ready yet — retry
      setTimeout(() => { this._mapVisible = false; this._showEarthMap(lat, lon); }, 500);
    }
  }

  _hideEarthMap(zoomOutToSpace = false, coords = null) {
    this._mapVisible = false;

    const overlay = this._earthMapOverlay;
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      overlay.style.display = 'none';
    }

    // Re-enable 3D controls unless we're entering telescope mode
    if (this.controls && !zoomOutToSpace) {
      this.controls.enabled = true;
    }

    if (zoomOutToSpace && this.earth) {
      // Push camera back up to space
      const earthWorldPos = new THREE.Vector3();
      this.earth.getWorldPosition(earthWorldPos);
      const pushDir = this.camera.position.clone().sub(earthWorldPos).normalize();
      this.camera.position.copy(earthWorldPos).addScaledVector(pushDir, 4.0 * 10);
      if (this.controls) {
        this.controls.target.copy(earthWorldPos);
        this.controls.enabled = true;
      }
    }
  }

  _switchMapLayer(name) {
    if (!this._leafletMap || !this._leafletLayers) return;
    if (this._currentLayer) this._leafletLayers[this._currentLayer].remove();
    this._leafletLayers[name].addTo(this._leafletMap);
    this._currentLayer = name;
  }

  _getEarthLatLon() {
    if (!this.earth) return { lat: 0, lon: 0 };
    // Vector from Earth center → camera, rotated into Earth's local space
    const earthWorldPos = new THREE.Vector3();
    this.earth.getWorldPosition(earthWorldPos);
    const dir = this.camera.position.clone().sub(earthWorldPos);
    // Remove Earth's Y rotation (GMST) to get texture-space coords
    dir.applyEuler(new THREE.Euler(0, -this.earth.rotation.y, 0));
    const len = dir.length();
    const lat = Math.asin(Math.max(-1, Math.min(1, dir.y / len))) * 180 / Math.PI;
    const lon = Math.atan2(-dir.z, dir.x) * 180 / Math.PI;
    return { lat, lon };
  }

  // ── Called every frame from render loop ─────────────────────────────────
  _updateEarthZoom() {
    if (!this.earth || this.isPlanetariumMode || (this.missionSimulator && this.missionSimulator.active)) {
      if (this._graticule)          this._graticule.visible             = false;
      if (this._cityGroup)          this._cityGroup.visible              = false;
      if (this._cityLabelContainer) this._cityLabelContainer.style.display = 'none';
      if (this._earthZoomPill)      this._earthZoomPill.style.display    = 'none';
      return;
    }

    const earthRadius = 4.0;
    const earthWorldPos = new THREE.Vector3();
    this.earth.getWorldPosition(earthWorldPos);
    const dist   = this.camera.position.distanceTo(earthWorldPos);

    // ── PREVENT going inside Earth ──────────────────────────────────────────
    const MIN_SURFACE_DIST = earthRadius * 1.05; // just above surface
    if (dist < MIN_SURFACE_DIST && !this._mapVisible) {
      // Push camera back to surface
      const pushDir = this.camera.position.clone().sub(earthWorldPos).normalize();
      this.camera.position.copy(earthWorldPos).addScaledVector(pushDir, MIN_SURFACE_DIST);
      if (this.controls) this.controls.target.copy(earthWorldPos);
    }
    // Also enforce via controls (unless we are tracking a satellite, where we want to zoom in close)
    if (this.controls) {
      if (this._trackedPlanet && this._trackedPlanet.isSatellite) {
         // Keep the tiny minDistance set by flyTo
      } else {
         const nearEarth = dist < earthRadius * 40;
         this.controls.minDistance = nearEarth ? MIN_SURFACE_DIST : 0.5;
      }
    }

    // ── Auto-hide map when zooming BACK OUT to space ───────────────────────
    const SHOW_MAP   = earthRadius * 1.15; // Requires getting closer to Earth
    const HIDE_MAP   = earthRadius * 3;    // zoom out past 3× → close map
    if (this._mapVisible && dist > HIDE_MAP) {
      this._hideEarthMap();
    }
    // Show map when very close
    if (dist < SHOW_MAP && !this._mapVisible && !this.isPlanetariumMode && !this._isTransitioning && !(this.missionSimulator && this.missionSimulator.active)) {
      const isTrackingSatellite = this._trackedPlanet && this._trackedPlanet.isSatellite;
      if (!isTrackingSatellite) {
        const { lat, lon } = this._getEarthLatLon();
        this._showEarthMap(lat, lon);
      }
    }

    const altitudes   = dist - earthRadius;
    const KM_PER_UNIT = 12742 / (earthRadius * 2);
    const altKm       = altitudes * KM_PER_UNIT;

    const SHOW_GRATICULE = earthRadius * 30;
    const SHOW_CITIES    = earthRadius * 12;
    const SHOW_LABELS    = earthRadius * 7;
    const SHOW_PILL      = earthRadius * 30;

    const showGrat   = dist < SHOW_GRATICULE && !this.isPlanetariumMode;
    const showCities = dist < SHOW_CITIES && !this.isPlanetariumMode;
    const showLabels = dist < SHOW_LABELS && !this.isPlanetariumMode;
    const showPill   = dist < SHOW_PILL && !this.isPlanetariumMode;
    
    if (this._graticule) {
      this._graticule.visible = showGrat;
      const t = Math.max(0, Math.min(1, (SHOW_GRATICULE - dist) / (SHOW_GRATICULE * 0.5)));
      this._graticule.children.forEach(l => {
        if (l.material) l.material.opacity = l.material.color.r > 0.2 ? 0.38 * t : 0.18 * t;
      });
    }

    if (this._cityGroup) this._cityGroup.visible = showCities;

    if (this._cityLabelContainer) {
      this._cityLabelContainer.style.display = showCities ? 'block' : 'none';
    }

    if (this._cityLabels && showCities && this._cityDots) {
      const tempV = new THREE.Vector3();
      this._cityLabels.forEach(({ el }, i) => {
        const dot = this._cityDots[i];
        if (!dot) { el.style.display = 'none'; return; }
        dot.getWorldPosition(tempV);
        tempV.project(this.camera);
        if (tempV.z > 1) { el.style.display = 'none'; return; }
        const toCity = new THREE.Vector3();
        dot.getWorldPosition(toCity);
        const toCam  = this.camera.position.clone().sub(toCity).normalize();
        const surfNrm = toCity.clone().sub(earthWorldPos).normalize();
        if (surfNrm.dot(toCam) < 0.05) { el.style.display = 'none'; return; }
        const sx = (tempV.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (tempV.y * -0.5 + 0.5) * window.innerHeight;
        el.style.left    = `${sx}px`;
        el.style.top     = `${sy}px`;
        el.style.display = 'block';
        el.style.opacity  = showLabels ? '1' : '0.55';
        el.style.fontSize = showLabels ? '11px' : '9px';
      });
    } else if (this._cityLabels) {
      this._cityLabels.forEach(({ el }) => { el.style.display = 'none'; });
    }

    if (this._earthZoomPill) {
      this._earthZoomPill.style.display = showPill ? 'block' : 'none';
      if (showPill) {
        const altEl = document.getElementById('earth-alt-km');
        if (altEl) {
          altEl.textContent = altKm < 1000
            ? `${altKm.toFixed(0)} km altitude`
            : `${(altKm / 1000).toFixed(1)} kkm altitude`;
        }
      }
    }

    // ── N/S/E/W Compass Labels ──────────────────────────────────────────────
    const SHOW_COMPASS = earthRadius * 25;
    const showCompass  = dist < SHOW_COMPASS;
    this._updateCompassLabels(showCompass, earthWorldPos);
  }

  _updateCompassLabels(show, earthWorldPos) {
    // Hide all if not in range
    const hideAll = () => {
      if (this._compassN) this._compassN.style.display = 'none';
      if (this._compassS) this._compassS.style.display = 'none';
      if (this._compassE) this._compassE.style.display = 'none';
      if (this._compassW) this._compassW.style.display = 'none';
      if (this._compassRose) this._compassRose.style.display = 'none';
    };
    if (!show || !this._compassPoints || !this.earth) { hideAll(); return; }

    const tempV = new THREE.Vector3();
    const worldPt = new THREE.Vector3();

    this._compassPoints.forEach(({ el, local }) => {
      // Convert Earth-local position → world space (accounts for Earth rotation + position)
      worldPt.copy(local);
      this.earth.localToWorld(worldPt);

      // Face-check: cull if on the back-side of the globe
      const surfNrm = worldPt.clone().sub(earthWorldPos).normalize();
      const toCam   = this.camera.position.clone().sub(worldPt).normalize();
      const dot     = surfNrm.dot(toCam);

      if (dot < 0.08) {
        el.style.display = 'none';
        return;
      }

      // Project to screen
      tempV.copy(worldPt);
      tempV.project(this.camera);
      if (tempV.z > 1) { el.style.display = 'none'; return; }

      const sx = (tempV.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (tempV.y * -0.5 + 0.5) * window.innerHeight;
      el.style.left    = `${sx}px`;
      el.style.top     = `${sy}px`;
      el.style.display = 'block';
      // Fade in based on visibility dot product
      el.style.opacity = Math.min(1, (dot - 0.08) * 6).toFixed(2);
    });

    // ── Compass Rose — rotates so N always points toward North Pole on screen ──
    if (this._compassRose) {
      this._compassRose.style.display = 'block';

      // Get North Pole world position
      const northWorld = new THREE.Vector3(0, 4.0 * 1.12, 0);
      this.earth.localToWorld(northWorld);

      // Project both Earth center and North Pole to screen
      const centerSc = earthWorldPos.clone();
      centerSc.project(this.camera);
      const northSc = northWorld.clone();
      northSc.project(this.camera);

      // Angle from center to north in screen space
      const dx  = northSc.x - centerSc.x;
      const dy  = -(northSc.y - centerSc.y); // flip Y (screen Y is inverted)
      const ang = Math.atan2(dx, dy) * 180 / Math.PI; // clockwise from up

      this._compassRose.querySelector('svg').style.transform = `rotate(${ang}deg)`;
    }
  }

  _buildTelemetryPanel() {
    let panel = document.getElementById('planet-telemetry');
    if (panel) panel.remove();
    panel = document.createElement('div');
    panel.id = 'planet-telemetry';
    panel.style.cssText = `
      position:fixed; bottom:90px; left:20px; z-index:95;
      background:rgba(4,10,24,0.82); border:1px solid rgba(0,180,255,0.18);
      border-radius:14px; padding:14px 16px; min-width:260px;
      backdrop-filter:blur(18px); font-family:'Inter',sans-serif;
      box-shadow:0 8px 40px rgba(0,0,0,0.55);
      pointer-events:none;
    `;
    panel.innerHTML = `
      <div style="font-size:10px;letter-spacing:0.12em;color:#4a8caa;font-weight:700;margin-bottom:10px;text-transform:uppercase;">
        ⬡ Live Solar System
      </div>
      <div id="telemetry-rows"></div>
    `;
    document.body.appendChild(panel);
    this._telemetryPanel = panel;
    this.showTelemetry = false;
  }

  toggleTelemetry() {
    this.showTelemetry = !this.showTelemetry;
    if (this._telemetryPanel) {
      this._telemetryPanel.style.display = this.showTelemetry ? 'block' : 'none';
    }
    return this.showTelemetry;
  }

  _updateTelemetry() {
    if (!this._telemetryPanel || !this.planetMeshes || this.isPlanetariumMode || !this.showTelemetry) {
      if (this._telemetryPanel) this._telemetryPanel.style.display = 'none';
      return;
    }
    this._telemetryPanel.style.display = 'block';
    const AU = 93924.2;
    const earthEntry = this.planetMeshes.find(m => m.data.id === 'Earth');
    const earthPos   = earthEntry ? earthEntry.mesh.position : new THREE.Vector3();

    const rows = this.planetMeshes
      .filter(pm => pm.data.id !== 'Moon' && pm.data.id !== 'Sun')
      .map(pm => {
        const distFromSun = pm.mesh.position.length() / AU;
        const distFromEarth = pm.mesh.position.distanceTo(earthPos) / AU;
        const icon = { Mercury:'☿', Venus:'♀', Earth:'🌍', Mars:'♂', Jupiter:'♃', Saturn:'♄', Uranus:'⛢', Neptune:'♆' }[pm.data.id] || '●';
        const col  = { Mercury:'#aaa', Venus:'#ffcc99', Earth:'#4af', Mars:'#f64', Jupiter:'#fa8', Saturn:'#eeb', Uranus:'#6cf', Neptune:'#66f' }[pm.data.id] || '#fff';
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
            <span style="font-size:12px;color:${col};min-width:80px;">${icon} ${pm.data.id}</span>
            <span style="font-size:11px;color:#5aa;font-family:monospace;">${distFromSun.toFixed(3)} AU</span>
            <span style="font-size:11px;color:#8888aa;font-family:monospace;">${distFromEarth < 0.001 ? '—' : distFromEarth.toFixed(3)+' AU'}</span>
          </div>`;
      }).join('');

    document.getElementById('telemetry-rows').innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:10px;color:#2a5060;">PLANET</span>
        <span style="font-size:10px;color:#2a5060;">FROM SUN</span>
        <span style="font-size:10px;color:#2a5060;">FROM EARTH</span>
      </div>
      ${rows}
    `;
  }

  updateSkyRotation(lstDegrees, latitude) {
    // Disabled in Heliocentric mode to prevent swinging the sun and planets.
  }

  flyToEarth() {
    this._clearSelection();
    // Fly to just outside Earth, looking up at the sky
    const startCam    = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    // Position camera just above Earth surface
    const endCam      = new THREE.Vector3(0, 0, 4.5);
    const endTarget   = new THREE.Vector3(0, 0, 500); // look far out into space

    const duration = 2000;
    const startTime = performance.now();
    const anim = (now) => {
      const t  = Math.min(1, (now - startTime) / duration);
      const et = easeInOutCubic(t);
      this.camera.position.lerpVectors(startCam, endCam, et);
      this.controls.target.lerpVectors(startTarget, endTarget, et);
      this.controls.update();
      
      // Gradually hide Earth to see stars clearly
      this.earth.material.opacity = 1 - et;
      this.earth.material.transparent = true;
      if (this._atmosphere) {
        this._atmosphere.material.opacity = 1 - et;
      }
      
      if (t < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
    // Note: autoRotate intentionally NOT enabled here — it causes unwanted drift in space/planetarium view
  }



  _clearSelection() {
    if (this.selectionRing) {
      this.scene.remove(this.selectionRing);
      this.selectionRing.geometry.dispose();
      this.selectionRing.material.dispose();
      this.selectionRing = null;
    }
    if (this._pulseRing) {
      this.scene.remove(this._pulseRing);
      this._pulseRing.geometry.dispose();
      this._pulseRing.material.dispose();
      this._pulseRing = null;
    }
    // Remove star selection sprites
    if (this._starSelectMarker) {
      this.scene.remove(this._starSelectMarker);
      if (this._starSelectMarker.material) this._starSelectMarker.material.dispose();
      this._starSelectMarker = null;
    }
    if (this._starSelectMarker2) {
      this.scene.remove(this._starSelectMarker2);
      if (this._starSelectMarker2.material) this._starSelectMarker2.material.dispose();
      this._starSelectMarker2 = null;
    }
    this.selectionStar = null;
    const reticleEl = document.getElementById('selection-reticle');
    if (reticleEl) reticleEl.classList.add('hidden');
  }

  clearSelection() {
    this._selectedCelestial = null;
    this._clearSelection();
  }
  
  flyToISS() {
    if (!this.satellites) return;
    const iss = this.satellites.find(s => s.name.includes('ISS') || s.name.includes('ZARYA'));
    if (!iss) return;
    
    // Select the ISS internally so W/S controls lock onto it
    this.selectStar({
      mesh: iss.mesh,
      data: { id: iss.name, size: 0.1 }
    });
    
    // Start cinematic flight to the ISS
    this.flyTo({ mesh: iss.mesh, data: { size: 0.1, id: iss.name }, isSatellite: true }, 2500);
  }

  // Create seed-based pseudo-random number generator
  _createPRNG(seed) {
    let s = seed;
    return () => {
      const x = Math.sin(s++) * 10000;
      return x - Math.floor(x);
    };
  }

  // Create premium dynamic solar flares, magnetic loops, and shooting plasma arches on the Sun itself
  _createSunSolarFlares(sunMesh, radius) {
    this._sunFlareMaterials = [];

    // ── 1. MAGNETIC LOOP ARCS ─────────────────────────────────────────────────
    // Glowing plasma arches wrapping around the Sun surface
    const loopPalettes = [
      [new THREE.Color(1.0, 0.20, 0.02), new THREE.Color(1.0, 0.80, 0.20)],
      [new THREE.Color(1.0, 0.35, 0.05), new THREE.Color(1.0, 0.92, 0.35)],
      [new THREE.Color(0.9, 0.12, 0.04), new THREE.Color(1.0, 0.55, 0.12)],
    ];

    for (let i = 0; i < 8; i++) {
      const phi   = (i / 8) * Math.PI * 2 + Math.random() * 0.7;
      const theta = 0.25 + Math.random() * 1.1;
      const span  = 0.35 + Math.random() * 0.55;

      // Two feet on Sun surface
      const p1 = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi)
      ).normalize().multiplyScalar(radius);

      const p2 = new THREE.Vector3(
        Math.sin(theta + span) * Math.cos(phi + span * 0.55),
        Math.cos(theta + span),
        Math.sin(theta + span) * Math.sin(phi + span * 0.55)
      ).normalize().multiplyScalar(radius);

      // Apex of the loop arch
      const apex = p1.clone().add(p2).normalize()
        .multiplyScalar(radius * (1.08 + Math.random() * 0.14));

      const curve = new THREE.CatmullRomCurve3([
        p1,
        p1.clone().lerp(apex, 0.35),
        apex,
        p2.clone().lerp(apex, 0.35),
        p2
      ]);

      const cols = loopPalettes[i % loopPalettes.length];
      const loopMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime:   { value: 0.0 },
          uColor1: { value: cols[0].clone() },
          uColor2: { value: cols[1].clone() },
          uPhase:  { value: Math.random() * Math.PI * 2 },
          uOpacityMultiplier: { value: 0.85 }
        },
        vertexShader: /* glsl */`
          varying float vT;
          void main() {
            vT = uv.x;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */`
          uniform float uTime;
          uniform float uPhase;
          uniform vec3  uColor1;
          uniform vec3  uColor2;
          uniform float uOpacityMultiplier;
          varying float vT;
          void main() {
            float endFade = smoothstep(0.0, 0.10, vT) * smoothstep(1.0, 0.90, vT);
            float wave   = 0.5 + 0.5 * sin(uTime * 3.0 + uPhase + vT * 10.0);
            float bright = 0.6 + 0.4 * wave;
            vec3  col    = mix(uColor1, uColor2, vT);
            float alpha  = endFade * bright * 0.92 * uOpacityMultiplier;
            gl_FragColor = vec4(col * bright * 1.6, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      this._sunFlareMaterials.push(loopMat);

      // Tube radius scaled to the Sun's massive size
      const tubeRadius = radius * (0.004 + Math.random() * 0.005);
      const tubeGeo = new THREE.TubeGeometry(curve, 52, tubeRadius, 8, false);
      const loopMesh = new THREE.Mesh(tubeGeo, loopMat);
      loopMesh.name = 'sunMagneticLoop';
      sunMesh.add(loopMesh);
    }

    // ── 2. PLASMA ERUPTION PARTICLE SYSTEM ───────────────────────────────────
    // Shooting plasma particles erupting outwards in parabolic curves
    const eruptionCenters = Array.from({ length: 4 }, () => ({
      phi:   Math.random() * Math.PI * 2,
      theta: Math.random() * Math.PI
    }));

    const plasmaCount = 1200;
    const pGeo   = new THREE.BufferGeometry();
    const pPos   = new Float32Array(plasmaCount * 3);
    const pData  = new Float32Array(plasmaCount * 4);

    for (let i = 0; i < plasmaCount; i++) {
      const ec    = eruptionCenters[i % eruptionCenters.length];
      const phi   = ec.phi   + (Math.random() - 0.5) * 0.45;
      const theta = ec.theta + (Math.random() - 0.5) * 0.45;
      pData[i * 4 + 0] = phi;
      pData[i * 4 + 1] = theta;
      pData[i * 4 + 2] = 0.3 + Math.random() * 0.7;
      pData[i * 4 + 3] = Math.random();

      pPos[i * 3 + 0] = Math.sin(theta) * Math.cos(phi) * radius;
      pPos[i * 3 + 1] = Math.cos(theta) * radius;
      pPos[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * radius;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aData',    new THREE.BufferAttribute(pData, 4));

    const plasmaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:   { value: 0.0 },
        uRadius: { value: radius },
        uOpacityMultiplier: { value: 0.8 }
      },
      vertexShader: /* glsl */`
        attribute vec4   aData;
        uniform   float  uTime;
        uniform   float  uRadius;
        varying   float  vLife;
        void main() {
          float phi   = aData.x;
          float theta = aData.y;
          float speed = aData.z;
          float phase = aData.w;

          float t   = fract(uTime * speed * 0.22 + phase);
          vLife = t;

          vec3 dir = normalize(vec3(
            sin(theta) * cos(phi),
            cos(theta),
            sin(theta) * sin(phi)
          ));

          float h = t * (1.0 - t) * 4.0;
          float r = uRadius * (1.01 + h * 0.12 * speed);
          vec3  pos = dir * r;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position  = projectionMatrix * mvPos;
          
          float ps = (1.0 - t * 1.1) * 35.0 * (28000.0 / -mvPos.z);
          gl_PointSize = clamp(ps, 0.8, 12.0);
        }
      `,
      fragmentShader: /* glsl */`
        varying float vLife;
        uniform float uOpacityMultiplier;
        void main() {
          vec2  uv = gl_PointCoord - 0.5;
          float d  = length(uv) * 2.0;
          if (d > 1.0) discard;
          float alpha = clamp((1.0 - vLife * 1.25) * (1.0 - d), 0.0, 1.0) * uOpacityMultiplier;
          vec3  col = mix(
            mix(vec3(1.0, 1.0, 0.85), vec3(1.0, 0.55, 0.05), vLife * 1.2),
            vec3(0.9, 0.12, 0.02),
            clamp(vLife * 1.5 - 0.5, 0.0, 1.0)
          );
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this._sunFlareMaterials.push(plasmaMat);

    const plasmaPoints = new THREE.Points(pGeo, plasmaMat);
    plasmaPoints.name = 'sunPlasmaEruption';
    sunMesh.add(plasmaPoints);
  }

  // Comprehensive and robust self-cleaning system to clear 3D star, solar flares, nebulae, exoplanets, and supernova remnants
  _clearActiveStarSystem() {
    // Restore camera panning lock
    if (this.controls) {
      this.controls.enablePan = true;
    }

    // 1. Clear exoplanets
    if (this._activeExoplanetGroup) {
      this._activeExoplanetGroup.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => {
              if (m.map) m.map.dispose();
              if (m.bumpMap) m.bumpMap.dispose();
              m.dispose();
            });
          } else {
            if (child.material.map) child.material.map.dispose();
            if (child.material.bumpMap) child.material.bumpMap.dispose();
            child.material.dispose();
          }
        }
      });
      this.scene.remove(this._activeExoplanetGroup);
      this._activeExoplanetGroup = null;
    }
    this._activeExoplanets = [];

    // 2. Clear dust/nebula clouds
    if (this._active3DStarDust) {
      this._active3DStarDust.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
      this.scene.remove(this._active3DStarDust);
      this._active3DStarDust = null;
    }

    if (this._activeUserItemsGroup) {
      this.scene.remove(this._activeUserItemsGroup);
      this._activeUserItemsGroup = null;
    }

    // 3. Clear active star and its flare elements
    if (this._active3DStar) {
      this._active3DStar.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        }
      });
      this.scene.remove(this._active3DStar);
      this._active3DStar = null;
      this._active3DStarData = null;
    }

    // Reset solar flare materials tracker
    this._solarFlareMaterials = [];

    // 4. Clear Supernova assets and remnants cleanly to prevent memory leaks
    this._supernovaActive = false;
    this._supernovaState = 'idle';
    this._supernovaTime = 0.0;
    this._supernovaCenter = null;
    this._pulsarGroup = null;
    this._supernovaEjecta = null;
    this._supernovaNebula = null;
    this._supernovaFlashMesh = null;

    if (this._supernovaRemnants && this._supernovaRemnants.length > 0) {
      for (const mesh of this._supernovaRemnants) {
        if (mesh) {
          mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => {
                  if (m.map) m.map.dispose();
                  m.dispose();
                });
              } else {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
              }
            }
          });
          this.scene.remove(mesh);
        }
      }
    }

    // 5. Exit Chandrayaan mission if active to ensure complete memory cleanup
    if (this.missionSimulator) {
      this.missionSimulator.exit();
    }
  }

  _updateSupernova(delta) {
    this._supernovaTime += delta;
    const time = this._supernovaTime;
    const star = this._active3DStar;

    if (this._supernovaState === 'expanding') {
      // ── Stage 1: Star expands and pulses/shakes ──
      const duration = 2.5; // expansion lasts 2.5s
      const t = Math.min(1.0, time / duration);

      if (star) {
        // Expand from 1.0x to 6.5x original scale
        const scaleVal = 1.0 + 5.5 * t;
        star.scale.setScalar(scaleVal);

        // Shake/jitter star position slightly, shaking increases with t
        const shakeAmp = 0.09 * t;
        const shakeX = (Math.random() - 0.5) * shakeAmp;
        const shakeY = (Math.random() - 0.5) * shakeAmp;
        const shakeZ = (Math.random() - 0.5) * shakeAmp;
        
        if (!star.userData.basePosition) {
          star.userData.basePosition = star.position.clone();
        }
        star.position.copy(star.userData.basePosition).add(new THREE.Vector3(shakeX, shakeY, shakeZ));

        // Accelerate granulation/turbulence shader
        if (star.material && star.material.uniforms) {
          if (star.userData.shaderTime === undefined) {
            star.userData.shaderTime = performance.now() / 1000;
          }
          star.userData.shaderTime += delta * (1.0 + 35.0 * t);
          star.material.uniforms.uTime.value = star.userData.shaderTime;
        }

        // Accelerate solar flare loops/prominences
        if (this._solarFlareMaterials) {
          for (const fm of this._solarFlareMaterials) {
            if (fm.uniforms && fm.uniforms.uTime) {
              if (fm.userData.shaderTime === undefined) fm.userData.shaderTime = performance.now() / 1000;
              fm.userData.shaderTime += delta * (1.0 + 35.0 * t);
              fm.uniforms.uTime.value = fm.userData.shaderTime;
            }
          }
        }
      }

      // Dissolve exoplanets (shrink and fade orbits)
      if (this._activeExoplanetGroup) {
        const epScale = Math.max(0.0, 1.0 - t * 1.15);
        this._activeExoplanetGroup.traverse(child => {
          if (child.isMesh && child.name.startsWith('exoplanet-')) {
            child.scale.setScalar(epScale);
          }
          if (child.isMesh && child.name.startsWith('orbitRing-')) {
            if (child.material) {
              child.material.transparent = true;
              child.material.opacity = Math.max(0.0, 0.12 * (1.0 - t * 1.5));
            }
          }
        });
      }

      if (time >= duration) {
        this._supernovaState = 'exploding';
      }
    } 
    else if (this._supernovaState === 'exploding') {
      // ── Stage 2: Blinding full-screen additive flash ──
      const duration = 0.8; // flash lasts 0.8s
      const flashT = Math.min(1.0, (time - 2.5) / duration);

      // Create flash mesh if not exists
      if (!this._supernovaFlashMesh && star) {
        const basePos = star.userData.basePosition || star.position;
        // Make geometry large enough to engulf the camera/screen
        const geo = new THREE.SphereGeometry(15.0, 32, 32);
        const mat = new THREE.ShaderMaterial({
          uniforms: {
            uOpacity: { value: 0.0 }
          },
          vertexShader: /* glsl */`
            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: /* glsl */`
            uniform float uOpacity;
            void main() {
              // High multiplier 90.0 triggers intense UnrealBloom blowout
              gl_FragColor = vec4(vec3(1.0, 0.98, 0.95) * 90.0, uOpacity);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        this._supernovaFlashMesh = new THREE.Mesh(geo, mat);
        this._supernovaFlashMesh.position.copy(basePos);
        this.scene.add(this._supernovaFlashMesh);
        this._supernovaRemnants.push(this._supernovaFlashMesh);
      }

      if (this._supernovaFlashMesh) {
        // Expand the flash sphere rapidly
        const scaleVal = 1.0 + flashT * 18.0;
        this._supernovaFlashMesh.scale.setScalar(scaleVal);

        // Fade in to peak, then fade out
        if (flashT < 0.45) {
          this._supernovaFlashMesh.material.uniforms.uOpacity.value = flashT / 0.45;
        } else {
          this._supernovaFlashMesh.material.uniforms.uOpacity.value = Math.max(0.0, 1.0 - (flashT - 0.45) / 0.55);
        }
      }

      // At Peak Flash (t = 2.85s, or flashT = 0.45), clean up the star, exoplanets, and solar flares behind the flash!
      if (flashT >= 0.45 && this._active3DStar) {
        this._disposeSupernovaStarAndExoplanets();
      }

      if (time >= 2.5 + duration) {
        // Dispose of the flash mesh cleanly
        if (this._supernovaFlashMesh) {
          this.scene.remove(this._supernovaFlashMesh);
          if (this._supernovaFlashMesh.geometry) this._supernovaFlashMesh.geometry.dispose();
          if (this._supernovaFlashMesh.material) this._supernovaFlashMesh.material.dispose();
          this._supernovaFlashMesh = null;
        }
        this._supernovaState = 'ejecting';
      }
    } 
    else if (this._supernovaState === 'ejecting') {
      // ── Stage 3: Concentric shockwave expansion & high-speed particle burst ──
      const duration = 2.2;
      const ejectT = Math.min(1.0, (time - 3.3) / duration);
      const basePos = this._supernovaCenter || this.camera.position;

      // Spawn shockwave and ejecta particles if not exists
      if (!this._supernovaEjecta) {
        this._spawnEjectaAndShockwave(basePos);
      }

      // Animate shockwaves expansion & opacity
      if (this._supernovaRemnants) {
        for (const mesh of this._supernovaRemnants) {
          if (mesh.name === 'shockwaveRing') {
            const scaleFactor = mesh.userData.speed * ejectT * 50.0 + 2.0;
            mesh.scale.setScalar(scaleFactor);
            if (mesh.material) {
              mesh.material.opacity = Math.max(0.0, (1.0 - ejectT * 1.1) * mesh.userData.baseOpacity);
            }
          }
        }
      }

      // Animate ejecta particles movement & size
      if (this._supernovaEjecta && this._supernovaEjecta.material.uniforms) {
        this._supernovaEjecta.material.uniforms.uProgress.value = (time - 3.3);
        // Fade opacity
        this._supernovaEjecta.material.uniforms.uOpacity.value = Math.max(0.0, 1.0 - ejectT * 1.05);
      }

      if (time >= 3.3 + duration) {
        this._supernovaState = 'nebula';
      }
    } 
    else if (this._supernovaState === 'nebula') {
      // ── Stage 4: Swirling volumetric nebula & spinning pulsar remnant ──
      const nebT = time - 5.5;

      // Slowly fade out ejecta particles completely
      if (this._supernovaEjecta && this._supernovaEjecta.material.uniforms) {
        this._supernovaEjecta.material.uniforms.uProgress.value = (time - 3.3);
        this._supernovaEjecta.material.uniforms.uOpacity.value = Math.max(0.0, this._supernovaEjecta.material.uniforms.uOpacity.value - delta * 0.8);
        if (this._supernovaEjecta.material.uniforms.uOpacity.value <= 0.0) {
          this.scene.remove(this._supernovaEjecta);
          this._supernovaEjecta = null;
        }
      }

      // Spawn volumetric nebula & pulsar if not exists
      if (!this._supernovaNebula) {
        this._spawnNebulaAndPulsar(this._supernovaCenter);
      }

      // Animate volumetric nebula expansion and swirling drift
      if (this._supernovaNebula) {
        // Nebula slowly grows to its final majestic size
        const growScale = Math.min(1.0, nebT / 4.0);
        const scaleVal = 0.2 + 0.8 * Math.sin(growScale * Math.PI * 0.5);
        this._supernovaNebula.scale.setScalar(scaleVal);
        
        // Swirling rotation
        this._supernovaNebula.rotation.y = nebT * 0.05;
        this._supernovaNebula.rotation.z = nebT * 0.02;

        // Animate individual sprite opacities
        this._supernovaNebula.traverse(child => {
          if (child.isSprite && child.material && child.material._baseOpacity !== undefined) {
            const opacityMultiplier = Math.min(1.0, nebT / 3.0); // fade in over 3 seconds
            child.material.opacity = child.material._baseOpacity * opacityMultiplier;
          }
        });
      }

      // Spin pulsar rapidly
      if (this._pulsarGroup) {
        // Sweeping beam rotation
        this._pulsarGroup.rotation.y = performance.now() * 0.024;
      }
    }
  }

  _disposeSupernovaStarAndExoplanets() {
    if (!this._active3DStar) return;

    // Save center position for ejecta and nebula spawning
    this._supernovaCenter = this._active3DStar.position.clone();

    // 1. Clear active star and its flare elements
    this._active3DStar.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        } else {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
    });
    this.scene.remove(this._active3DStar);
    this._active3DStar = null;
    this._solarFlareMaterials = [];

    // 2. Clear exoplanets
    if (this._activeExoplanetGroup) {
      this._activeExoplanetGroup.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => {
              if (m.map) m.map.dispose();
              if (m.bumpMap) m.bumpMap.dispose();
              m.dispose();
            });
          } else {
            if (child.material.map) child.material.map.dispose();
            if (child.material.bumpMap) child.material.bumpMap.dispose();
            child.material.dispose();
          }
        }
      });
      this.scene.remove(this._activeExoplanetGroup);
      this._activeExoplanetGroup = null;
    }
    this._activeExoplanets = [];

    // 3. Clear/Hide old dust/nebula clouds
    if (this._active3DStarDust) {
      this._active3DStarDust.visible = false;
    }
  }

  _spawnEjectaAndShockwave(basePos) {
    // Concentric/orthogonal expanding shockwave rings
    const ringColors = [0x00ffff, 0xff00aa, 0xffcc00];
    const orientations = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0.5, 0.5, 0.7).normalize()
    ];

    for (let r = 0; r < 3; r++) {
      const size = 2.0;
      // RingGeometry with narrow width for thin shell look
      const ringGeo = new THREE.RingGeometry(size * 0.98, size * 1.02, 128, 1);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[r],
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(basePos);
      
      // Orient the ring
      const normal = orientations[r];
      const axis = new THREE.Vector3(0, 0, 1);
      ring.quaternion.setFromUnitVectors(axis, normal);
      
      ring.name = 'shockwaveRing';
      ring.userData = {
        speed: 1.2 + r * 0.4,
        baseOpacity: 0.65
      };
      
      this.scene.add(ring);
      this._supernovaRemnants.push(ring);
    }

    // High-speed ejecta particle system
    const particleCount = 3500;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const color = new Float32Array(particleCount * 3);

    const colors = [
      new THREE.Color(1.0, 1.0, 1.0),
      new THREE.Color(0.2, 0.9, 1.0),
      new THREE.Color(1.0, 0.1, 0.8),
      new THREE.Color(1.0, 0.8, 0.1)
    ];

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 0] = basePos.x;
      pos[i * 3 + 1] = basePos.y;
      pos[i * 3 + 2] = basePos.z;

      // Random spherical velocity direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 15.0 + Math.random() * 30.0;

      vel[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      vel[i * 3 + 2] = Math.cos(phi) * speed;

      const col = colors[Math.floor(Math.random() * colors.length)];
      color[i * 3 + 0] = col.r;
      color[i * 3 + 1] = col.g;
      color[i * 3 + 2] = col.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aVel',     new THREE.BufferAttribute(vel, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(color, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0.0 },
        uOpacity: { value: 1.0 }
      },
      vertexShader: /* glsl */`
        attribute vec3 aVel;
        varying vec3 vColor;
        uniform float uProgress;
        void main() {
          vColor = color;
          vec3 newPos = position + aVel * uProgress;
          vec4 mvPos = modelViewMatrix * vec4(newPos, 1.0);
          gl_Position = projectionMatrix * mvPos;
          float ps = 5.0 * (1.0 - uProgress * 0.15) * (300.0 / -mvPos.z);
          gl_PointSize = clamp(ps, 1.0, 9.0);
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vColor;
        uniform float uOpacity;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv) * 2.0;
          if (d > 1.0) discard;
          float alpha = (1.0 - d) * uOpacity;
          gl_FragColor = vec4(vColor * 2.5, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this._supernovaEjecta = new THREE.Points(geo, mat);
    this.scene.add(this._supernovaEjecta);
    this._supernovaRemnants.push(this._supernovaEjecta);
  }

  _spawnNebulaAndPulsar(basePos) {
    // ── Swirling Volumetric Nebula ──
    const nebulaGroup = new THREE.Group();
    nebulaGroup.name = 'supernovaNebula';
    nebulaGroup.position.copy(basePos);

    const bakeNebulaPuff = (colorHex, seed) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const count = 4;
      const baseCol = new THREE.Color(colorHex);

      for (let j = 0; j < count; j++) {
        const ox = 64 + ((seed * 7 + j * 13) % 1) * 128;
        const oy = 64 + ((seed * 11 + j * 17) % 1) * 128;
        const r = 40 + ((seed * 19 + j * 23) % 1) * 70;
        
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
        const r8 = Math.round(baseCol.r * 255);
        const g8 = Math.round(baseCol.g * 255);
        const b8 = Math.round(baseCol.b * 255);
        
        g.addColorStop(0,   `rgba(${r8},${g8},${b8},0.35)`);
        g.addColorStop(0.4, `rgba(${r8},${g8},${b8},0.15)`);
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const colors = ['#ff0080', '#00f2ff', '#a200ff', '#ffb700'];
    const numClouds = 10;

    for (let i = 0; i < numClouds; i++) {
      const colHex = colors[i % colors.length];
      const tex = bakeNebulaPuff(colHex, 0.13 * i + 0.29);
      
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      mat._baseOpacity = 0.28 + Math.random() * 0.22;
      
      const sprite = new THREE.Sprite(mat);
      const theta = Math.random() * Math.PI * 2;
      const dist = 3.0 + Math.random() * 12.0;
      sprite.position.set(
        Math.cos(theta) * dist,
        (Math.random() - 0.5) * 6.0,
        Math.sin(theta) * dist
      );
      
      const size = 15.0 + Math.random() * 20.0;
      sprite.scale.set(size, size * (0.8 + Math.random() * 0.4), 1);
      
      sprite.userData = {
        rotSpeed: (Math.random() - 0.5) * 0.05
      };

      nebulaGroup.add(sprite);
    }

    this.scene.add(nebulaGroup);
    this._supernovaNebula = nebulaGroup;
    this._supernovaRemnants.push(nebulaGroup);

    // ── Central Pulsar / Neutron Star Remnant ──
    const pulsarGroup = new THREE.Group();
    pulsarGroup.name = 'pulsarRemnant';
    pulsarGroup.position.copy(basePos);

    const coreGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    pulsarGroup.add(core);

    const beamLength = 80.0;
    const beamGeo = new THREE.CylinderGeometry(0.1, 2.5, beamLength, 32, 1, true);
    
    const beamMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x00d4ff) }
      },
      vertexShader: /* glsl */`
        varying float vY;
        void main() {
          vY = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        varying float vY;
        uniform vec3 uColor;
        void main() {
          float dist = abs(vY) / 40.0;
          float fade = smoothstep(1.0, 0.0, dist);
          vec3 col = mix(vec3(1.0, 1.0, 1.0) * 12.0, uColor * 6.0, dist);
          gl_FragColor = vec4(col * fade, fade * 0.75);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    pulsarGroup.add(beamMesh);

    const pulsarAssembly = new THREE.Group();
    pulsarAssembly.position.copy(basePos);
    
    pulsarGroup.rotation.z = 0.52;
    pulsarAssembly.add(pulsarGroup);

    this.scene.add(pulsarAssembly);
    this._pulsarGroup = pulsarAssembly;
    this._supernovaRemnants.push(pulsarAssembly);
  }


  renderUserItems(starData, capsules = [], wishes = []) {
    console.log("renderUserItems called with capsules:", capsules, "wishes:", wishes);
    if (!this._active3DStar) {
      console.warn("renderUserItems aborted: no _active3DStar");
      return;
    }
    
    if (this._activeUserItemsGroup) {
      this.scene.remove(this._activeUserItemsGroup);
    }
    
    this._activeUserItemsGroup = new THREE.Group();
    // Position it at the star
    this._activeUserItemsGroup.position.copy(this._active3DStar.position);
    this.scene.add(this._activeUserItemsGroup);

    // 1. Draw Capsules (Golden octahedrons)
    capsules.forEach((cap, idx) => {
      const geo = new THREE.OctahedronGeometry(0.15, 0); // ~0.15 units size
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0xaa8800,
        emissiveIntensity: 0.2
      });
      const mesh = new THREE.Mesh(geo, mat);
      
      // Orbit params
      const radius = 2.8 + (idx * 0.4);
      const angle = (idx / Math.max(capsules.length, 1)) * Math.PI * 2;
      
      mesh.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 0.5, Math.sin(angle) * radius);
      mesh.userData = { type: 'capsule', data: cap, isUserItem: true };
      
      this._activeUserItemsGroup.add(mesh);
    });

    // 2. Draw Wishes (Glowing pink/purple wisps)
    wishes.forEach((wish, idx) => {
      // Create a glowing sprite
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 105, 180, 1)');
      grad.addColorStop(0.2, 'rgba(255, 20, 147, 0.8)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.4, 0.4, 1);
      
      // Orbit params
      const radius = 4.2 + (idx * 0.4);
      const angle = (idx / Math.max(wishes.length, 1)) * Math.PI * 2 + Math.PI;
      
      sprite.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 1.0, Math.sin(angle) * radius);
      sprite.userData = { type: 'wish', data: wish, isUserItem: true };
      
      this._activeUserItemsGroup.add(sprite);
    });
  }

  viewStar3D(starData, instant = false) {
    if (!starData) return;

    // Get world position of this star
    let worldPos = null;
    if (starData.mesh && starData.mesh.position) {
      worldPos = starData.mesh.position.clone();
    } else if (starData.position) {
      const local = new THREE.Vector3(starData.position.x || 0, starData.position.y || 0, starData.position.z || 0);
      if (this.skyGroup) {
        worldPos = local.clone();
        this.skyGroup.updateMatrixWorld();
        worldPos.applyMatrix4(this.skyGroup.matrixWorld);
      } else {
        worldPos = local;
      }
    }

    if (this._active3DStar && this._active3DStarData === starData) {
      this._clearActiveStarSystem();

      // Reset tracking and controls, but do not clear selection
      this._trackedPlanet = null;
      this.controls.enableZoom = true;
      this.controls.enablePan = true;
      this.controls.enableRotate = true;
      this.controls.minDistance = 0.5;
      this.controls.maxDistance = 5000000;
      this.camera.up.set(0, 1, 0);

      if (worldPos) {
        const dir = new THREE.Vector3().subVectors(this.camera.position, worldPos).normalize();
        if (dir.lengthSq() === 0) dir.set(0, 0, 1);
        const targetCamPos = worldPos.clone().add(dir.multiplyScalar(150));
        
        if (instant) {
          this.camera.position.copy(targetCamPos);
          this.controls.target.copy(worldPos);
          this.controls.update();
        } else {
          this._transitionCamPos(targetCamPos, 2000, worldPos);
        }
      }

      this.selectStar(starData);
      return;
    }

    this._clearActiveStarSystem();

    if (starData.isPlanet || starData.isSatellite) {
      if (instant) {
        // Skip animation for planets too if instant is requested
      } else {
        this.flyTo(starData);
      }
      return;
    }

    // ── Photorealistic 3D Star ──────────────────────────────────────────────
    const radius = 2.0;
    const starColor = new THREE.Color(starData.color || '#ffffff');

    // ── 1. Plasma Surface Sphere ────────────────────────────────────────────
    const geo = new THREE.SphereGeometry(radius, 64, 64);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: starColor },
        uTime:  { value: 0.0 }
      },
      vertexShader: /* glsl */`
        varying vec3 vNorm;
        varying vec3 vPos;
        void main() {
          vNorm = normalize(normalMatrix * normal);
          vPos  = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform vec3  uColor;
        uniform float uTime;
        varying vec3  vNorm;
        varying vec3  vPos;

        /* ---- value noise helpers ---- */
        float h(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        float vnoise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f*f*(3.0-2.0*f);
          float a = h(i);
          float b = h(i+vec3(1.0, 0.0, 0.0));
          float c = h(i+vec3(0.0, 1.0, 0.0));
          float d = h(i+vec3(1.0, 1.0, 0.0));
          float e = h(i+vec3(0.0, 0.0, 1.0));
          float g = h(i+vec3(1.0, 0.0, 1.0));
          float k = h(i+vec3(0.0, 1.0, 1.0));
          float m = h(i+vec3(1.0, 1.0, 1.0));
          return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),
                     mix(mix(e,g,f.x),mix(k,m,f.x),f.y), f.z);
        }
        float fbm(vec3 p) {
          float v = 0.0, amp = 0.5;
          for (int i = 0; i < 6; i++) {
            v += amp * vnoise(p);
            p *= 2.01;
            amp *= 0.5;
          }
          return v;
        }
        /* ---- main ---- */
        void main() {
          vec3 p = normalize(vPos) * 5.0;

          /* animated turbulence */
          float t1 = fbm(p + vec3(uTime*0.07, uTime*0.04, uTime*0.05));
          float t2 = fbm(p * 2.1 - vec3(uTime*0.035, 0.0, uTime*0.06));

          /* granulation cells */
          float cells = fbm(p * 4.0 + vec3(uTime*0.015));
          float bright = smoothstep(0.32, 0.72, cells);

          /* combine */
          float r = (t1 + t2) * 0.5;

          /* colour layers: dark sunspot → base star → bright hot centre */
          vec3 dark   = uColor * 0.3;
          vec3 mid    = uColor * (0.7 + bright * 0.3);
          vec3 hot    = mix(mid, vec3(1.0, 0.98, 0.90), smoothstep(0.55, 0.95, r));
          vec3 col    = mix(dark, hot, smoothstep(0.1, 0.35, r));

          /* limb darkening */
          float limb  = smoothstep(-0.1, 0.3, dot(vNorm, vec3(0.0, 0.0, 1.0)));

          gl_FragColor = vec4(col * limb, 1.0);
        }
      `,
      transparent: false
    });

    this._active3DStar = new THREE.Mesh(geo, mat);
    this._active3DStar.position.copy(worldPos);

    // ── Soft Atmospheric Diffuse Glow (like light scattered in interstellar dust) ──
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256; glowCanvas.height = 256;
    const glowCtx = glowCanvas.getContext('2d');
    const glowGrad = glowCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    // Star color tint for the inner core, soft blue-white for outer diffusion
    const sr = Math.round(starColor.r * 255);
    const sg = Math.round(starColor.g * 255);
    const sb = Math.round(starColor.b * 255);
    glowGrad.addColorStop(0.00, `rgba(255,255,255,0.70)`);
    glowGrad.addColorStop(0.07, `rgba(${sr},${sg},${sb},0.30)`);
    glowGrad.addColorStop(0.18, `rgba(160,185,220,0.12)`);
    glowGrad.addColorStop(0.38, `rgba(130,160,210,0.05)`);
    glowGrad.addColorStop(0.65, `rgba(100,130,190,0.01)`);
    glowGrad.addColorStop(1.00, `rgba(0,0,0,0)`);
    glowCtx.fillStyle = glowGrad;
    glowCtx.fillRect(0, 0, 256, 256);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0.30,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.scale.set(radius * 14, radius * 14, 1);
    glowSprite.name = 'glowSprite';
    this._active3DStar.add(glowSprite);

    // ══════════════════════════════════════════════════════════════════════════
    // ── SOLAR FLARE SYSTEM ────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════
    this._solarFlareMaterials = [];   // collect all materials needing uTime updates

    // ── 1. MAGNETIC LOOP ARCS ─────────────────────────────────────────────────
    // Glowing plasma arches that erupt from the star surface
    const loopPalettes = [
      [new THREE.Color(1.0, 0.20, 0.02), new THREE.Color(1.0, 0.80, 0.20)],
      [new THREE.Color(1.0, 0.35, 0.05), new THREE.Color(1.0, 0.92, 0.35)],
      [new THREE.Color(0.9, 0.12, 0.04), new THREE.Color(1.0, 0.55, 0.12)],
    ];

    for (let i = 0; i < 6; i++) {
      const phi   = (i / 6) * Math.PI * 2 + Math.random() * 0.7;
      const theta = 0.25 + Math.random() * 1.1;
      const span  = 0.55 + Math.random() * 0.95;

      // Two feet on star surface
      const p1 = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi)
      ).normalize().multiplyScalar(radius);

      const p2 = new THREE.Vector3(
        Math.sin(theta + span) * Math.cos(phi + span * 0.55),
        Math.cos(theta + span),
        Math.sin(theta + span) * Math.sin(phi + span * 0.55)
      ).normalize().multiplyScalar(radius);

      // Apex of the arch
      const apex = p1.clone().add(p2).normalize()
        .multiplyScalar(radius * (2.1 + Math.random() * 2.2));

      const curve = new THREE.CatmullRomCurve3([
        p1,
        p1.clone().lerp(apex, 0.35),
        apex,
        p2.clone().lerp(apex, 0.35),
        p2
      ]);

      const cols = loopPalettes[i % loopPalettes.length];
      const loopMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime:   { value: 0.0 },
          uColor1: { value: cols[0].clone() },
          uColor2: { value: cols[1].clone() },
          uPhase:  { value: Math.random() * Math.PI * 2 },
          uOpacityMultiplier: { value: 0.0 }
        },
        vertexShader: /* glsl */`
          varying float vT;
          void main() {
            vT = uv.x;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */`
          uniform float uTime;
          uniform float uPhase;
          uniform vec3  uColor1;
          uniform vec3  uColor2;
          uniform float uOpacityMultiplier;
          varying float vT;
          void main() {
            // Fade at both ends of the tube
            float endFade = smoothstep(0.0, 0.10, vT) * smoothstep(1.0, 0.90, vT);
            // Travelling energy pulse along the loop
            float wave   = 0.5 + 0.5 * sin(uTime * 3.0 + uPhase + vT * 10.0);
            float bright = 0.6 + 0.4 * wave;
            vec3  col    = mix(uColor1, uColor2, vT);
            float alpha  = endFade * bright * 0.92 * uOpacityMultiplier;
            gl_FragColor = vec4(col * bright * 1.6, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      this._solarFlareMaterials.push(loopMat);

      const tubeGeo = new THREE.TubeGeometry(curve, 52, 0.020 + Math.random() * 0.018, 8, false);
      const loopMesh = new THREE.Mesh(tubeGeo, loopMat);
      loopMesh.name = 'magneticLoop';
      this._active3DStar.add(loopMesh);
    }

    // ── 2. PLASMA ERUPTION PARTICLE SYSTEM ───────────────────────────────────
    // Hot particles that shoot up from the surface in parabolic arcs
    const eruptionCenters = Array.from({ length: 3 }, () => ({
      phi:   Math.random() * Math.PI * 2,
      theta: Math.random() * Math.PI
    }));

    const plasmaCount = 900;
    const pGeo   = new THREE.BufferGeometry();
    const pPos   = new Float32Array(plasmaCount * 3);
    const pData  = new Float32Array(plasmaCount * 4); // phi, theta, speed, phase

    for (let i = 0; i < plasmaCount; i++) {
      const ec    = eruptionCenters[i % eruptionCenters.length];
      const phi   = ec.phi   + (Math.random() - 0.5) * 0.55;
      const theta = ec.theta + (Math.random() - 0.5) * 0.55;
      pData[i * 4 + 0] = phi;
      pData[i * 4 + 1] = theta;
      pData[i * 4 + 2] = 0.3 + Math.random() * 0.7;  // speed
      pData[i * 4 + 3] = Math.random();               // phase offset

      // initial position on surface (just for bounding box)
      pPos[i * 3 + 0] = Math.sin(theta) * Math.cos(phi) * radius;
      pPos[i * 3 + 1] = Math.cos(theta) * radius;
      pPos[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * radius;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aData',    new THREE.BufferAttribute(pData, 4));

    const plasmaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:   { value: 0.0 },
        uRadius: { value: radius },
        uOpacityMultiplier: { value: 0.0 }
      },
      vertexShader: /* glsl */`
        attribute vec4   aData;
        uniform   float  uTime;
        uniform   float  uRadius;
        varying   float  vLife;
        void main() {
          float phi   = aData.x;
          float theta = aData.y;
          float speed = aData.z;
          float phase = aData.w;

          float t   = fract(uTime * speed * 0.28 + phase);
          vLife = t;

          vec3 dir = normalize(vec3(
            sin(theta) * cos(phi),
            cos(theta),
            sin(theta) * sin(phi)
          ));

          // Parabolic arc: rises then falls back
          float h = t * (1.0 - t) * 4.0;
          float r = uRadius * (1.01 + h * 2.4 * speed);
          vec3  pos = dir * r;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position  = projectionMatrix * mvPos;
          float ps = (1.0 - t * 1.1) * 4.0 * (280.0 / -mvPos.z);
          gl_PointSize = clamp(ps, 0.5, 7.0);
        }
      `,
      fragmentShader: /* glsl */`
        varying float vLife;
        uniform float uOpacityMultiplier;
        void main() {
          vec2  uv = gl_PointCoord - 0.5;
          float d  = length(uv) * 2.0;
          if (d > 1.0) discard;
          float alpha = clamp((1.0 - vLife * 1.25) * (1.0 - d), 0.0, 1.0) * uOpacityMultiplier;
          // hot white-yellow core → orange → deep red at end of life
          vec3  col = mix(
            mix(vec3(1.0, 1.0, 0.85), vec3(1.0, 0.55, 0.05), vLife * 1.2),
            vec3(0.9, 0.12, 0.02),
            clamp(vLife * 1.5 - 0.5, 0.0, 1.0)
          );
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this._solarFlareMaterials.push(plasmaMat);

    const plasmaPoints = new THREE.Points(pGeo, plasmaMat);
    plasmaPoints.name = 'plasmaEruption';
    this._active3DStar.add(plasmaPoints);

    // ── 3. EXPANDING ENERGY WAVE RINGS ───────────────────────────────────────
    // Shockwave rings that pulse outward from the star at different angles
    for (let w = 0; w < 3; w++) {
      const waveMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime:   { value: 0.0 },
          uOffset: { value: w / 3.0 },
          uRadius: { value: radius },
          uOpacityMultiplier: { value: 0.0 }
        },
        vertexShader: /* glsl */`
          uniform float uTime;
          uniform float uOffset;
          uniform float uRadius;
          varying float vT;
          void main() {
            float t   = fract(uTime * 0.20 + uOffset);
            vT = t;
            // Expand from 1× to 5× radius
            float scale = 1.0 + t * 4.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale, 1.0);
          }
        `,
        fragmentShader: /* glsl */`
          varying float vT;
          uniform float uOpacityMultiplier;
          void main() {
            float alpha = (1.0 - vT) * 0.55 * smoothstep(0.0, 0.08, vT) * uOpacityMultiplier;
            vec3  col   = mix(vec3(1.0, 0.72, 0.12), vec3(1.0, 0.18, 0.03), vT);
            gl_FragColor = vec4(col, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      this._solarFlareMaterials.push(waveMat);

      const waveGeo = new THREE.RingGeometry(radius * 1.05, radius * 1.28, 128, 1);
      const wave    = new THREE.Mesh(waveGeo, waveMat);
      wave.rotation.x = (w * Math.PI / 3.0) + Math.random() * 0.4;
      wave.rotation.z = Math.random() * Math.PI;
      wave.name = 'energyWave';
      this._active3DStar.add(wave);
    }
    // ═════════════════════════════════════════════════════════════════════════

    // ── Realistic Interstellar Dust Nebula (Matching User's Reference Image) ──
    // Removed local background sphere because it was rendering in front of background stars.
    // We will rely purely on the global milkyWaySphere for the deep space background.
    this._active3DStarDust = null;

    // ── 5. Deterministic Procedural Exoplanet Generation ─────────────────────
    let seed = 0;
    if (starData.id) {
      if (typeof starData.id === 'number') seed = starData.id;
      else {
        for (let i = 0; i < starData.id.length; i++) {
          seed = (seed << 5) - seed + starData.id.charCodeAt(i);
          seed |= 0;
        }
      }
    } else if (starData.position) {
      seed = Math.abs(Math.sin(starData.position.x || 0) * 10000 + Math.cos(starData.position.y || 0) * 20000);
    } else {
      seed = Math.floor(Math.random() * 100000);
    }

    const rand = this._createPRNG(seed);
    const numPlanets = 1 + Math.floor(rand() * 4); // 1 to 4 planets
    
    this._activeExoplanetGroup = new THREE.Group();
    this._activeExoplanetGroup.name = 'exoplanetGroup';
    this._activeExoplanetGroup.position.copy(worldPos);
    this.scene.add(this._activeExoplanetGroup);
    
    this._activeExoplanets = [];
    
    const planetColors = [
      '#4ea8de', '#56cfe1', '#64dfdf', '#72efdd',
      '#e07a5f', '#f4f1de', '#f2cc8f', '#e85d04',
      '#8338ec', '#ff006e', '#ffbe0b', '#3a86c8',
      '#a7c957', '#38b000', '#007200', '#f5cb5c',
    ];

    let currentOrbitRadius = radius * 4.0;
    
    for (let pIdx = 0; pIdx < numPlanets; pIdx++) {
      currentOrbitRadius += 2.5 + rand() * 4.5;
      
      const pSize = 0.15 + rand() * 0.48;
      const pColorHex = planetColors[Math.floor(rand() * planetColors.length)];
      const pSpeed = (0.2 + rand() * 0.5) * (rand() > 0.5 ? 1 : -1);
      const pPhase = rand() * Math.PI * 2;
      
      const pGeo = new THREE.SphereGeometry(pSize, 32, 32);
      const pMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(pColorHex),
        roughness: 0.6 + rand() * 0.3,
        metalness: 0.1 + rand() * 0.4,
        bumpScale: 0.05
      });
      
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 64; pCanvas.height = 64;
      const pCtx = pCanvas.getContext('2d');
      pCtx.fillStyle = pColorHex;
      pCtx.fillRect(0, 0, 64, 64);
      
      const isBanded = rand() > 0.5;
      if (isBanded) {
        for (let j = 0; j < 8; j++) {
          const y = rand() * 64;
          const h = 4 + rand() * 12;
          pCtx.fillStyle = 'rgba(255,255,255,' + (0.05 + rand() * 0.15).toFixed(2) + ')';
          pCtx.fillRect(0, y, 64, h);
          pCtx.fillStyle = 'rgba(0,0,0,' + (0.05 + rand() * 0.15).toFixed(2) + ')';
          pCtx.fillRect(0, y + h * 0.5, 64, h * 0.3);
        }
      } else {
        for (let j = 0; j < 12; j++) {
          const cx = rand() * 64;
          const cy = rand() * 64;
          const r = 4 + rand() * 14;
          pCtx.beginPath();
          pCtx.arc(cx, cy, r, 0, Math.PI * 2);
          pCtx.fillStyle = 'rgba(0,0,0,' + (0.1 + rand() * 0.25).toFixed(2) + ')';
          pCtx.fill();
          pCtx.beginPath();
          pCtx.arc(cx - r*0.2, cy - r*0.2, r*0.8, 0, Math.PI * 2);
          pCtx.fillStyle = 'rgba(255,255,255,' + (0.05 + rand() * 0.15).toFixed(2) + ')';
          pCtx.fill();
        }
      }
      pMat.map = new THREE.CanvasTexture(pCanvas);
      pMat.bumpMap = pMat.map;
      pMat.bumpScale = 0.008;
      
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.name = `exoplanet-${pIdx}`;
      
      const px = Math.cos(pPhase) * currentOrbitRadius;
      const pz = Math.sin(pPhase) * currentOrbitRadius;
      pMesh.position.set(px, 0, pz);
      this._activeExoplanetGroup.add(pMesh);
      
      const ringGeo = new THREE.RingGeometry(currentOrbitRadius - 0.015, currentOrbitRadius + 0.015, 64, 1);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(pColorHex),
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.name = `orbitRing-${pIdx}`;
      this._activeExoplanetGroup.add(ringMesh);
      
      this._activeExoplanets.push({
        mesh: pMesh,
        speed: pSpeed,
        radius: currentOrbitRadius,
        phase: pPhase
      });
    }

    const pLight = new THREE.PointLight(starColor, 2.8, currentOrbitRadius * 2.0, 0.5);
    pLight.name = 'starLight';
    this._activeExoplanetGroup.add(pLight);


    this.scene.add(this._active3DStar);
    this._active3DStarData = starData;

    // Ensure controls are fully unlocked so the user can drag/rotate the 3D star
    if (this.controls) {
      this.controls.enableRotate = true;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
    }

    // Give it a mock 'data' property so flyTo zooms close to it like a planet
    // Multiplying radius by 2.0 tricks flyTo into stopping further away so the star doesn't overlap the UI panels
    const flyTarget = {
      isPlanet: true, 
      mesh: this._active3DStar,
      data: { size: radius * 2.0 }
    };

    if (instant) {
      // Instantly jump to the star without the 3-second fly animation
      // Match the distance logic used in flyTo (size * 4 = radius * 2 * 4 = radius * 8)
      const targetDist = Math.max(0.5, radius * 8.0);
      const dir = new THREE.Vector3().subVectors(this.camera.position, this._active3DStar.position).normalize();
      if (dir.lengthSq() === 0) dir.set(0, 0, 1);
      const targetCamPos = this._active3DStar.position.clone().add(dir.multiplyScalar(targetDist));
      
      this.camera.position.copy(targetCamPos);
      this.controls.target.copy(this._active3DStar.position);
      this.controls.update();
      if (this.renderer) this.renderer.compile(this.scene, this.camera);
    } else {
      this.flyTo(flyTarget, 3000);
    }
  }

  triggerSupernova(starData) {
    if (!this._active3DStar || this._supernovaActive) return;

    this._supernovaActive = true;
    this._supernovaState = 'expanding';
    this._supernovaTime = 0.0;
    this._supernovaRemnants = [];

    // Disable camera panning to keep user locked on the explosion cinematic
    this.controls.enablePan = false;
    this.controls.target.copy(this._active3DStar.position);
  }

  zoomTowardsSelected(isZoomIn) {
    let targetPos = null;
    let isStarSelection = false;
    if (this._active3DStar) {
      targetPos = this._active3DStar.position;
    } else if (this._selectedCelestial && this._selectedCelestial.mesh) {
      targetPos = this._selectedCelestial.mesh.position;
    } else if (this._starSelectMarker) {
      targetPos = this._starSelectMarker.position;
      isStarSelection = true;
    }

    if (this.isPlanetariumMode) {
      // In Planetarium Mode (standing on Earth), camera position is locked.
      // Zoom by changing FOV globally, but auto-center on the selected star so it zooms into that particular star!
      if (isZoomIn) {
        this.camera.fov = THREE.MathUtils.clamp(this.camera.fov - 5, 1, 160);
      } else {
        this.camera.fov = THREE.MathUtils.clamp(this.camera.fov + 5, 1, 160);
      }
      this.camera.updateProjectionMatrix();

      if (targetPos) {
        // Auto-center the camera target on the star
        const currentDist = this.camera.position.distanceTo(this.controls.target);
        const dir = targetPos.clone().sub(this.camera.position).normalize();
        this._targetPanGoal = this.camera.position.clone().add(dir.multiplyScalar(currentDist));
      }
      return;
    }

    // In Space Mode, camera can fly freely:
    if (!targetPos) {
      // Fallback if nothing selected
      if (isZoomIn) {
        this.camera.fov = Math.max(1.0, this.camera.fov - 5);
      } else {
        this.camera.fov = Math.min(80.0, this.camera.fov + 5);
      }
      this.camera.updateProjectionMatrix();
      return;
    }

    // Zoom towards the particular star's position in 3D Space!
    this.controls.target.copy(targetPos);
    
    const dir = new THREE.Vector3().subVectors(this.camera.position, targetPos);
    const dist = dir.length();
    dir.normalize();

    const step = dist * 0.2; // Move 20% closer/farther
    if (isZoomIn) {
      if (dist > 10) this.camera.position.sub(dir.multiplyScalar(step));
    } else {
      if (dist < 100000) this.camera.position.add(dir.multiplyScalar(step));
    }
    this.controls.update();
  }

  travelToStarSequence(starData, capsules = [], wishes = []) {
    console.log("travelToStarSequence called with capsules:", capsules, "wishes:", wishes);
    if (typeof ui !== 'undefined' && ui.toast) {
      ui.toast(`Initiating warp drive to ${starData.star_name || starData.unique_id}...`);
    }

    this.selectStar(starData);
    this.flyTo(starData, 5000);

    // After the flight finishes, automatically engage the photorealistic 3D view
    setTimeout(() => {
      console.log("travelToStarSequence setTimeout fired, isMyStarTracking:", window.isMyStarTracking);
      if (window.isMyStarTracking) {
        this.viewStar3D(starData, false);
        this.renderUserItems(starData, capsules, wishes);
      }
    }, 5100);
  }

  flyTo(targetData, duration = 4000) {
    // During an active mission, mission handles camera — don't do cinematic flight
    if (this.missionSimulator && this.missionSimulator.active) return;
    
    // If flying to a planet/satellite and we are currently viewing a 3D star, exit the 3D star view!
    if ((targetData.isPlanet || targetData.isSatellite) && this._active3DStar && targetData.mesh !== this._active3DStar) {
      this._clearActiveStarSystem();
      const sunMeshEntry = this.planetMeshes ? this.planetMeshes.find(pm => pm.data.id === 'Sun') : null;
      if (sunMeshEntry) sunMeshEntry.mesh.visible = true;
      if (this._sunGlow) {
        this._sunGlow.visible = true;
        this._sunGlow.material.opacity = 1.0;
      }
    }
    
    // Set tracked object to keep camera attached to it while it orbits
    this._trackedPlanet = (targetData.isPlanet || targetData.isSatellite) ? targetData : null;
    let pos;
    if (targetData.mesh && targetData.mesh.position) pos = targetData.mesh.position;
    else if (targetData.position) pos = targetData.position;
    else pos = targetData; // Assume it's a {x,y,z} object
    
    const targetVec = new THREE.Vector3(pos.x || 0, pos.y || 0, pos.z || 0);

    const startCam = this.camera.position.clone();
    let startTarget;
    if (!this.isFlyMode) {
      startTarget = this.controls.target.clone();
    }
    
    let endCam;
    if (targetData.isPlanet || targetData.isSatellite) {
      // Fly close to the planet/satellite
      const size = (targetData.data && targetData.data.size) ? targetData.data.size : (targetData.radius || targetData.size || 10);
      const offsetDir = startCam.clone().sub(targetVec).normalize();
      if (offsetDir.lengthSq() === 0) offsetDir.set(0, 0, 1);
      
      let safeDistance = size * 4;
      if (targetData.isSatellite) safeDistance = size * 0.3;
      
      endCam = targetVec.clone().add(offsetDir.multiplyScalar(safeDistance));
      
      if (this.controls) {
        this.controls.minDistance = targetData.isSatellite ? size * 0.1 : size * 1.2;
      }
    } else {
      // ── For REAL STARS: travel to their actual 3D world position ──────────
      // Stars are inside skyGroup, convert local position → world
      let starWorldPos = targetVec.clone();
      if (this.skyGroup) {
        this.skyGroup.updateMatrixWorld();
        starWorldPos.applyMatrix4(this.skyGroup.matrixWorld);
      }

      // Approach the star from current camera direction, stopping at a nice distance
      const offsetDir = startCam.clone().sub(starWorldPos).normalize();
      if (offsetDir.lengthSq() < 0.0001) offsetDir.set(0, 0, 1);

      // Stop 8 units away from the star (feels close, like standing next to it)
      const stopDist = 8;
      endCam = starWorldPos.clone().addScaledVector(offsetDir, stopDist);

      // Also update the flight target to real world pos
      const flyTargetVec = starWorldPos;
      if (!this.isFlyMode) {
        startTarget = this.controls ? this.controls.target.clone() : new THREE.Vector3();
      }

      if (this.controls) {
        this.controls.minDistance = 0.5;
        this.controls.maxDistance = 5000000;
      }

      // Override targetVec for animation below
      targetVec.copy(starWorldPos);
    }

    const startTime = performance.now();
    const startQuat = this.camera.quaternion.clone();
    
    // Prevent normal controls from interfering during cinematic flight
    this._isCinematicFlight = true;

    const anim = (now) => {
      const t  = Math.min(1, (now - startTime) / duration);
      // Cinematic ease-in-out
      const et = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      // Dynamically recalculate target and end camera for moving objects
      let currentTargetVec = targetVec;
      let currentEndCam = endCam;
      if ((targetData.isPlanet || targetData.isSatellite) && targetData.mesh) {
        currentTargetVec = targetData.mesh.position.clone();
        const size = (targetData.data && targetData.data.size) ? targetData.data.size : (targetData.radius || targetData.size || 10);
        const offsetDir = startCam.clone().sub(currentTargetVec).normalize();
        if (offsetDir.lengthSq() === 0) offsetDir.set(0, 0, 1);
        let safeDistance = size * 4;
        if (targetData.isSatellite) safeDistance = size * 3.5;
        currentEndCam = currentTargetVec.clone().add(offsetDir.multiplyScalar(safeDistance));
      }

      this.camera.position.lerpVectors(startCam, currentEndCam, et);
      
      // Cinematic FOV Warp Effect
      const baseFov = 60;
      const maxFov = 100;
      const fovWarp = Math.sin(t * Math.PI); // 0 -> 1 -> 0
      this.camera.fov = baseFov + (maxFov - baseFov) * fovWarp;
      this.camera.updateProjectionMatrix();
      
      // ── Realistic Space Warp: Dynamically render and animate speed streaks during flight ──
      if (this._warpDustMesh && !targetData.isPlanet && !targetData.isSatellite) {
        this._warpDustMesh.visible = true;
        this._warpDustMesh.position.copy(this.camera.position);
        this._warpDustMesh.quaternion.copy(this.camera.quaternion);
        
        // Opacity peaks in the middle of travel
        this._warpDustMesh.material.opacity = fovWarp * 0.88;
        this._warpDustMesh.material.transparent = true;
        
        // Animate particles rushing past the camera
        const deltaSec = 0.016; // approximate delta
        const streakFactor = fovWarp * 18.0;
        const positions = this._warpDustMesh.geometry.attributes.position.array;
        for (let i = 0; i < this._warpParticles.length; i++) {
          const p = this._warpParticles[i];
          p.z += 480.0 * deltaSec; // Rushing speed
          if (p.z > 20) {
            p.z = -600 - Math.random() * 200;
          }
          positions[i*6]   = p.x;
          positions[i*6+1] = p.y;
          positions[i*6+2] = p.z;
          positions[i*6+3] = p.x;
          positions[i*6+4] = p.y;
          positions[i*6+5] = p.z - streakFactor;
        }
        this._warpDustMesh.geometry.attributes.position.needsUpdate = true;
      }

      if (this.isFlyMode) {
        // Look at the target while flying
        const dummyCam = this.camera.clone();
        dummyCam.position.copy(this.camera.position);
        dummyCam.lookAt(currentTargetVec);
        this.camera.quaternion.slerpQuaternions(startQuat, dummyCam.quaternion, et);
      } else {
        this.controls.target.lerpVectors(startTarget, currentTargetVec, et);
        this.controls.update();
      }

      if (t < 1) {
        requestAnimationFrame(anim);
      } else {
        this._isCinematicFlight = false;
        if (this._warpDustMesh && !this.isFlyMode) {
          this._warpDustMesh.visible = false; // Hide streaks on arrival
        }
      }
    };
    requestAnimationFrame(anim);
  }

  setAutoRotate(enabled) {
    this.autoRotate = enabled;
    this.controls.autoRotate = enabled;
  }

  toggleCelestialGrid() {
    if (this.celestialGridGroup) {
      this.celestialGridGroup.visible = !this.celestialGridGroup.visible;
      return this.celestialGridGroup.visible;
    }
    return false;
  }

  toggleBackgroundStars() {
    if (this.pointsMesh) {
      this.pointsMesh.visible = !this.pointsMesh.visible;
      return this.pointsMesh.visible;
    }
    return false;
  }

  toggleConstellations() {
    this.showConstellations = !this.showConstellations;
    if (this.showConstellations) {
      if (this.constellations) this.constellations.show();
      if (this.asterisms) this.asterisms.show();
    } else {
      if (this.constellations) this.constellations.hide();
      if (this.asterisms) this.asterisms.hide();
    }
    return this.showConstellations;
  }

  setCategoryVisibility(index, isVisible) {
    if (this._starMaterial && this._starMaterial.uniforms.uCategoryVisibility) {
      this._starMaterial.uniforms.uCategoryVisibility.value[index] = isVisible ? 1.0 : 0.0;
    }
  }

  resetView() {
    this._clearSelection();
    this.isPlanetariumMode = false;
    this.setAutoRotate(false); // Stop any auto-rotation
    
    this._clearActiveStarSystem();
    
    // Restore controls limits
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.minDistance = 0.5;
    this.controls.enabled = true;
    this._trackedPlanet = null;
    this.controls.maxDistance = 5000000;
    this.camera.up.set(0, 1, 0);

    if (this.skyDome) this.skyDome.visible = false;
    if (this.virtualHorizon) this.virtualHorizon.visible = false;
    if (this._groundDisc) this._groundDisc.visible = false;
    if (this._horizonHaze) this._horizonHaze.visible = false;

    if (this.earth) {
      this.earth.visible = true;
      this.earth.material.opacity = 1;
      this.earth.material.transparent = false;
    }
    if (this._atmosphere) {
      this._atmosphere.visible = true;
      this._atmosphere.material.opacity = 1;
    }

    // Restore Sun mesh and glow visibility when returning to space view
    const sunMeshEntry = this.planetMeshes ? this.planetMeshes.find(pm => pm.data.id === 'Sun') : null;
    if (sunMeshEntry) sunMeshEntry.mesh.visible = true;
    if (this._sunGlow) {
      this._sunGlow.visible = true;
      this._sunGlow.material.opacity = 1.0;
    }

    this.flyToOrigin();
  }

  flyToOrigin(duration = 1200) {
    const startCam    = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endCam      = new THREE.Vector3(0, 180000, 280000); // cinematic zoom out
    const endTarget   = new THREE.Vector3(0, 0, 0);

    const startTime = performance.now();
    const anim = (now) => {
      const t  = Math.min(1, (now - startTime) / duration);
      const et = easeInOutCubic(t);
      this.camera.position.lerpVectors(startCam, endCam, et);
      this.controls.target.lerpVectors(startTarget, endTarget, et);
      this.controls.update();
      if (t < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }

  getFPS() { return this._fps; }

  startRenderLoop() {
    const loop = () => {
      let delta = Math.min(0.05, this.clock.getDelta());


      const elapsed = this.clock.getElapsedTime();

      // ── Supernova Explosion updates ──
      if (this._supernovaActive) {
        this._updateSupernova(delta);
      }

      // ── Chandrayaan Mission Simulator updates ──
      if (this.missionSimulator && this.missionSimulator.active) {
        this.missionSimulator.update(delta);
      }

      // Manual camera zoom with dynamic speed based on distance
      if (this.keys && (this.keys.w || this.keys.s) && this._selectedCelestial && !this.isFlyMode && !this._isCinematicFlight) {
        const distToTarget = this.camera.position.distanceTo(this.controls.target);
        const safeDist = (this._selectedCelestial.data ? this._selectedCelestial.data.size : 10) * 1.5;
        const moveSpeed = Math.max(10000, distToTarget * 1.5) * delta; // Speed scales dynamically
        
        if (this.keys.w && distToTarget > safeDist) {
          const dir = this.controls.target.clone().sub(this.camera.position).normalize();
          this.camera.position.add(dir.multiplyScalar(moveSpeed));
        } else if (this.keys.s) {
          const dir = this.camera.position.clone().sub(this.controls.target).normalize();
          this.camera.position.add(dir.multiplyScalar(moveSpeed));
        }
        this.controls.update();
      }
      
      if (this._starMaterial && this._starMaterial.uniforms) {
        this._starMaterial.uniforms.uTime.value = elapsed;
      }
      if (this._sunMat && this._sunMat.uniforms) {
        this._sunMat.uniforms.uTime.value = elapsed;
      }
      if (this._sunGlow && this._sunGlow.material && this._sunGlow.material.uniforms && this._sunGlow.material.uniforms.uTime) {
        this._sunGlow.material.uniforms.uTime.value = elapsed;
      }
      if (this.milkyWaySphere && this.milkyWaySphere.material.uniforms) {
        this.milkyWaySphere.material.uniforms.uTime.value = elapsed;
        this.milkyWaySphere.material.uniforms.uCameraPos.value.copy(this.camera.position);
      }
      if (this.nebulaSphere && this.nebulaSphere.material.uniforms) {
        this.nebulaSphere.material.uniforms.uTime.value = elapsed;
        this.nebulaSphere.material.uniforms.uCameraPos.value.copy(this.camera.position);
      }
      if (this._sunFlareMaterials && this._sunFlareMaterials.length > 0) {
        for (const fm of this._sunFlareMaterials) {
          if (fm.uniforms && fm.uniforms.uTime) fm.uniforms.uTime.value = elapsed;
        }
      }

      // Update simulation time
      if (!this.isTimePaused) {
        const timeDeltaMs = delta * this.timeScale * 1000;
        this.simulationTime = new Date(this.simulationTime.getTime() + timeDeltaMs);
      }

      // Update comet animation
      if (this.cometAnim && this.cometGroup && this.cometGroup.visible) {
        const time = performance.now();
        const t = (time - this.cometAnim.startTime) / this.cometAnim.duration;
        if (t >= 1.0) {
          this.cometGroup.visible = false;
        } else {
          // Fast sweeping path
          const curPos = this.cometAnim.startPos.clone().lerp(this.cometAnim.endPos, t);
          this.cometGroup.position.copy(curPos);
          
          // Flash / scale effect
          if (t < 0.1) {
            const scale = Math.max(0.01, t * 10);
            this.cometGroup.scale.setScalar(scale);
          } else if (t > 0.8) {
            const scale = Math.max(0.01, (1.0 - t) * 5);
            this.cometGroup.scale.setScalar(scale);
          } else {
            this.cometGroup.scale.setScalar(1);
          }
        }
      }

      this._updateSatellites();

      // Update time display
      const clockEl = document.getElementById('time-clock');
      if (clockEl) {
        const yr = this.simulationTime.getFullYear();
        const mo = String(this.simulationTime.getMonth() + 1).padStart(2, '0');
        const dy = String(this.simulationTime.getDate()).padStart(2, '0');
        const hr = String(this.simulationTime.getHours()).padStart(2, '0');
        const mi = String(this.simulationTime.getMinutes()).padStart(2, '0');
        const se = String(this.simulationTime.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${yr}-${mo}-${dy} ${hr}:${mi}:${se}`;
      }

      // Update Planet Positions in 3D scene based on simulation time
      if (this.planetMeshes) {
        const planetsData = getPlanetsData(this.simulationTime);
        planetsData.forEach(pData => {
          const pm = this.planetMeshes.find(m => m.data.id === pData.id);
          if (pm) {
            pm.mesh.position.copy(pData.position);
            pm.data.position.copy(pData.position);

            // Update distant star sprite visibility based on distance
            if (pm.mesh.userData.starSprite) {
              const dist = this.camera.position.distanceTo(pm.mesh.position);
              const safeDist = (pm.data.radius || pm.data.size || 10) * 2.5;
              const fadeStart = safeDist * 35.0; // Stay fully visible until much closer
              const fadeEnd = safeDist * 2.0;    // Fade out right before reaching the planet
              
              let opacity = (dist - fadeEnd) / (fadeStart - fadeEnd);
              pm.mesh.userData.starSprite.material.opacity = Math.max(0, Math.min(1, opacity));
            }

            // Spin all planets on their Y-axis for visual realism
            if (pData.id !== 'Sun' && pData.id !== 'Earth' && pData.id !== 'Moon') {
              let spinSpeed = 0.015;
              if (pData.id === 'Jupiter' || pData.id === 'Saturn') spinSpeed = 0.04;
              if (pData.id === 'Uranus' || pData.id === 'Neptune') spinSpeed = 0.025;
              
              // Scale rotation with simulation speed, capped at reasonable rate
              const scaleFactor = this.isTimePaused ? 0 : Math.min(80.0, this.timeScale);
              pm.mesh.rotation.y += spinSpeed * delta * (scaleFactor || 1.0);
            }

            // Update Saturn ring shadow light direction
            if (pData.id === 'Saturn' && this.saturnRing) {
              const lightDirWorld = pm.mesh.position.clone().normalize();
              const lightDirLocal = lightDirWorld.applyQuaternion(pm.mesh.quaternion.clone().invert());
              this.saturnRing.material.uniforms.uLightDirLocal.value.copy(lightDirLocal);
            }
          }
        });

        // Update synthetic famous missions
        this.satellites.forEach(sat => {
          if (sat.orbitParams) {
             const parent = this.planetMeshes.find(p => p.data.id === sat.orbitParams.target);
             const parentPos = parent ? parent.mesh.position : (this.earth ? this.earth.position : new THREE.Vector3());
             sat.orbitAngle += (sat.orbitParams.speed || 0.1) * delta;
             sat.mesh.position.set(
               parentPos.x + Math.cos(sat.orbitAngle) * sat.orbitParams.distance,
               parentPos.y,
               parentPos.z + Math.sin(sat.orbitAngle) * sat.orbitParams.distance
             );
          }
        });

        // Track the selected planet or satellite so the camera moves with it
        if (this._trackedPlanet && !this._isCinematicFlight && !this.isPlanetariumMode && !this.isFlyMode) {
          let targetPos = null;
          const targetId = this._trackedPlanet.data ? this._trackedPlanet.data.id : this._trackedPlanet.id;
          
          if (this._trackedPlanet.isSatellite && this.satellites) {
            const sm = this.satellites.find(s => s.name === targetId);
            if (sm) targetPos = sm.mesh.position.clone();
          } else if (this.planetMeshes) {
            const pm = this.planetMeshes.find(m => m.data.id === targetId);
            if (pm) targetPos = pm.mesh.position.clone();
          }
          
          if (targetPos) {
            const deltaMove = targetPos.clone().sub(this.controls.target);
            
            if (deltaMove.lengthSq() > 0.000001) {
              this.controls.target.copy(targetPos);
              this.camera.position.add(deltaMove);
            }
          }
        }
      }

      // ── Real-time Earth Rotation (UTC-based for correct day/night) ──
      if (this.earth) {
        // During Chandrayaan mission, LOCK Earth rotation completely — rocket is a child of Earth
        // so any rotation change moves the launch site and rocket with it.
        if (this.missionSimulator && this.missionSimulator.active) {
          // Enforce frozen angle every frame (guard against any other code changing it)
          if (this.missionSimulator._frozenEarthRotY !== undefined) {
            this.earth.rotation.y = this.missionSimulator._frozenEarthRotY;
          }
        } else {
        // Use UTC time — Earth's rotation is measured from Greenwich Meridian
        const utcMs   = this.simulationTime.getTime();
        const msInDay = 86400000.0;
        // Fractional day since J2000 epoch for GMST calculation
        const jd       = utcMs / msInDay + 2440587.5;
        const T        = (jd - 2451545.0) / 36525.0;  // Julian centuries since J2000
        // Greenwich Mean Sidereal Time (GMST) in degrees
        const gmst_deg = (280.46061837
          + 360.98564736629 * (jd - 2451545.0)
          + 0.000387933 * T * T
          - T * T * T / 38710000.0) % 360;
        const gmst_rad = gmst_deg * (Math.PI / 180);

        // Correct rotation: Three.js SphereGeometry puts Greenwich (u=0.5) at +X.
        // GMST=0 means Greenwich faces the vernal equinox (+X in our coords).
        // So: rotation.y = -GMST_rad  ← no extra offset needed.
        // The old code had "- Math.PI" which was a 180° flip causing night/day swap!
        this.earth.rotation.y = -gmst_rad;
        }

        // ── Update Sun DirectionalLight direction (FIXED) ──
        // DirectionalLight shines FROM position TOWARD target.
        // Sun is at origin (0,0,0). Earth is at earthPos.
        // Removed directional light per-frame update. PointLight at origin handles illumination for all planets automatically.
      }

      if (this.earthClouds) {
        const cloudSpeed = 0.015;
        // Freeze clouds during mission (Earth is frozen, clouds should be too)
        const scaleFactor = (this.isTimePaused || (this.missionSimulator && this.missionSimulator.active)) ? 0 : Math.min(80.0, this.timeScale);
        this.earthClouds.rotation.y += cloudSpeed * delta * (scaleFactor || 1.0);
      }
      
      if (this._atmosphere && this.earth) {
        this._atmosphere.position.copy(this.earth.position);
        // Also update atmosphere sun direction for dawn/dusk coloring
        if (this._atmosphereMat && this._atmosphereMat.uniforms) {
          const sunDir = new THREE.Vector3(0, 0, 0).sub(this.earth.position).normalize();
          this._atmosphereMat.uniforms.uSunDir.value.copy(sunDir);
        }
      }



      if (this._shootingStars) {
        this._shootingStars.forEach(ss => {
          if (ss.delay > 0) {
            ss.delay -= delta;
            ss.mesh.visible = false;
            return;
          }
          
          ss.life -= delta;
          if (ss.life <= 0) {
             this._resetShootingStar(ss);
             return;
          }
          
          ss.mesh.visible = true;

          // Distance-based speed: close to camera = fast, far away = slow (parallax realism)
          const distNow = ss.mesh.position.distanceTo(this.camera.position);
          // Map distance 0–80 → speed multiplier 3.0–0.15
          const speedMul = THREE.MathUtils.lerp(3.0, 0.15, Math.min(distNow / 80.0, 1.0));
          const effectiveSpeed = (ss._baseSpeed || ss.speed) * speedMul;

          ss.mesh.position.addScaledVector(ss.dir, effectiveSpeed * delta);

          if (ss.mesh.material && ss.mesh.material.uniforms && ss.mesh.material.uniforms.uOpacity) {
            // Distance-based fade: far meteors are much dimmer
            const distFade = Math.max(0, 1.0 - distNow / 70.0); // fully invisible beyond 70 units
            ss.mesh.material.uniforms.uOpacity.value = Math.max(0, ss.life / ss.maxLife) * 0.85 * distFade;
          }
        });
      }

      // Warp Dust Effect
      if ((this.isFlyMode || this.isManualWarping || this.keys.w || this.keys.s) && this._warpDustMesh) {
        if (!this._warpDustMesh.visible) this._warpDustMesh.visible = true;
        if (!this._prevCamPos) {
          this._prevCamPos = this.camera.position.clone();
        }
        const movement = this.camera.position.clone().sub(this._prevCamPos);
        const speedVal = movement.length();
        this._prevCamPos.copy(this.camera.position);

        this._warpDustMesh.position.copy(this.camera.position);
        this._warpDustMesh.quaternion.copy(this.camera.quaternion);

        const currentSpeedSec = speedVal / (delta || 0.016);
        let opacityVal = 0;
        if (currentSpeedSec > 100) {
          opacityVal = Math.min(0.75, currentSpeedSec / 1000000);
        }
        this._warpDustMesh.material.opacity = opacityVal;

        if (opacityVal > 0) {
          const positions = this._warpDustMesh.geometry.attributes.position.array;
          const streakFactor = Math.min(250, currentSpeedSec * 0.0001);

          for (let i = 0; i < this._warpParticles.length; i++) {
            const p = this._warpParticles[i];
            p.z += currentSpeedSec * delta * 0.8;
            if (p.z > 200) {
              p.z = -800 - Math.random() * 200;
              p.x = (Math.random() - 0.5) * 600;
              p.y = (Math.random() - 0.5) * 600;
            }
            positions[i*6]   = p.x;
            positions[i*6+1] = p.y;
            positions[i*6+2] = p.z;
            positions[i*6+3] = p.x;
            positions[i*6+4] = p.y;
            positions[i*6+5] = p.z - streakFactor;
          }
          this._warpDustMesh.geometry.attributes.position.needsUpdate = true;
        }
      }

      // Calculate sun altitude for sky/haze/sun-visibility (shared across all sub-systems)
      const sunMesh = this.planetMeshes ? this.planetMeshes.find(pm => pm.data.id === 'Sun')?.mesh : null;
      const sunPos = sunMesh ? sunMesh.position.clone() : new THREE.Vector3(0, 0, 0);
      const sunDir = sunPos.clone().sub(this.camera.position).normalize();
      const upDir = this.camera.up.clone().normalize();
      const sunAlt = sunDir.dot(upDir);

      // Update HUD markers for planets
      this._updatePlanetLabels(sunAlt);

      if (this.isPlanetariumMode) {
        const bottomControls = document.getElementById('bottom-controls');
        if (bottomControls && !bottomControls.classList.contains('hidden')) {
          bottomControls.classList.add('hidden');
        }
        
        this._updatePlanetariumMode();
        if (this._updateStarLabels) this._updateStarLabels();
        
        if (this._isTransitioning) {
          const now = performance.now();
          const duration = this._transitionDuration || 3500.0;
          const progress = THREE.MathUtils.clamp((now - this._transitionStart) / duration, 0, 1);
          
          // easeInOutCubic
          const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          
          const targetPos = this._lastSurfacePos.clone().add(this._lastUpDir.clone().multiplyScalar(0.05));
          const lookDir = this._northDir.clone().multiplyScalar(0.9).add(this._lastUpDir.clone().multiplyScalar(0.1)).normalize();
          const targetLook = targetPos.clone().add(lookDir);
          
          const dummyCam = this.camera.clone();
          dummyCam.position.copy(targetPos);
          dummyCam.up.copy(this._lastUpDir);
          dummyCam.lookAt(targetLook);
          const targetQuat = dummyCam.quaternion.clone();
          
          this.camera.position.lerpVectors(this._transitionStartPos, targetPos, ease);
          this.camera.quaternion.slerpQuaternions(this._transitionStartQuat, targetQuat, ease);
          
          if (progress > 0.85) {
            // Hide the 3D Earth sphere and atmosphere to only show the realistic 360 image
            if (this.earth) this.earth.visible = false;
            if (this._atmosphere) this._atmosphere.visible = false;
            if (this._groundDisc) this._groundDisc.visible = true;
            if (this.virtualHorizon) this.virtualHorizon.visible = true;
            if (this.skyDome) this.skyDome.visible = true;
          }
          
          if (progress >= 1.0) {
            this._isTransitioning = false;
            this.controls.enabled = true;
            this.controls.enableZoom = false;
            this.controls.enablePan = false;
            this.controls.target.copy(targetLook);
            this.camera.up.copy(this._lastUpDir);
            this.controls.maxPolarAngle = Math.PI / 2; // Prevent looking below horizon
            this.controls.update();
          }
        } else {
          // Add keyboard panning for Planetarium Mode (rotate view)
          if (!this._isCinematicFlight && this.keys) {
             const panSpeed = 1.5 * delta;
             let moved = false;
             
             // Current looking direction vector
             const targetVec = this.controls.target.clone().sub(this.camera.position);
             // Right vector of camera for up/down rotation
             const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
             
             if (this.keys.ArrowLeft) {
                targetVec.applyAxisAngle(this._lastUpDir, panSpeed);
                moved = true;
             }
             if (this.keys.ArrowRight) {
                targetVec.applyAxisAngle(this._lastUpDir, -panSpeed);
                moved = true;
             }
             if (this.keys.ArrowUp) {
                targetVec.applyAxisAngle(camRight, panSpeed);
                moved = true;
             }
             if (this.keys.ArrowDown) {
                targetVec.applyAxisAngle(camRight, -panSpeed);
                moved = true;
             }
             
             if (moved) {
                this.controls.target.copy(this.camera.position).add(targetVec);
                this._targetPanGoal = null; // override auto-panning
             }
          }

          if (this._targetPanGoal && this.controls && !this.isFlyMode && !this._isCinematicFlight) {
            const dist = this.controls.target.distanceTo(this._targetPanGoal);
            const stopThreshold = Math.max(0.5, dist * 0.005);
            if (dist > stopThreshold) {
              this.controls.target.lerp(this._targetPanGoal, 0.12);
            } else {
              this.controls.target.copy(this._targetPanGoal);
              this._targetPanGoal = null;
            }
          }
          this.controls.update();
        }


        // 1. Center Sky Dome on camera and update atmosphere uniforms
        if (this.skyDome && sunMesh) {
          this.skyDome.position.copy(this.camera.position);
          this.skyDome.material.uniforms.uCameraPos.value.copy(this.camera.position);
          this.skyDome.material.uniforms.uSunPos.value.copy(sunPos);
          this.skyDome.material.uniforms.uUpDir.value.copy(upDir);
          this.skyDome.visible = false; // HIDE sky dome so stars are always visible
        }

        // (virtual horizon tree opacity logic removed)

        // Hide planet orbit lines in Earth view
        if (this._orbitLines) {
          Object.values(this._orbitLines).forEach(line => line.visible = false);
        }

        // Hide satellites in Earth view
        if (this._satelliteMeshes) {
          this._satelliteMeshes.visible = false;
        }

        // Update star shader uniforms for horizon clipping and daylight fading
        if (this.pointsMesh && this.pointsMesh.material.uniforms) {
          this.pointsMesh.material.uniforms.uIsPlanetarium.value = this.isPlanetariumMode ? 1.0 : 0.0;
          this.pointsMesh.material.uniforms.uObserverPos.value.copy(this.camera.position);
          this.pointsMesh.material.uniforms.uUpDir.value.copy(upDir);
          this.pointsMesh.material.uniforms.uSunAlt.value = sunAlt;
          
          // Calculate limiting magnitude based on zoom (FOV)
          let limitMag = 12.0; // Show all stars in Space Mode
          if (this.isPlanetariumMode) {
             // Normal FOV 45 -> Mag 5.5 (naked eye limit)
             // Telescopic FOV 10 -> Mag 12.0 (faint stars revealed)
             limitMag = 5.5 + (45.0 - Math.min(45.0, this.camera.fov)) * (6.5 / 35.0);
          }
          this.pointsMesh.material.uniforms.uLimitingMag.value = limitMag;
        }

        // ---- Sun Horizon Visibility ----
        if (sunMesh) {
          if (sunAlt < 0) {
            sunMesh.visible = false;
            if (this._sunGlow) this._sunGlow.visible = false;
          } else if (sunAlt < 0.04) {
            sunMesh.visible = true;
            if (this._sunGlow) {
              this._sunGlow.visible = true;
              const t = sunAlt / 0.04;
              this._sunGlow.material.opacity = t;
            }
          } else {
            sunMesh.visible = true;
            if (this._sunGlow) {
              this._sunGlow.visible = true;
              this._sunGlow.material.opacity = 1.0;
            }
          }
        }

        // Update horizon haze with current sun altitude
        if (this._horizonHaze && this._horizonHaze.material.uniforms) {
          this._horizonHaze.material.uniforms.uSunAlt.value = sunAlt;
          this._horizonHaze.visible = false; // HIDE horizon haze
        }

        // 2. Render Compass Labels N, E, S, W
        if (this._northDir && this._eastDir) {
          const d = 1450; // Place labels near horizon edge
          const directions = [
            { name: 'N', pos: this.virtualHorizon.position.clone().addScaledVector(this._northDir, d), color: '#e63946' }, // Stellarium Red for North
            { name: 'S', pos: this.virtualHorizon.position.clone().addScaledVector(this._northDir, -d), color: '#f8f9fa' }, // Off-white for South
            { name: 'E', pos: this.virtualHorizon.position.clone().addScaledVector(this._eastDir, d), color: '#f8f9fa' }, // Off-white for East
            { name: 'W', pos: this.virtualHorizon.position.clone().addScaledVector(this._eastDir, -d), color: '#f8f9fa' } // Off-white for West
          ];

          directions.forEach(dir => {
            let el = document.getElementById(`compass-label-${dir.name}`);
            if (!el) {
              el = document.createElement('div');
              el.id = `compass-label-${dir.name}`;
              el.className = 'compass-label';
              el.style.position = 'fixed';
              el.style.pointerEvents = 'none';
              el.style.zIndex = '85';
              el.style.fontSize = '24px';
              el.style.fontWeight = '900';
              el.style.fontFamily = 'var(--font-sans)';
              el.style.textShadow = '0 2px 8px rgba(0,0,0,0.95)';
              el.textContent = dir.name;
              document.body.appendChild(el);
            }
            el.style.color = dir.color;

            const tempV = dir.pos.clone();
            tempV.project(this.camera);

            const isBehind = tempV.z > 1;
            if (isBehind) {
              el.style.display = 'none';
            } else {
              const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
              const y = (tempV.y * -0.5 + 0.5) * window.innerHeight;
              el.style.left = `${x}px`;
              el.style.top = `${y}px`;
              el.style.transform = 'translate(-50%, -50%)';
              el.style.display = 'block';
            }
          });
        }
      // Show / hide Exit to Space button based on surface mode
      if (this._exitSurfaceBtn) {
        this._exitSurfaceBtn.style.display = this.isPlanetariumMode ? 'flex' : 'none';
      }

      } else {
        this.controls.update();

        // Space Mode (Heliocentric)
        if (this.pointsMesh && this.pointsMesh.material.uniforms) {
          this.pointsMesh.material.uniforms.uIsPlanetarium.value = 0.0;
        }

        // Show planet orbit lines in Space view
        if (this._orbitLines) {
          Object.values(this._orbitLines).forEach(line => line.visible = true);
        }

        // Show satellites in Space view
        if (this._satelliteMeshes) {
          this._satelliteMeshes.visible = true;
        }

        // Hide Exit button in space mode
        if (this._exitSurfaceBtn) this._exitSurfaceBtn.style.display = 'none';

        // Hide compass labels
        ['N', 'S', 'E', 'W'].forEach(name => {
          const el = document.getElementById(`compass-label-${name}`);
          if (el) el.style.display = 'none';
        });

        // Show bottom controls in space mode
        const bottomControls = document.getElementById('bottom-controls');
        if (bottomControls && bottomControls.classList.contains('hidden')) {
          bottomControls.classList.remove('hidden');
        }
      }



      // Render Time updates for stars
      if (this.pointsMesh && this.pointsMesh.material.uniforms) {
        this.pointsMesh.material.uniforms.uTime.value = performance.now() / 1000;
      }

      // \u2500\u2500 Animate star selection marker (pulsing ring) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
      if (this._starSelectMarker && this._starSelectMarker._birthTime !== undefined) {
        const age = (performance.now() - this._starSelectMarker._birthTime) / 1000;
        // Pulse: scale oscillates between 0.8x and 1.3x of base size
        const pulse = 1.0 + 0.25 * Math.sin(age * 3.0);
        const base  = this._starSelectMarker._baseSize;
        this._starSelectMarker.scale.set(base * pulse, base * pulse, 1);
        // Also fade opacity with pulse
        if (this._starSelectMarker.material) {
          this._starSelectMarker.material.opacity = 0.6 + 0.4 * Math.abs(Math.sin(age * 3.0));
        }
      }

      // Update 3D Star shader time, rotation, and all solar flare materials
      if (this._active3DStar && this._active3DStar.material && this._active3DStar.material.uniforms) {
        const timeVal = performance.now() / 1000;
        this._active3DStar.material.uniforms.uTime.value = timeVal;

        // Slowly rotate the star for organic surface depth
        this._active3DStar.rotation.y = timeVal * 0.04;
        this._active3DStar.rotation.x = timeVal * 0.015;

        // Animate ALL solar flare materials (loops, plasma, waves)
        if (this._solarFlareMaterials) {
          for (const fm of this._solarFlareMaterials) {
            if (fm.uniforms && fm.uniforms.uTime) fm.uniforms.uTime.value = timeVal;
          }
        }

        // Get camera distance to the active 3D star
        const currentDist = this.camera.position.distanceTo(this._active3DStar.position);

        // ── 1. Dynamic Solar Flares Proximity Fading ──────────────────────────
        // Fade in flares as we zoom in (between 60 and 15 units)
        const tFlare = THREE.MathUtils.clamp((60 - currentDist) / (60 - 15), 0, 1);
        const flareOpacity = tFlare * tFlare * (3.0 - 2.0 * tFlare);
        if (this._solarFlareMaterials) {
          for (const fm of this._solarFlareMaterials) {
            if (fm.uniforms && fm.uniforms.uOpacityMultiplier) {
              fm.uniforms.uOpacityMultiplier.value = flareOpacity;
            }
          }
        }

        // ── 2. Dynamic Atmospheric Glow Proximity Fading ──────────────────────
        // Fade out atmospheric glow as we zoom in (between 60 and 12 units) to reveal crisp details
        const glow = this._active3DStar.getObjectByName('glowSprite');
        if (glow && glow.material) {
          const tGlow = THREE.MathUtils.clamp((currentDist - 12) / (60 - 12), 0, 1);
          glow.material.opacity = 0.03 + 0.27 * tGlow; // subtle rim light remains
        }

        // ── 3. Dynamic Volumetric Nebulae (Dust Clouds) Proximity Fading & Drift ──
        if (this._active3DStarDust) {
          // Fade in nebulae as we fly in (between 240 and 40 units)
          const tNebula = THREE.MathUtils.clamp((240 - currentDist) / (240 - 40), 0, 1);
          const nebulaOpacity = tNebula * tNebula * (3.0 - 2.0 * tNebula);
          
          if (this._active3DStarDust.material && this._active3DStarDust.material.uniforms) {
            this._active3DStarDust.material.uniforms.uOpacity.value = nebulaOpacity;
            this._active3DStarDust.material.uniforms.uTime.value = elapsed;
            this._active3DStarDust.material.uniforms.uCameraPos.value.copy(this.camera.position);
          }
          
          // Organic drift rotation
          this._active3DStarDust.rotation.y = timeVal * 0.012;
        }

        // ── 4. Animate Exoplanets ─────────────────────────────────────────────
        if (this._activeExoplanets && this._activeExoplanets.length > 0) {
          for (const p of this._activeExoplanets) {
            const angle = p.phase + p.speed * timeVal * 0.4; // Stable, frame-independent animation
            p.mesh.position.set(Math.cos(angle) * p.radius, 0, Math.sin(angle) * p.radius);
            p.mesh.rotation.y = timeVal * 0.18 * Math.abs(p.speed); // Spin on axis
          }
        }
      }

      // Animate Comet
      if (this.cometGroup && this.cometGroup.visible && this.cometAnim) {
        const time = performance.now();
        const progress = (time - this.cometAnim.startTime) / this.cometAnim.duration;
        if (progress >= 1) {
          this.cometGroup.visible = false;
        } else {
          this.cometGroup.position.lerpVectors(this.cometAnim.startPos, this.cometAnim.endPos, progress);
          
          // Scale/flash effect
          if (progress < 0.1) {
            this.cometGroup.scale.setScalar(progress * 10);
          } else if (progress > 0.8) {
            this.cometGroup.scale.setScalar((1.0 - progress) * 5);
          } else {
            this.cometGroup.scale.setScalar(1);
          }
        }
      }

      if (this._activeUserItemsGroup) {
        this._activeUserItemsGroup.rotation.y += 0.002;
        // Make items throb/spin
        this._activeUserItemsGroup.children.forEach(child => {
          if (child.isMesh) {
            child.rotation.x += 0.02;
            child.rotation.y += 0.01;
          } else if (child.isSprite) {
            // scale pulsing
            const time = performance.now() * 0.003;
            const scale = 0.4 + Math.sin(time + child.id) * 0.1;
            child.scale.set(scale, scale, 1);
          }
        });
      }

      // Smooth Camera Slide towards the zoom goal (creating an immersive flight/closer movement feel)
      if (this._targetCamGoal && !this._isCinematicFlight) {
        const distToGoal = this.camera.position.distanceTo(this._targetCamGoal);
        // Use a proportional threshold: stop when within 0.5% of goal distance OR less than 1 unit
        const stopThreshold = Math.max(1.0, distToGoal * 0.005);
        if (distToGoal > stopThreshold) {
          this.camera.position.lerp(this._targetCamGoal, 0.15); // Faster lerp = less drift time
        } else {
          this.camera.position.copy(this._targetCamGoal);
          this._targetCamGoal = null;
        }
        this.controls.update();
      }

      if (this.constellations) {
        this.constellations.updateHorizonClip(this.camera, this._lastUpDir || new THREE.Vector3(0,1,0), this.isPlanetariumMode);
      }
      if (this.asterisms) {
        this.asterisms.updateHorizonClip(this.camera, this._lastUpDir || new THREE.Vector3(0,1,0), this.isPlanetariumMode);
      }

      if (this.is2DMapMode && this._mapModeValue < 1) {
        this._mapModeValue = Math.min(1, this._mapModeValue + 0.02);
        this._starMaterial.uniforms.uMapMode.value = this._mapModeValue;
        if (this.constellations) this.constellations.setMapMode(this._mapModeValue);
      } else if (!this.is2DMapMode && this._mapModeValue > 0) {
        this._mapModeValue = Math.max(0, this._mapModeValue - 0.02);
        this._starMaterial.uniforms.uMapMode.value = this._mapModeValue;
        if (this.constellations) this.constellations.setMapMode(this._mapModeValue);
      }

      // Update live telemetry + Earth zoom map
      if (this._frameCount % 3 === 0) this._updateEarthZoom();
      if (this._frameCount % 10 === 0) this._updateTelemetry();
      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }

      this._frameCount++;
      const now = performance.now();
      if (now - this._fpsLast >= 1000) {
        this._fps = this._frameCount;
        this._frameCount = 0;
        this._fpsLast = now;
        const fpsEl = document.getElementById('fps-counter');
        if (fpsEl) fpsEl.textContent = `${this._fps} fps`;
      }
    };
    this.renderer.setAnimationLoop(loop);
  }

  triggerComet() {
    if (!this.cometGroup) {
       this.cometGroup = new THREE.Group();
       this.scene.add(this.cometGroup);
       
       // Volumetric Shader-based Comet (No planes, no circles, perfectly smooth)
       // Tail points along Z axis. Head is narrow, tail is wide.
       const tailGeo = new THREE.CylinderGeometry(1.5, 120, 1800, 32, 1, true);
       tailGeo.translate(0, -900, 0); 
       // IMPORTANT: +Math.PI / 2 flips the geometry so the Head points FORWARD in the animation path
       tailGeo.rotateX(Math.PI / 2); 
       
       const tailMat = new THREE.ShaderMaterial({
         uniforms: {
           color1: { value: new THREE.Color(0xffffff) }, // Blinding core
           color2: { value: new THREE.Color(0x88ccff) }, // Blue coma
           color3: { value: new THREE.Color(0x001166) }  // Deep space fade
         },
         vertexShader: `
           varying vec2 vUv;
           varying vec3 vNormal;
           varying vec3 vViewPosition;
           void main() {
             vUv = uv;
             vNormal = normalize(normalMatrix * normal);
             vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
             vViewPosition = -mvPosition.xyz;
             gl_Position = projectionMatrix * mvPosition;
           }
         `,
         fragmentShader: `
           varying vec2 vUv;
           varying vec3 vNormal;
           varying vec3 vViewPosition;
           
           uniform vec3 color1;
           uniform vec3 color2;
           uniform vec3 color3;
           
           // High-frequency noise
           float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
           float noise(vec2 p){
               vec2 ip = floor(p); vec2 u = fract(p); u = u*u*(3.0-2.0*u);
               return mix(mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x), mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
           }

           void main() {
             // vUv.y: 1 is Head, 0 is Tail end
             float y = 1.0 - vUv.y; 
             
             // Volumetric Fresnel effect: makes edges completely transparent (no cylinder borders)
             vec3 normal = normalize(vNormal);
             vec3 viewDir = normalize(vViewPosition);
             float rim = abs(dot(normal, viewDir));
             float softEdge = smoothstep(0.0, 0.4, rim); // Fade edges beautifully
             
             // Dynamic Streaks
             float streak1 = noise(vec2(vUv.x * 120.0, y * 10.0));
             float streak2 = noise(vec2(vUv.x * 300.0, y * 4.0));
             float streaks = (streak1 * 0.6 + streak2 * 0.4);
             float streakIntensity = mix(1.0, streaks, clamp(y * 2.5, 0.0, 1.0));
             
             // Alpha fading to invisible
             float alpha = pow(1.0 - y, 3.5) * softEdge * streakIntensity;
             
             // Colors
             vec3 finalColor = mix(color1, color2, y * 5.0);
             if (y > 0.2) {
                 finalColor = mix(color2, color3, (y - 0.2) * 1.5);
             }
             
             gl_FragColor = vec4(finalColor * 2.0, alpha * 1.5);
           }
         `,
         transparent: true,
         blending: THREE.AdditiveBlending,
         depthWrite: false,
         side: THREE.DoubleSide
       });
       
       const tail = new THREE.Mesh(tailGeo, tailMat);
       this.cometGroup.add(tail);
       
       // Add intense point light
       const pointLight = new THREE.PointLight(0xaaffff, 200, 4000);
       this.cometGroup.add(pointLight);
    }
    
    // Extremely fast sweeping path across the camera view
    const dist = 300 + Math.random() * 200; // Closer than before
    const isRight = Math.random() > 0.5;
    
    const startOffset = new THREE.Vector3(
      isRight ? (dist * 2) : -(dist * 2),
      dist * (Math.random() - 0.5),
      -dist * 1.5
    );
    
    const endOffset = new THREE.Vector3(
      isRight ? -(dist * 2) : (dist * 2),
      startOffset.y - (dist * 0.5 + Math.random() * dist),
      -dist * 0.5
    );
    
    const startPos = startOffset.clone().applyQuaternion(this.camera.quaternion).add(this.camera.position);
    const endPos = endOffset.clone().applyQuaternion(this.camera.quaternion).add(this.camera.position);
    
    this.cometGroup.position.copy(startPos);
    this.cometGroup.lookAt(endPos);
    this.cometGroup.visible = true;
    this.cometGroup.scale.setScalar(0.01); // Start tiny for flash effect
    
    this.cometAnim = {
      startPos,
      endPos,
      startTime: performance.now(),
      // Very fast realistic duration (1 to 2 seconds)
      duration: 1000 + Math.random() * 1000
    };
  }

  triggerCinematicComet() {
    if (!this.cometGroup) {
      this.triggerComet(); // Initialize the group and meshes
      this.cometGroup.visible = false;
    }
    
    // Sweeping majestic path very close to the camera
    const dist = 150; 
    
    // Sweep from far left to far right
    const startOffset = new THREE.Vector3(-dist * 4, dist * 0.8, -dist * 0.8);
    const endOffset = new THREE.Vector3(dist * 4, -dist * 0.2, -dist * 1.5);
    
    const startPos = startOffset.clone().applyQuaternion(this.camera.quaternion).add(this.camera.position);
    const endPos = endOffset.clone().applyQuaternion(this.camera.quaternion).add(this.camera.position);
    
    this.cometGroup.position.copy(startPos);
    this.cometGroup.lookAt(endPos);
    this.cometGroup.visible = true;
    this.cometGroup.scale.setScalar(0.01);
    
    this.cometAnim = {
      startPos,
      endPos,
      startTime: performance.now(),
      // Cinematic slow duration (6 seconds)
      duration: 6000 
    };

    // Hide UI Panels for a pure cinematic experience
    const uiElements = document.querySelectorAll('.immersive-panel, .immersive-overlay-header');
    if (uiElements.length > 0) {
      uiElements.forEach(el => {
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.pointerEvents = 'none';
      });
      
      // Restore UI after the comet finishes (approx 7 seconds)
      setTimeout(() => {
        uiElements.forEach(el => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          el.style.pointerEvents = 'auto';
        });
      }, 7000);
    }
    
    // Ensure the user has full freedom to look around from any position!
    if (this.controls) {
      this.controls.enabled = true;
    }
  }

  stopRenderLoop() {
    this.renderer.setAnimationLoop(null);
  }


  enableSpaceshipMode() {
    this.isFlyMode = true;
    this.isPlanetariumMode = false;
    this.camera.up.set(0, 1, 0);
    this.camera.fov = 45;
    this.camera.updateProjectionMatrix();
    this.controls.enabled = false;
    this.controls.maxPolarAngle = Math.PI; // Reset polar angle restriction
    this.flyControls.movementSpeed = 150000; 
    this.virtualHorizon.visible = false;
    if (this._groundDisc) this._groundDisc.visible = false;
    if (this._horizonHaze) this._horizonHaze.visible = false;
    
    if (this.earth) this.earth.visible = true;
    if (this._atmosphere) this._atmosphere.visible = true;

    // Restore Sun visibility when leaving planetarium mode for space flight
    const sunEntry = this.planetMeshes ? this.planetMeshes.find(pm => pm.data.id === 'Sun') : null;
    if (sunEntry) sunEntry.mesh.visible = true;
    if (this._sunGlow) {
      this._sunGlow.visible = true;
      this._sunGlow.material.opacity = 1.0;
    }
    
    if (this._warpDustMesh) this._warpDustMesh.visible = true;
    this._prevCamPos = this.camera.position.clone();

    // Start spaceship near Earth if teleported
    if (this.camera.position.distanceTo(this.earth ? this.earth.position : new THREE.Vector3()) < 10) {
      if (this.earth) {
        this.camera.position.copy(this.earth.position).add(new THREE.Vector3(0, 10, 100));
        this.camera.lookAt(this.earth.position);
      } else {
        this.camera.position.set(0, 10, 100);
        this.camera.lookAt(0, 0, 0);
      }
    }
  }

  disableSpaceshipMode() {
    this.isFlyMode = false;
    this.isPlanetariumMode = false;
    this.camera.up.set(0, 1, 0);
    this.controls.enabled = true;
    this.controls.maxPolarAngle = Math.PI; // Reset polar angle restriction
    this.virtualHorizon.visible = false;
    if (this._groundDisc) this._groundDisc.visible = false;
    if (this._horizonHaze) this._horizonHaze.visible = false;
    this.controls.minDistance = 5.5;
    this.controls.maxDistance = 5000000;
    
    if (this._warpDustMesh) this._warpDustMesh.visible = false;

    // Target closest planet if near one, otherwise target Sun (origin)
    let closest = null;
    let minDist = Infinity;
    if (this.planetMeshes) {
      this.planetMeshes.forEach(pm => {
        const dist = this.camera.position.distanceTo(pm.mesh.position);
        if (dist < minDist) {
          minDist = dist;
          closest = pm;
        }
      });
    }

    if (closest && minDist < closest.data.size * 30) {
      this.controls.target.copy(closest.mesh.position);
    } else {
      this.controls.target.set(0, 0, 0);
    }
    this.controls.update();
  }
  _transitionCamPos(targetCamPos, duration, targetLookAt = null) {
    const startTime = performance.now();
    const startCamPos = this.camera.position.clone();
    let startTarget = null;
    if (this.controls && targetLookAt) {
      startTarget = this.controls.target.clone();
    }
    
    this._isCinematicFlight = true;

    const anim = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      // Cinematic ease-in-out
      const et = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(startCamPos, targetCamPos, et);
      
      if (this.controls && targetLookAt && startTarget) {
        this.controls.target.lerpVectors(startTarget, targetLookAt, et);
        this.controls.update();
      } else if (this.controls) {
        this.controls.update();
      }

      if (t < 1) {
        requestAnimationFrame(anim);
      } else {
        this._isCinematicFlight = false;
      }
    };
    requestAnimationFrame(anim);
  }

  teleportToSurface(lat, lon, transitionDuration = 3500) {
    this.isPlanetariumMode = true;
    this.isFlyMode = false;
    
    this.planetariumLat = lat;
    this.planetariumLon = lon;
    this._lastSurfacePos = new THREE.Vector3();
    this._lastUpDir = new THREE.Vector3(0, 1, 0);

    // Setup transition state
    this._isTransitioning = true;
    this._transitionStart = performance.now();
    this._transitionStartPos = this.camera.position.clone();
    this._transitionStartQuat = this.camera.quaternion.clone();
    this._transitionDuration = transitionDuration;
    
    this.controls.enabled = false;
    
    // Disable OrbitControls zoom so our FOV zoom works
    if (this.controls) this.controls.enableZoom = false;

    // Ensure space earth is visible during dive
    if (this.earth) this.earth.visible = true;
    if (this._atmosphere) this._atmosphere.visible = true;

    // Hide surface elements until near the end of transition
    if (this.virtualHorizon) this.virtualHorizon.visible = false;
    if (this._groundDisc) this._groundDisc.visible = false;
    if (this._horizonHaze) this._horizonHaze.visible = false;
    if (this.skyDome) this.skyDome.visible = false;

    // Immediate first update to compute surfacePos and upDir
    this._updatePlanetariumMode();
  }

  _updatePlanetariumMode() {
    if (this.planetariumLat === undefined || this.planetariumLon === undefined) return;

    // Align Earth using Greenwich Mean Sidereal Time (GMST) to ensure exact celestial alignment
    const gmstHours = calculateLST(this.simulationTime);
    // 24 hours = 2 * PI radians. Negative because Earth rotates East (which in our coordinate system is -Y rotation if we look from North)
    const currentEarthRotY = -(gmstHours / 24.0) * Math.PI * 2;
    if (this.earth) this.earth.rotation.y = currentEarthRotY;

    // Calculate surface point dynamically as Earth rotates
    const R = 4.05; 
    const rotDeg = currentEarthRotY * (180 / Math.PI);
    const finalLon = this.planetariumLon + rotDeg;

    const phi = (90 - this.planetariumLat) * (Math.PI / 180);
    const theta = (finalLon + 180) * (Math.PI / 180);
    const x = -(R * Math.sin(phi) * Math.cos(theta));
    const z = (R * Math.sin(phi) * Math.sin(theta));
    const y = R * Math.cos(phi);

    // Surface pos relative to Earth's heliocentric position
    const localPos = new THREE.Vector3(x, y, z);
    const surfacePos = localPos.clone();
    if (this.earth) surfacePos.add(this.earth.position);
    
    const upDir = localPos.normalize();
    this._lastUpDir = upDir.clone();

    if (!this._isTransitioning) {
      // Shift camera slightly above ground
      this.camera.position.copy(surfacePos).add(upDir.clone().multiplyScalar(0.05));
      this.camera.up.copy(upDir);

      // Shift OrbitControls target with the Earth so camera stays looking at same local direction
      if (this._lastEarthRotY !== undefined) {
        const deltaRotY = currentEarthRotY - this._lastEarthRotY;
        const targetRel = this.controls.target.clone().sub(this.earth ? this.earth.position : new THREE.Vector3());
        targetRel.applyAxisAngle(new THREE.Vector3(0, 1, 0), deltaRotY);
        this.controls.target.copy(targetRel).add(this.earth ? this.earth.position : new THREE.Vector3());
      }
      this._lastEarthRotY = currentEarthRotY;
      
      this.camera.lookAt(this.controls.target);
    }
    
    this._lastSurfacePos.copy(surfacePos);

    // Update Virtual Horizon
    if (this.virtualHorizon) {
      this.virtualHorizon.position.copy(surfacePos);
      const defaultAxis = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(defaultAxis, upDir);
      this.virtualHorizon.quaternion.copy(quat);
    }

    if (this._groundDisc) {
      this._groundDisc.position.copy(surfacePos);
      const targetLook = surfacePos.clone().add(upDir);
      this._groundDisc.lookAt(targetLook);
    }

    if (this._horizonHaze) {
      this._horizonHaze.position.copy(surfacePos);
      const defaultAxis = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(defaultAxis, upDir);
      this._horizonHaze.quaternion.copy(quat);
    }

    if (this.skyDome) {
      // Sky dome is in skyGroup so it doesn't need position update if skyGroup is centered,
      // but if we are moving the camera, we should just let the shader handle the rest.
      // We already update uCameraPos in startRenderLoop.
    }

    // North, East directions on tangent plane
    const Y_axis = new THREE.Vector3(0, 1, 0);
    this._northDir = Y_axis.clone().sub(upDir.clone().multiplyScalar(Y_axis.dot(upDir))).normalize();
    if (this._northDir.lengthSq() < 0.001) {
      const Z_axis = new THREE.Vector3(0, 0, 1);
      this._northDir.copy(Z_axis).sub(upDir.clone().multiplyScalar(Z_axis.dot(upDir))).normalize();
    }
    this._eastDir = new THREE.Vector3().crossVectors(upDir, this._northDir).normalize();

  }

  _addResizeListener() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      if (this.composer) this.composer.setSize(w, h);
    });

    const closeBtn = document.getElementById('celestial-info-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const panel = document.getElementById('celestial-info-panel');
        if (panel) panel.classList.remove('visible');
        this.clearSelection();
      });
    }
    
    // ── Click to Select Celestial Objects in Earth View ──
    let isDragging = false;
    this.renderer.domElement.addEventListener('pointerdown', () => isDragging = false);
    this.renderer.domElement.addEventListener('pointermove', () => isDragging = true);
    
    // Double-click to instantly fly to a star or planet
    this.renderer.domElement.addEventListener('dblclick', (e) => {
      if (this.missionSimulator && this.missionSimulator.active) return;
      if (!this.isPlanetariumMode && !this.isFlyMode) return;
      if (this._active3DStar) return; // Block background star clicks when viewing a star!

      this.mouse = this.mouse || new THREE.Vector2();
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (!this.raycaster) this.raycaster = new THREE.Raycaster();
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check Planets First
      let intersects = [];
      if (this.planetMeshes) {
        const meshes = this.planetMeshes.map(pm => pm.mesh);
        intersects = this.raycaster.intersectObjects(meshes);
      }

      let hitObject = null;
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        hitObject = this.planetMeshes.find(pm => pm.mesh === hitMesh);
      }

      // Check Stars if no planet hit
      if (!hitObject && this.pointsMesh && this.pointsMesh.visible) {
        this.raycaster.params.Points.threshold = 15.0; // easy to click
        const starIntersects = this.raycaster.intersectObject(this.pointsMesh);
        if (starIntersects.length > 0) {
          const idx = starIntersects[0].index;
          hitObject = {
            isStar: true,
            data: this.pointsMesh.geometry.attributes.starDataArray.array.slice(idx * 4, idx * 4 + 4),
            position: starIntersects[0].point.clone()
          };
        }
      }

      if (hitObject) {
        // If it's a star, trigger the full travel sequence so it renders the 3D star surface
        if (hitObject.isStar) {
          // Add required id property for viewStar3D
          hitObject.data.id = hitObject.data[0];
          this.travelToStarSequence(hitObject.data);
        } else {
          this.flyTo(hitObject, 3500);
        }
      }
    });

    this.renderer.domElement.addEventListener('pointerup', (e) => {
      if (isDragging) return; // Ignore if it was a pan drag
      if (this.missionSimulator && this.missionSimulator.active) return; // Block clicks during Chandrayaan mission
      if (!this.isPlanetariumMode && !this.isFlyMode) return;
      if (this._active3DStar) return; // Block background star clicks when viewing a star!

      this.mouse = this.mouse || new THREE.Vector2();
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (!this.raycaster) this.raycaster = new THREE.Raycaster();
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check Planets First
      let intersects = [];
      if (this.planetMeshes) {
        const meshes = this.planetMeshes.map(pm => pm.mesh);
        intersects = this.raycaster.intersectObjects(meshes);
      }

      let hitObject = null;
      let targetPos = null;
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        hitObject = this.planetMeshes.find(pm => pm.mesh === hitMesh);
        if (hitObject) {
          targetPos = hitObject.mesh.position.clone();
        }
      }

      // Check Stars if no planet hit and stars are visible
      if (!hitObject && this.pointsMesh && this.pointsMesh.visible) {
        // Adjust raycaster threshold for points to make them very easy to click
        this.raycaster.params.Points.threshold = 12.0;
        const starIntersects = this.raycaster.intersectObject(this.pointsMesh);
        if (starIntersects.length > 0) {
          const idx = starIntersects[0].index;
          hitObject = {
            isStar: true,
            data: this.pointsMesh.geometry.attributes.starDataArray.array.slice(idx * 4, idx * 4 + 4)
          };
          targetPos = starIntersects[0].point.clone();
        }
      }

      if (hitObject && targetPos && this.isPlanetariumMode) {
        const currentDist = this.camera.position.distanceTo(this.controls.target);
        const dir = targetPos.clone().sub(this.camera.position).normalize();
        this._targetPanGoal = this.camera.position.clone().add(dir.multiplyScalar(currentDist));
      }

      // Check User Items First!
      if (this._activeUserItemsGroup) {
        const itemIntersects = this.raycaster.intersectObject(this._activeUserItemsGroup, true);
        if (itemIntersects.length > 0) {
          const hitItem = itemIntersects[0].object;
          if (hitItem.userData && hitItem.userData.isUserItem) {
            window.dispatchEvent(new CustomEvent('mystar-item-click', { detail: hitItem.userData }));
            return; // don't open the standard panel
          }
        }
      }

      const panel = document.getElementById('celestial-info-panel');
      if (hitObject && panel) {
        panel.classList.add('visible');
        
        let distText = '';
        if (hitObject.isStar) {
          document.getElementById('celestial-info-name').textContent = 'Unknown Star'; 
          document.getElementById('celestial-info-type').textContent = 'Star';
          
          const mag = hitObject.data[3];
          document.getElementById('celestial-info-mag').textContent = mag.toFixed(2);
          document.getElementById('celestial-info-dist').textContent = 'Unknown';
        } else {
          document.getElementById('celestial-info-name').textContent = hitObject.data.name || hitObject.data.id;
          document.getElementById('celestial-info-type').textContent = hitObject.data.type || 'Planet';
          
          const dist = this.camera.position.distanceTo(hitObject.mesh.position);
          const distAu = dist / 93924.2;
          distText = distAu < 0.1 
            ? `${(distAu * 149597870.7).toFixed(0)} km` 
            : `${distAu.toFixed(2)} AU`;
          document.getElementById('celestial-info-dist').textContent = distText;
          document.getElementById('celestial-info-mag').textContent = 'N/A';
        }
      } else if (panel) {
        panel.classList.remove('visible');
        this.clearSelection();
      }
    });
  }

  dispose() {
    this.stopRenderLoop();
    this.renderer.dispose();
  }
}

// Easing function
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
