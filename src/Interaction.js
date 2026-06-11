/**
 * Interaction.js
 * Raycasting for star hover and click detection.
 */

import * as THREE from 'three';

export class Interaction {
  constructor(renderer, camera, stars, pointsMesh, earthMesh, planetMeshes, starRenderer) {
    this.renderer  = renderer;
    this.camera    = camera;
    this.stars     = stars;
    this.points    = pointsMesh;
    this.earth     = earthMesh;
    this.planetMeshes = planetMeshes || [];
    this.starRenderer = starRenderer;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 4.5;
    this.mouse     = new THREE.Vector2(-9999, -9999);
    this.hoveredIdx = -1;
    this.onHover   = null;  // callback(star | null, screenX, screenY)
    this.onClick   = null;  // callback(star)
    this.onEarthClick = null; // callback()
    this._bound    = {};
    this._canvas   = renderer.domElement;
  }

  enable() {
    this._bound.move     = this._onMouseMove.bind(this);
    this._bound.click    = this._onClick.bind(this);
    this._bound.dblclick = this._onDblClick.bind(this);
    this._bound.touch    = this._onTouchStart.bind(this);
    this._canvas.addEventListener('mousemove',  this._bound.move,  { passive: true });
    this._canvas.addEventListener('click',      this._bound.click);
    this._canvas.addEventListener('dblclick',   this._bound.dblclick);
    this._canvas.addEventListener('touchstart', this._bound.touch, { passive: true });
  }

  disable() {
    this._canvas.removeEventListener('mousemove',  this._bound.move);
    this._canvas.removeEventListener('click',      this._bound.click);
    this._canvas.removeEventListener('dblclick',   this._bound.dblclick);
    this._canvas.removeEventListener('touchstart', this._bound.touch);
  }

