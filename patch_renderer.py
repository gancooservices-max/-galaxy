import sys
import re

with open('src/StarRenderer.js', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
"""  constructor(container) {
    this.container = container;
    this.stars     = [];
    this.scene     = null;""",
"""  constructor(container) {
    this.container = container;
    this.stars     = [];
    this.planets   = [];
    this.scene     = null;
    this.skyGroup  = null;"""
)

code = code.replace(
"""  init() {
    this._createScene();
    this._createCamera();
    this._createRenderer();
    this._createControls();
    this._createMilkyWay();
    this._createNebulae();
    this._createShootingStars();
    this._createSun();
    this._createEarthMoon();
    this._addResizeListener();
    return this;
  }""",
"""  init() {
    this._createScene();
    this.skyGroup = new THREE.Group();
    this.scene.add(this.skyGroup);
    this._createCamera();
    this._createRenderer();
    this._createControls();
    this._createMilkyWay();
    this._createNebulae();
    this._createShootingStars();
    this._createEarth();
    this._addResizeListener();
    return this;
  }"""
)

code = code.replace("this.scene.add(points);", "this.skyGroup.add(points);")
code = code.replace("this.scene.add(new THREE.Points(dustGeo, dustMat));", "this.skyGroup.add(new THREE.Points(dustGeo, dustMat));")
code = code.replace("this.scene.add(mesh);", "this.skyGroup.add(mesh);")
code = code.replace("this.scene.add(this.pointsMesh);", "this.skyGroup.add(this.pointsMesh);")

code = code.replace(
"""    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;""",
"""    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.xr.enabled = true;"""
)

# Find _createSun() and _createEarthMoon()
match = re.search(r'  _createSun\(\) \{.*?(?=  flyToEarth\(\))', code, re.DOTALL)
if match:
    replacement = """  _createEarth() {
    const loader = new THREE.TextureLoader();

    // --- EARTH ---
    const earthGeo = new THREE.SphereGeometry(4, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({ shininess: 25 });
    this.earth = new THREE.Mesh(earthGeo, earthMat);
    this.earth.position.set(0, 0, 0); 

    loader.load('https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg', (tex) => {
      earthMat.map = tex;
      earthMat.needsUpdate = true;
    });
    loader.load('https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png', (tex) => {
      earthMat.bumpMap = tex;
      earthMat.bumpScale = 0.3;
      earthMat.needsUpdate = true;
    });

    this.scene.add(this.earth);

    // Atmosphere
    const atmosGeo = new THREE.SphereGeometry(4.3, 32, 32);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 1.5;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    this._atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    this._atmosphere.position.copy(this.earth.position);
    this.scene.add(this._atmosphere);

    // Light for Earth since we removed the distant Sun point light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(1, 0.5, 0).normalize();
    this.scene.add(sunLight);
  }

  addPlanets(planetsData) {
    this.planets = planetsData;
    const loader = new THREE.TextureLoader();
    this.planetMeshes = [];

    planetsData.forEach(p => {
      const { x, y, z } = p.position;
      const geo = new THREE.SphereGeometry(p.size, 64, 64);
      let mat;

      if (p.id === 'Sun') {
        mat = new THREE.MeshBasicMaterial();
        const glowGeo = new THREE.SphereGeometry(p.size * 1.5, 64, 64);
        const glowMat = new THREE.ShaderMaterial({
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
              float intensity = pow(0.55 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
              gl_FragColor = vec4(1.0, 0.8, 0.4, 1.0) * intensity * 2.0;
            }
          `,
          side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(x, y, z);
        this.skyGroup.add(glow);

        const pointLight = new THREE.PointLight(0xffffff, 3.5, 3000);
        pointLight.position.set(x, y, z);
        this.skyGroup.add(pointLight);
      } else {
        mat = new THREE.MeshPhongMaterial({ shininess: 5 });
      }

      loader.load(p.texture, (tex) => {
        mat.map = tex;
        mat.needsUpdate = true;
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.skyGroup.add(mesh);
      this.planetMeshes.push({ data: p, mesh });
    });
  }

  updateSkyRotation(lstDegrees, latitude) {
    if (this.skyGroup) {
      this.skyGroup.rotation.set(0, 0, 0);
      const latRad = latitude * Math.PI / 180;
      const lstRad = lstDegrees * Math.PI / 180;
      
      this.skyGroup.rotation.x = (Math.PI / 2) - latRad;
      this.skyGroup.rotation.y = lstRad;
    }
  }

"""
    code = code[:match.start()] + replacement + code[match.end():]

# One last replacement: Remove moon logic from render loop since we removed moon orbit
code = code.replace("""      // Orbit Moon around Earth
      if (this._moonOrbitGroup) {
        this._moonOrbitGroup.rotation.y += delta * 0.05;
        // Moon tidally locked
        if (this.moon) this.moon.rotation.y += delta * 0.05;
      }""", "")

with open('src/StarRenderer.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Patched StarRenderer.js successfully.")
