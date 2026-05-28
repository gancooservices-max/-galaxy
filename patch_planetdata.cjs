const fs = require('fs');

const code = `import { Body, MakeTime, HelioVector, GeoVector, Observer } from 'astronomy-engine';
import * as THREE from 'three';

export const PLANETS = [
  { id: 'Sun', body: Body.Sun, texture: '/textures/sun.png', color: '#ffcc00', size: 437.2, mag: -26.7, desc: "Our Star." },
  { id: 'Mercury', body: Body.Mercury, texture: '/textures/mercury.png', color: '#aaaaaa', size: 1.52, mag: 0, desc: "The smallest planet." },
  { id: 'Venus', body: Body.Venus, texture: '/textures/venus.png', color: '#ffcc99', size: 3.8, mag: -4.5, desc: "The hottest planet." },
  { id: 'Earth', body: Body.Earth, texture: '/textures/earth_color.jpg', color: '#3366ff', size: 4.0, mag: 0, desc: "Our home planet." },
  { id: 'Moon', body: Body.Moon, texture: '/textures/moon.png', color: '#dddddd', size: 1.09, mag: -12.7, desc: "Earth's only natural satellite." },
  { id: 'Mars', body: Body.Mars, texture: '/textures/mars.png', color: '#ff4400', size: 2.13, mag: 0.5, desc: "The Red Planet." },
  { id: 'Jupiter', body: Body.Jupiter, texture: '/textures/jupiter.png', color: '#ffaa66', size: 43.89, mag: -2.0, desc: "The largest planet." },
  { id: 'Saturn', body: Body.Saturn, texture: '/textures/saturn.png', color: '#eebb88', size: 36.18, mag: 0.5, desc: "The ringed planet." },
  { id: 'Uranus', body: Body.Uranus, texture: '/textures/uranus.png', color: '#66ccff', size: 15.75, mag: 5.5, desc: "The ice giant." },
  { id: 'Neptune', body: Body.Neptune, texture: '/textures/neptune.png', color: '#3333ff', size: 15.29, mag: 7.8, desc: "The farthest planet." }
];

const AU_SCALE = 93924.2; // 1 AU in ThreeJS units

export function getPlanetsData(date) {
  const time = MakeTime(date);
  
  // Calculate Earth Helio position first because Moon needs it
  const earthVec = HelioVector(Body.Earth, time);
  const earthPos = new THREE.Vector3(earthVec.x, earthVec.z, -earthVec.y).multiplyScalar(AU_SCALE);

  return PLANETS.map(p => {
    let pos = new THREE.Vector3(0, 0, 0);

    if (p.id === 'Sun') {
      pos.set(0, 0, 0);
    } else if (p.id === 'Moon') {
      const geoVec = GeoVector(Body.Moon, time, true);
      // Moon relative to Earth
      const moonRel = new THREE.Vector3(geoVec.x, geoVec.z, -geoVec.y).multiplyScalar(AU_SCALE);
      pos.copy(earthPos).add(moonRel);
    } else {
      const hVec = HelioVector(p.body, time);
      // astronomy-engine: x,y,z where XY is ecliptic plane. 
      // In Three.js, XZ is usually ground plane, so we map Y to -Z, and Z to Y to tilt it.
      // Or just map Y to -Z, Z to Y.
      pos.set(hVec.x, hVec.z, -hVec.y).multiplyScalar(AU_SCALE);
    }

    return {
      id: p.id,
      name: p.id,
      ra: 0,
      dec: 0,
      mag: p.mag,
      dist_ly: pos.length() / AU_SCALE / 63241, // approximate light years
      type: 'Planet',
      texture: p.texture,
      color: p.color,
      size: p.size,
      position: pos,
      isPlanet: true,
      description: p.desc,
      distAu: pos.length() / AU_SCALE
    };
  });
}

/**
 * Calculates the Local Sidereal Time (LST) in degrees.
 */
export function calculateLST(date, longitude) {
  // We can still use this for Earth's rotation
  const time = MakeTime(date);
  const gmstHours = window.astronomy_engine_SiderealTime ? window.astronomy_engine_SiderealTime(time) : 0; // fallback if unused
  let lstHours = gmstHours + (longitude / 15);
  lstHours = lstHours % 24;
  if (lstHours < 0) lstHours += 24;
  return lstHours * 15;
}
`;

fs.writeFileSync('src/PlanetData.js', code, 'utf-8');
console.log('PlanetData patched');`;
