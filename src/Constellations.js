/**
 * Constellations.js
 * Renders IAU constellation line art as Three.js LineSegments.
 * Stellarium-style: green lines, faint constellation labels.
 * Lines are in skyGroup so they rotate correctly with the celestial sphere.
 */

import * as THREE from 'three';

// Full 88 IAU constellation definitions using named star pairs
// Each line connects two stars by their HYG catalog IDs
const CONSTELLATION_DATA = [
  {
    name: 'Orion', abbr: 'ORI',
    lines: [[26,29],[29,30],[30,7],[7,74],[74,10],[10,26],[29,74],[26,74],[10,30]],
  },
  {
    name: 'Ursa Major', abbr: 'UMA',
    lines: [[32,84],[84,85],[85,86],[86,87],[87,31],[31,38],[38,86]],
  },
  {
    name: 'Cassiopeia', abbr: 'CAS',
    lines: [[67,151],[151,69],[69,152],[152,77]],
  },
  {
    name: 'Leo', abbr: 'LEO',
    lines: [[21,72],[72,49],[49,134],[134,21],[21,133],[133,49]],
  },
  {
    name: 'Scorpius', abbr: 'SCO',
    lines: [[171,172],[172,16],[16,174],[174,175],[175,25],[25,176],[176,177]],
  },
  {
    name: 'Cygnus', abbr: 'CYG',
    lines: [[20,195],[195,194],[20,197],[197,196],[20,193]],
  },
  {
    name: 'Lyra', abbr: 'LYR',
    lines: [[5,98],[98,99],[99,5],[98,5]],
  },
  {
    name: 'Aquila', abbr: 'AQL',
    lines: [[12,100],[12,101],[101,102]],
  },
  {
    name: 'Gemini', abbr: 'GEM',
    lines: [[17,39],[39,23],[23,27],[17,40],[40,41],[41,27],[17,23]],
  },
  {
    name: 'Taurus', abbr: 'TAU',
    lines: [[13,27],[27,42],[42,43],[13,44],[44,45]],
  },
  {
    name: 'Perseus', abbr: 'PER',
    lines: [[33,154],[154,155],[33,156],[156,157]],
  },
  {
    name: 'Virgo', abbr: 'VIR',
    lines: [[15,133],[133,134],[15,135],[135,136]],
  },
  {
    name: 'Pegasus', abbr: 'PEG',
    lines: [[204,210],[210,209],[209,211],[211,204],[204,212]],
  },
  {
    name: 'Sagittarius', abbr: 'SGR',
    lines: [[36,179],[179,180],[180,181],[181,182],[182,183],[36,184]],
  },
  {
    name: 'Draco', abbr: 'DRA',
    lines: [[92,91],[91,95],[95,96],[96,97],[97,92]],
  },
  {
    name: 'Corona Borealis', abbr: 'CRB',
    lines: [[170,168],[168,169],[169,167],[167,166]],
  },
  {
    name: 'Boötes', abbr: 'BOO',
    lines: [[4,103],[103,104],[104,105],[105,4],[4,106]],
  },
  {
    name: 'Crux', abbr: 'CRU',
    lines: [[14,19],[24,18]],
  },
  {
    name: 'Centaurus', abbr: 'CEN',
    lines: [[3,11],[11,52],[52,53],[53,3]],
  },
  {
    name: 'Canis Major', abbr: 'CMA',
    lines: [[1,22],[22,73],[73,125],[1,126],[126,127]],
  },
  {
    name: 'Canis Minor', abbr: 'CMI',
    lines: [[8,128]],
  },
  {
    name: 'Aries', abbr: 'ARI',
    lines: [[35,160],[160,161]],
  },
  {
    name: 'Aquarius', abbr: 'AQR',
    lines: [[50,200],[200,201],[201,202],[202,203]],
  },
  {
    name: 'Capricornus', abbr: 'CAP',
    lines: [[190,191],[191,192],[192,193],[193,190]],
  },
  {
    name: 'Pisces', abbr: 'PSC',
    lines: [[214,215],[215,216],[216,217]],
  },
  {
    name: 'Ursa Minor', abbr: 'UMI',
    lines: [[2,218],[218,219],[219,220],[220,221],[221,222],[222,2]],
  },
  {
    name: 'Hercules', abbr: 'HER',
    lines: [[6,145],[145,146],[146,147],[147,6],[6,148],[148,149]],
  },
  {
    name: 'Auriga', abbr: 'AUR',
    lines: [[9,27],[27,162],[162,163],[163,9],[9,164]],
  },
  {
    name: 'Andromeda', abbr: 'AND',
    lines: [[211,205],[205,206],[206,207]],
  },
  {
    name: 'Ophiuchus', abbr: 'OPH',
    lines: [[55,185],[185,186],[186,187],[187,188],[188,55]],
  },
];

