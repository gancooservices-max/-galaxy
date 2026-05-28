const fs = require('fs');

let code = fs.readFileSync('src/Interaction.js', 'utf-8');

// Replace constructor
code = code.replace(
`  constructor(renderer, camera, stars, pointsMesh, earthMesh) {
    this.renderer  = renderer;
    this.camera    = camera;
    this.stars     = stars;
    this.points    = pointsMesh;
    this.earth     = earthMesh;`,
`  constructor(renderer, camera, stars, pointsMesh, earthMesh, planetMeshes) {
    this.renderer  = renderer;
    this.camera    = camera;
    this.stars     = stars;
    this.points    = pointsMesh;
    this.earth     = earthMesh;
    this.planetMeshes = planetMeshes || [];`
);

// Replace _raycast()
code = code.replace(
`  _raycast() {
    if (!this.points) return null;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObject(this.points);
    if (hits.length === 0) return null;

    // Find the closest hit among all intersections
    let bestIdx = null;
    let bestDist = Infinity;
    for (const hit of hits) {
      if (hit.index !== undefined && hit.distanceToRay < bestDist) {
        bestDist = hit.distanceToRay ?? 0;
        bestIdx  = hit.index;
      }
    }
    return bestIdx;
  }`,
`  _raycast() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Check planets first
    if (this.planetMeshes && this.planetMeshes.length > 0) {
        const meshes = this.planetMeshes.map(pm => pm.mesh);
        const planetHits = this.raycaster.intersectObjects(meshes);
        if (planetHits.length > 0) {
            // Find which planet
            const hitMesh = planetHits[0].object;
            const pm = this.planetMeshes.find(p => p.mesh === hitMesh);
            if (pm) return { type: 'planet', data: pm.data };
        }
    }

    if (!this.points) return null;
    const hits = this.raycaster.intersectObject(this.points);
    if (hits.length === 0) return null;

    let bestIdx = null;
    let bestDist = Infinity;
    for (const hit of hits) {
      if (hit.index !== undefined && hit.distanceToRay < bestDist) {
        bestDist = hit.distanceToRay ?? 0;
        bestIdx  = hit.index;
      }
    }
    return bestIdx !== null ? { type: 'star', index: bestIdx } : null;
  }`
);

// Update _onMouseMove
code = code.replace(
`  _onMouseMove(e) {
    const { x, y, clientX, clientY } = this._normalizeEvent(e);
    this.mouse.set(x, y);

    const hit = this._raycast();
    if (hit !== null && hit !== this.hoveredIdx) {
      this.hoveredIdx = hit;
      if (this.onHover) this.onHover(this.stars[hit], clientX, clientY);
    } else if (hit === null && this.hoveredIdx !== -1) {
      this.hoveredIdx = -1;
      if (this.onHover) this.onHover(null, clientX, clientY);
    }
  }`,
`  _onMouseMove(e) {
    const { x, y, clientX, clientY } = this._normalizeEvent(e);
    this.mouse.set(x, y);

    const hit = this._raycast();
    const hitId = hit ? (hit.type === 'planet' ? hit.data.id : hit.index) : -1;
    
    if (hit !== null && hitId !== this.hoveredIdx) {
      this.hoveredIdx = hitId;
      const objData = hit.type === 'planet' ? hit.data : this.stars[hit.index];
      if (this.onHover) this.onHover(objData, clientX, clientY);
    } else if (hit === null && this.hoveredIdx !== -1) {
      this.hoveredIdx = -1;
      if (this.onHover) this.onHover(null, clientX, clientY);
    }
  }`
);

// Update _onClick
code = code.replace(
`    const hit = this._raycast();
    if (hit !== null && this.onClick) {
      this.onClick(this.stars[hit]);
    }`,
`    const hit = this._raycast();
    if (hit !== null && this.onClick) {
      const objData = hit.type === 'planet' ? hit.data : this.stars[hit.index];
      this.onClick(objData);
    }`
);

// Update _onTouchStart
code = code.replace(
`    const hit = this._raycast();
    if (hit !== null && this.onClick) {
      this.onClick(this.stars[hit]);
    }`,
`    const hit = this._raycast();
    if (hit !== null && this.onClick) {
      const objData = hit.type === 'planet' ? hit.data : this.stars[hit.index];
      this.onClick(objData);
    }`
);

// Update updateStars
code = code.replace(
`  updateStars(stars) {
    this.stars = stars;
  }`,
`  updateStars(stars) {
    this.stars = stars;
  }
  
  updatePlanets(planetMeshes) {
    this.planetMeshes = planetMeshes;
  }`
);

fs.writeFileSync('src/Interaction.js', code, 'utf-8');
console.log('Interaction.js patched');
