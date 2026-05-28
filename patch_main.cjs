const fs = require('fs');

let code = fs.readFileSync('src/main.js', 'utf-8');

code = code.replace(
`import './style.css';
import { loadStarCatalog } from './StarData.js';
import { StarRenderer }    from './StarRenderer.js';
import { Interaction }     from './Interaction.js';
import { Constellations }  from './Constellations.js';
import { UI }              from './UI.js';`,
`import './style.css';
import { loadStarCatalog } from './StarData.js';
import { StarRenderer }    from './StarRenderer.js';
import { Interaction }     from './Interaction.js';
import { Constellations }  from './Constellations.js';
import { UI }              from './UI.js';
import { getPlanetsData, calculateLST } from './PlanetData.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';`
);

code = code.replace(
`  const stars = await loadStarCatalog(5000);`,
`  const stars = await loadStarCatalog(5000);
  const planets = getPlanetsData(new Date());`
);

code = code.replace(
`  renderer.init();
  renderer.buildStars(stars);`,
`  renderer.init();
  renderer.buildStars(stars);
  renderer.addPlanets(planets);
  document.body.appendChild(VRButton.createButton(renderer.renderer));`
);

code = code.replace(
`  const interaction = new Interaction(
    renderer.renderer,
    renderer.camera,
    stars,
    renderer.pointsMesh,
    renderer.earth
  );`,
`  const interaction = new Interaction(
    renderer.renderer,
    renderer.camera,
    stars,
    renderer.pointsMesh,
    renderer.earth,
    renderer.planetMeshes
  );`
);

code = code.replace(
`  // Auto-rotate toggle
  ui.onAutoRotate = (enabled) => renderer.setAutoRotate(enabled);`,
`  // Auto-rotate toggle
  ui.onAutoRotate = (enabled) => renderer.setAutoRotate(enabled);

  // Sync Location
  const btnLoc = document.getElementById('btn-location');
  if (btnLoc) {
    btnLoc.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const lst = calculateLST(new Date(), lon);
          renderer.updateSkyRotation(lst, lat);
          renderer.setAutoRotate(false);
          ui.$btnAutoRot.classList.remove('active');
          btnLoc.classList.add('active');
          // Need to update constellation lines ? It rotates with skyGroup so it's fine
        }, (err) => {
          console.error(err);
          alert('Could not fetch location.');
        });
      } else {
        alert('Geolocation is not supported by this browser.');
      }
    });
  }`
);

fs.writeFileSync('src/main.js', code, 'utf-8');
console.log('main.js patched');