export class Constellations {
  constructor(skyGroup, stars) {
    this.skyGroup = skyGroup;
    this.stars    = stars;
    this.linesMesh = null;
    this.labelSprites = [];
    this.visible  = true;
    // Build star index by id
    this._starById = {};
    stars.forEach(s => { this._starById[s.id] = s; });
  }

  build() {
    this._buildLines();
    this._buildLabels();
  }

  _buildLines() {
    const allPositions = [];
    const labelData = [];

    for (const constellation of CONSTELLATION_DATA) {
      const usedPositions = [];

      for (const [a, b] of constellation.lines) {
        const starA = this._starById[a];
        const starB = this._starById[b];
        if (!starA || !starB) continue;

        const pa = starA.position;
        const pb = starB.position;
        allPositions.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
        usedPositions.push(pa, pb);
      }

      if (usedPositions.length > 0) {
        const center = new THREE.Vector3();
        usedPositions.forEach(p => center.add(new THREE.Vector3(p.x, p.y, p.z)));
        center.divideScalar(usedPositions.length);
        // Push outward to sit just above the sky sphere surface
        center.normalize().multiplyScalar(4050000);
        labelData.push({ name: constellation.name, pos: center });
      }
    }

    if (allPositions.length === 0) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3));
    const mat = new THREE.LineBasicMaterial({
      color:       0x1e7a42,   // Stellarium green
      transparent: true,
      opacity:     0.65,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    });
    this.linesMesh = new THREE.LineSegments(geo, mat);
    this.linesMesh.visible = this.visible;
    this.skyGroup.add(this.linesMesh);

    // Build 3D sprite labels inside skyGroup so they follow the sky
    for (const { name, pos } of labelData) {
      const sprite = this._makeLabel(name);
      sprite.position.copy(pos);
      sprite.visible = this.visible;
      this.skyGroup.add(sprite);
      this.labelSprites.push(sprite);
    }
  }

  _buildLabels() {
    // Labels are built inside _buildLines via sprites already
  }

  _makeLabel(text) {
    const canvas = document.createElement('canvas');
    canvas.width  = 512;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 80);
    ctx.font = 'bold 26px "Inter", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Letter-spaced constellation name in Stellarium style
    const spaced = text.toUpperCase().split('').join(' ');
    
    // Glow pass
    ctx.shadowColor = 'rgba(30, 122, 66, 0.9)';
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = 'rgba(30, 180, 90, 0.85)';
    ctx.fillText(spaced, 256, 40);
    
    // Crisp pass
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = 'rgba(80, 220, 120, 0.80)';
    ctx.fillText(spaced, 256, 40);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map:         tex,
      transparent: true,
      opacity:     0.80,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(mat);
    // Scale so it appears large but not overbearing
    sprite.scale.set(180000, 28000, 1);
    return sprite;
  }

  // Update visibility of constellation labels based on horizon
  updateHorizonClip(camera, upDir, isPlanetariumMode) {
    if (!this.linesMesh) return;
    // The lines themselves are clipped implicitly as the sky rotates —
    // we only need to hide label sprites that are below the local horizon
    if (!isPlanetariumMode) return;
    this.labelSprites.forEach(sprite => {
      const dir = sprite.position.clone().normalize();
      // Since skyGroup may be rotated, get world position
      const worldPos = new THREE.Vector3();
      sprite.getWorldPosition(worldPos);
      const toSprite = worldPos.clone().sub(camera.position).normalize();
      const alt = toSprite.dot(upDir);
      sprite.visible = this.visible && alt > -0.02;
    });
  }

  show() {
    this.visible = true;
    if (this.linesMesh) this.linesMesh.visible = true;
    this.labelSprites.forEach(l => l.visible = true);
  }

  hide() {
    this.visible = false;
    if (this.linesMesh) this.linesMesh.visible = false;
    this.labelSprites.forEach(l => l.visible = false);
  }

  toggle() {
    this.visible ? this.hide() : this.show();
    return this.visible;
  }

  dispose() {
    if (this.linesMesh) {
      this.skyGroup.remove(this.linesMesh);
      this.linesMesh.geometry.dispose();
      this.linesMesh.material.dispose();
    }
    this.labelSprites.forEach(s => {
      this.skyGroup.remove(s);
      s.material.map?.dispose();
      s.material.dispose();
    });
  }
}
