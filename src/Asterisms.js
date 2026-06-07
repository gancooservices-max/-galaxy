/**
 * Asterisms.js
 * Renders famous asterisms like the Summer Triangle and Winter Hexagon.
 * Features thick glowing lines and prominent labels.
 */

import * as THREE from 'three';

export const ASTERISM_DATA = [
  {
    name: 'Summer Triangle',
    color: '#ffcc55', // Glowing yellowish-orange
    lines: [[4, 11], [11, 20], [20, 4]], // Vega, Altair, Deneb
    labels: [
      { name: 'Vega', starIndex: 4 },
      { name: 'Altair', starIndex: 11 },
      { name: 'Deneb', starIndex: 20 },
    ]
  },
  {
    name: 'Winter Hexagon',
    color: '#aaddff', // Glowing icy blue
    lines: [
      [0, 7], [7, 17], [17, 5], [5, 13], [13, 6], [6, 0], // Sirius, Procyon, Pollux, Capella, Aldebaran, Rigel
      [0, 9], [7, 9] // Winter Triangle (Sirius, Procyon, Betelgeuse)
    ],
    labels: [
      { name: 'Sirius', starIndex: 0 },
      { name: 'Procyon', starIndex: 7 },
      { name: 'Pollux', starIndex: 17 },
      { name: 'Capella', starIndex: 5 },
      { name: 'Aldebaran', starIndex: 13 },
      { name: 'Rigel', starIndex: 6 },
      { name: 'Betelgeuse', starIndex: 9 },
    ]
  }
];

export class Asterisms {
  constructor(skyGroup, stars) {
    this.skyGroup = skyGroup;
    this.stars = stars;
    this.linesMeshes = [];
    this.dotsMeshes = [];
    this.labelSprites = [];
    this.visible = false;
  }

  build() {
    // The ASTERISM_DATA uses indices based on star brightness rank
    const sortedStars = [...this.stars].sort((a, b) => a.mag - b.mag);

    for (const asterism of ASTERISM_DATA) {
      const allPositions = [];
      const usedPositions = [];

      for (const [a, b] of asterism.lines) {
        const starA = sortedStars[a];
        const starB = sortedStars[b];
        if (!starA || !starB) continue;

        const p1 = new THREE.Vector3(starA.position.x, starA.position.y, starA.position.z).normalize().multiplyScalar(4040000); // Slightly below constellations
        const p2 = new THREE.Vector3(starB.position.x, starB.position.y, starB.position.z).normalize().multiplyScalar(4040000);

        allPositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        usedPositions.push(p1, p2);
      }

      if (usedPositions.length > 0) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3));
        
        // Use a thick glowing line effect (AdditiveBlending)
        const lineMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(asterism.color),
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          linewidth: 2 // Might fall back to 1 on some browsers, but bloom helps
        });
        
        const linesMesh = new THREE.LineSegments(geo, lineMat);
        linesMesh.visible = this.visible;
        this.skyGroup.add(linesMesh);
        this.linesMeshes.push(linesMesh);

        // Add dots at the vertices for a thicker look
        const dotTex = this._createDotTexture(asterism.color);
        const dotMat = new THREE.PointsMaterial({
          color: new THREE.Color(asterism.color),
          size: 24, // Bigger than constellation dots
          sizeAttenuation: false,
          map: dotTex,
          transparent: true,
          opacity: 1.0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const dotsMesh = new THREE.Points(geo, dotMat);
        dotsMesh.visible = this.visible;
        this.skyGroup.add(dotsMesh);
        this.dotsMeshes.push(dotsMesh);

        // Create Asterism Name Label
        const center = new THREE.Vector3();
        usedPositions.forEach(p => center.add(p));
        center.divideScalar(usedPositions.length);
        center.normalize().multiplyScalar(4040000);
        
        const mainLabel = this._makeLabel(asterism.name, asterism.color, 36, true);
        mainLabel.position.copy(center);
        mainLabel.visible = this.visible;
        this.skyGroup.add(mainLabel);
        this.labelSprites.push(mainLabel);

        // Create individual star labels
        if (asterism.labels) {
          asterism.labels.forEach(lbl => {
            const star = sortedStars[lbl.starIndex];
            if (star) {
              const starPos = new THREE.Vector3(star.position.x, star.position.y, star.position.z).normalize().multiplyScalar(4040000);
              const starLabel = this._makeLabel(lbl.name, '#ffffff', 22, false);
              
              // Offset slightly so it doesn't overlap the star dot
              const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(this.skyGroup.quaternion).normalize();
              const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(this.skyGroup.quaternion).normalize();
              starPos.add(rightDir.multiplyScalar(20000)).add(upDir.multiplyScalar(20000));

              starLabel.position.copy(starPos);
              starLabel.visible = this.visible;
              this.skyGroup.add(starLabel);
              this.labelSprites.push(starLabel);
            }
          });
        }
      }
    }
  }

  _createDotTexture(colorStr) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, colorStr);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(canvas);
  }

  _makeLabel(text, color, fontSize, isBold) {
    const canvas = document.createElement('canvas');
    canvas.width  = 512;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 80);
    const weight = isBold ? 'bold ' : '';
    ctx.font = `${weight}${fontSize}px "Inter", "Arial", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for legibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = color;
    ctx.fillText(text, 256, 40);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    // Keep consistent apparent size across distances
    const scale = 200000;
    sprite.scale.set(scale, scale * (80/512), 1);
    return sprite;
  }

  show() {
    this.visible = true;
    this.linesMeshes.forEach(m => m.visible = true);
    this.dotsMeshes.forEach(m => m.visible = true);
    this.labelSprites.forEach(m => m.visible = true);
  }

  hide() {
    this.visible = false;
    this.linesMeshes.forEach(m => m.visible = false);
    this.dotsMeshes.forEach(m => m.visible = false);
    this.labelSprites.forEach(m => m.visible = false);
  }

  updateHorizonClip(camera, upDir, isPlanetarium) {
    this.labelSprites.forEach(sprite => {
      if (!this.visible) return;
      if (!isPlanetarium) {
        sprite.material.opacity = 0.9;
        return;
      }
      
      const worldPos = new THREE.Vector3();
      sprite.getWorldPosition(worldPos);
      
      const dir = worldPos.clone().sub(camera.position).normalize();
      const alt = dir.dot(upDir);
      
      if (alt < -0.02) {
        sprite.material.opacity = 0;
      } else {
        sprite.material.opacity = 0.9 * smoothstep(-0.02, 0.05, alt);
      }
    });
  }
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
