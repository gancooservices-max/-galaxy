const fs = require('fs');

// 1. Patch PlanetData.js
let planetCode = fs.readFileSync('src/PlanetData.js', 'utf-8');

planetCode = planetCode.replace(
  /export const PLANETS = \[[\s\S]*?\];/,
`export const PLANETS = [
  { id: 'Sun', body: Body.Sun, texture: '/textures/sun.png', color: '#ffcc00', size: 437.2, mag: -26.7, desc: "The star around which the Earth orbits." },
  { id: 'Moon', body: Body.Moon, texture: '/textures/moon.png', color: '#dddddd', size: 1.09, mag: -12.7, desc: "Earth's only natural satellite." },
  { id: 'Mars', body: Body.Mars, texture: '/textures/mars.png', color: '#ff4400', size: 2.13, mag: 0.5, desc: "The Red Planet." },
  { id: 'Jupiter', body: Body.Jupiter, texture: '/textures/jupiter.png', color: '#ffaa66', size: 43.89, mag: -2.0, desc: "The largest planet in our solar system." }
];`
);

planetCode = planetCode.replace(
  `const pos = raDecToCartesian(raDeg, decDeg, 470);`,
  `// True scale: 1 AU = 93924.2 ThreeJS units
    const distUnits = equ.vec.Length() * 93924.2;
    const pos = raDecToCartesian(raDeg, decDeg, distUnits);`
);

fs.writeFileSync('src/PlanetData.js', planetCode, 'utf-8');

// 2. Patch StarData.js
let starCode = fs.readFileSync('src/StarData.js', 'utf-8');

starCode = starCode.replace(
  `const pos = raDecToCartesian(star.ra, star.dec, 480);`,
  `const pos = raDecToCartesian(star.ra, star.dec, 4000000);`
);

fs.writeFileSync('src/StarData.js', starCode, 'utf-8');

// 3. Patch StarRenderer.js
let renCode = fs.readFileSync('src/StarRenderer.js', 'utf-8');

renCode = renCode.replace(
  `this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 2000);`,
  `this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 10000000);`
);

renCode = renCode.replace(
  `powerPreference: 'high-performance',`,
  `powerPreference: 'high-performance',\n      logarithmicDepthBuffer: true,`
);

renCode = renCode.replace(
  `const bgGeo = new THREE.SphereGeometry(990, 32, 32);`,
  `const bgGeo = new THREE.SphereGeometry(5000000, 32, 32);`
);

renCode = renCode.replace(
  `const layers = [
      { count: 20000, spread: 0.22, radius: 490, opacity: 0.18, size: 0.8 },
      { count: 8000,  spread: 0.10, radius: 488, opacity: 0.30, size: 1.2 },
      { count: 3000,  spread: 0.06, radius: 486, opacity: 0.15, size: 2.0 },
    ];`,
  `const layers = [
      { count: 20000, spread: 0.22, radius: 4200000, opacity: 0.18, size: 0.8 },
      { count: 8000,  spread: 0.10, radius: 4100000, opacity: 0.30, size: 1.2 },
      { count: 3000,  spread: 0.06, radius: 4050000, opacity: 0.15, size: 2.0 },
    ];`
);

renCode = renCode.replace(
  `const r = layer.radius + (Math.random() - 0.5) * 10;`,
  `const r = layer.radius + (Math.random() - 0.5) * 10000;`
);

renCode = renCode.replace(
  `const r     = 400 + Math.random() * 180;`,
  `const r     = 3000000 + Math.random() * 1000000;`
);

renCode = renCode.replace(
  `mesh.position.set(
        (Math.random() - 0.5) * 900,
        (Math.random() - 0.5) * 700,
        (Math.random() - 0.5) * 900,
      );`,
  `mesh.position.set(
        (Math.random() - 0.5) * 8000000,
        (Math.random() - 0.5) * 6000000,
        (Math.random() - 0.5) * 8000000,
      );`
);
renCode = renCode.replace(
  `const size = 30 + Math.random() * 80;`,
  `const size = 300000 + Math.random() * 800000;`
);

renCode = renCode.replace(
  `float attenuation = clamp(300.0 / dist, 0.5, 12.0);`,
  `float attenuation = clamp(4000000.0 / dist, 0.5, 12.0);`
);

renCode = renCode.replace(
  `const pointLight = new THREE.PointLight(0xffffff, 3.5, 3000);`,
  `const pointLight = new THREE.PointLight(0xffffff, 3.5, 0); // infinite range`
);

// Fix flyTo Origin end target distance (we want to see Earth, so z=30 is fine)
// But controls maxDistance was 550, now the user needs to zoom much more to see Sun.
renCode = renCode.replace(
  `this.controls.maxDistance      = 550;`,
  `this.controls.maxDistance      = 5000000;`
);

fs.writeFileSync('src/StarRenderer.js', renCode, 'utf-8');

console.log('Scaling patched successfully.');