  _normalizeEvent(e) {
    const rect = this._canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width)  *  2 - 1,
      y: -((e.clientY - rect.top) / rect.height)  *  2 + 1,
      clientX: e.clientX,
      clientY: e.clientY,
    };
  }

  _onMouseMove(e) {
    if (this.starRenderer && this.starRenderer.missionSimulator && this.starRenderer.missionSimulator.active) return;
    const { x, y, clientX, clientY } = this._normalizeEvent(e);
    this.mouse.set(x, y);

    const hit = this._raycast();
    const hitId = hit ? (hit.type === 'planet' || hit.type === 'satellite' ? hit.data.id : (hit.type === 'userItem' ? 'item_' + hit.data.type + hit.data.index : hit.index)) : -1;
    
    if (hit !== null && hitId !== this.hoveredIdx) {
      this.hoveredIdx = hitId;
      const objData = (hit.type === 'planet' || hit.type === 'satellite' || hit.type === 'userItem') ? hit.data : this.stars[hit.index];
      if (this.onHover) this.onHover(objData, clientX, clientY);
    } else if (hit === null && this.hoveredIdx !== -1) {
      this.hoveredIdx = -1;
      if (this.onHover) this.onHover(null, clientX, clientY);
    }
  }

  _onClick(e) {
    if (this.starRenderer && this.starRenderer.missionSimulator && this.starRenderer.missionSimulator.active) return;
    const { x, y } = this._normalizeEvent(e);
    this.mouse.set(x, y);

    const hit = this._raycast();
    if (hit !== null && this.onClick) {
      const objData = (hit.type === 'planet' || hit.type === 'satellite' || hit.type === 'userItem') ? hit.data : this.stars[hit.index];
      this.onClick(objData);
    }
  }

  _onDblClick(e) {
    if (this.starRenderer && this.starRenderer.missionSimulator && this.starRenderer.missionSimulator.active) return;
    const { x, y } = this._normalizeEvent(e);
    this.mouse.set(x, y);

    const hit = this._raycast();
    if (hit !== null && this.onDblClick) {
      const objData = (hit.type === 'planet' || hit.type === 'satellite' || hit.type === 'userItem') ? hit.data : this.stars[hit.index];
      this.onDblClick(objData);
    }
  }

  _onTouchStart(e) {
    if (this.starRenderer && this.starRenderer.missionSimulator && this.starRenderer.missionSimulator.active) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect  = this._canvas.getBoundingClientRect();
    this.mouse.set(
      ((touch.clientX - rect.left) / rect.width)  *  2 - 1,
      -((touch.clientY - rect.top) / rect.height)  *  2 + 1,
    );

    const hit = this._raycast();
    if (hit !== null && this.onClick) {
      const objData = (hit.type === 'planet' || hit.type === 'satellite' || hit.type === 'userItem') ? hit.data : this.stars[hit.index];
      this.onClick(objData);
    }
  }

  _raycast() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Check planets first
    if (this.planetMeshes && this.planetMeshes.length > 0) {
        const meshes = this.planetMeshes.map(pm => pm.mesh);
        const planetHits = this.raycaster.intersectObjects(meshes, true);
        if (planetHits.length > 0) {
            // Find which planet by traversing up from any hit child (e.g. earth clouds)
            let hitMesh = planetHits[0].object;
            let pm = this.planetMeshes.find(p => p.mesh === hitMesh);
            while (!pm && hitMesh.parent) {
                hitMesh = hitMesh.parent;
                pm = this.planetMeshes.find(p => p.mesh === hitMesh);
            }
            if (pm) return { type: 'planet', data: pm.data };
        }
    }

    // Check satellites
    if (this.starRenderer && this.starRenderer.satellites && this.starRenderer.satellites.length > 0) {
        const meshes = this.starRenderer.satellites.map(s => s.mesh);
        const satHits = this.raycaster.intersectObjects(meshes, true);
        if (satHits.length > 0) {
            let hitObj = satHits[0].object;
            while (hitObj && !hitObj.userData.satData && hitObj.parent) {
                hitObj = hitObj.parent;
            }
            if (hitObj && hitObj.userData.satData) {
                return { type: 'satellite', data: hitObj.userData.satData };
            }
        }
    }

    // Check user items (capsules, wishes)
    if (this.starRenderer && this.starRenderer._activeUserItemsGroup) {
        const itemHits = this.raycaster.intersectObject(this.starRenderer._activeUserItemsGroup, true);
        if (itemHits.length > 0) {
            let hitObj = itemHits[0].object;
            if (hitObj.userData && hitObj.userData.isUserItem) {
                return { type: 'userItem', data: hitObj.userData };
            }
        }
    }
    
    if (this.starRenderer && this.starRenderer._publicUserItemsGroup) {
        const itemHits = this.raycaster.intersectObject(this.starRenderer._publicUserItemsGroup, true);
        if (itemHits.length > 0) {
            let hitObj = itemHits[0].object;
            if (hitObj.userData && hitObj.userData.isUserItem) {
                return { type: 'userItem', data: hitObj.userData };
            }
        }
    }

    if (!this.points || !this.points.visible || !this.points.geometry || !this.points.geometry.attributes.position) return null;
    
    // Transform ray to points local space for fast array-level processing
    const localRay = new THREE.Ray();
    localRay.copy(this.raycaster.ray);
    const inverseMatrix = new THREE.Matrix4().copy(this.points.matrixWorld).invert();
    localRay.applyMatrix4(inverseMatrix);

    const positions = this.points.geometry.attributes.position.array;
    const count = positions.length / 3;
    const originX = localRay.origin.x, originY = localRay.origin.y, originZ = localRay.origin.z;
    const dirX = localRay.direction.x, dirY = localRay.direction.y, dirZ = localRay.direction.z;

    let bestIdx = null;
    let bestDot = 0.999985; // ~0.3 degrees tolerance (approx 8-10 pixels)

    // Fast angular check
    for (let i = 0; i < count; i++) {
        let px = positions[i * 3];
        let py = positions[i * 3 + 1];
        let pz = positions[i * 3 + 2];

        // Vector from camera to point
        let vx = px - originX;
        let vy = py - originY;
        let vz = pz - originZ;

        // Normalize
        let lenSq = vx * vx + vy * vy + vz * vz;
        if (lenSq === 0) continue;
        let invLen = 1.0 / Math.sqrt(lenSq);
        vx *= invLen;
        vy *= invLen;
        vz *= invLen;

        // Dot product with ray direction
        let dot = vx * dirX + vy * dirY + vz * dirZ;

        if (dot > bestDot) {
            bestDot = dot;
            bestIdx = i;
        }
    }

    return bestIdx !== null ? { type: 'star', index: bestIdx } : null;
  }

  updatePoints(pointsMesh) {
    this.points = pointsMesh;
  }

  updateStars(stars) {
    this.stars = stars;
  }
  
  updatePlanets(planetMeshes) {
    this.planetMeshes = planetMeshes;
  }
}
