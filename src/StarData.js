/**
 * StarData.js
 * Loads and processes real star catalog data.
 * Converts RA/Dec spherical coordinates to 3D Cartesian positions.
 */

export const SPECTRAL_TYPES = {
  O: { label: 'O-type Supergiant', color: '#6688ff', temp: '33,000 K', description: 'Extremely hot and luminous blue stars. The rarest and most massive stars, often living only a few million years before exploding as supernovae.' },
  B: { label: 'B-type Giant',      color: '#99baff', temp: '17,000 K', description: 'Hot blue-white stars, much more common than O-type. Many of the brightest stars in the night sky are B-type stars.' },
  A: { label: 'A-type Main Sequence', color: '#cce8ff', temp: '8,500 K', description: 'White to blue-white stars with strong hydrogen absorption lines. Sirius and Vega are A-type stars.' },
  F: { label: 'F-type Main Sequence', color: '#fff9d6', temp: '6,500 K', description: 'Yellow-white stars slightly hotter than the Sun. They often host complex planetary systems.' },
  G: { label: 'G-type Main Sequence', color: '#ffea66', temp: '5,778 K', description: 'Yellow stars like our Sun. G-type stars are considered ideal candidates for hosting habitable planets.' },
  K: { label: 'K-type Orange Giant', color: '#ffaa33', temp: '4,500 K', description: 'Orange to red stars slightly cooler than the Sun. K-type stars are considered prime candidates in the search for extraterrestrial life.' },
  M: { label: 'M-type Red Giant',   color: '#ff3333', temp: '3,200 K', description: 'Cool red stars — the most common type in the galaxy. Red dwarfs can live for trillions of years.' },
};

/**
 * Convert Right Ascension and Declination to 3D Cartesian coordinates.
 * @param {number} raDeg - Right Ascension in degrees
 * @param {number} decDeg - Declination in degrees
 * @param {number} radius - Distance from center
 * @returns {{ x, y, z }}
 */
export function raDecToCartesian(raDeg, decDeg, radius = 500) {
  const ra  = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  return {
    x: radius * Math.cos(dec) * Math.cos(ra),
    y: radius * Math.sin(dec),
    z: -radius * Math.cos(dec) * Math.sin(ra),
  };
}

/**
 * Map visual magnitude to point size (brighter = larger).
 * Magnitude scale is reversed: lower mag = brighter.
 */

/**
 * Map visual magnitude to point size (brighter = larger).
 */
export function magToSize(mag) {
  const clipped = Math.max(-2, Math.min(7, mag));
  return Math.max(0.5, 5.5 - clipped * 0.65);
}

/**
 * Map visual magnitude to opacity.
 */
export function magToOpacity(mag) {
  const clipped = Math.max(-2, Math.min(7, mag));
  return Math.max(0.2, 1.0 - clipped * 0.09);
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Load HYG star catalog from JSON.
 * @returns {Promise<Array>}
 */
export async function loadStarCatalog() {
  const loadingBar  = document.getElementById('loading-bar');
  const loadingText = document.getElementById('loading-text');

  setLoading(loadingBar, loadingText, 10, 'Fetching HYG star catalog (120k stars)…');

  const response = await fetch('/data/hyg_stars.json');
  const rawData  = await response.json();

  setLoading(loadingBar, loadingText, 50, `Parsing ${rawData.length} stars…`);

  // HYG format: [id, x, y, z, mag, r, g, b, name]
  // Note: HYG XYZ are in parsecs. We scale by some factor to fit our sky sphere.
  // We want stars around radius 4,000,000.
  // Actually, HYG XYZ are unit vectors sometimes, or parsecs.
  // Wait, I used cols[17,18,19] which are Cartesian coordinates in parsecs (X,Y,Z).
  // If we just normalize them and multiply by our sky radius, we get a nice sky sphere!
  
  const minRadius = 5000;
  const maxRadius = 4000000;
  
  const stars = rawData.map(d => {
    const [id, x, y, z, mag, r, g, b, name, type] = d;
    
    // Normalize and scale to a volumetric 3D space
    const len = Math.sqrt(x*x + y*y + z*z) || 1;
    
    // Logarithmic scale for distance to create a navigable starfield
    const trueDistFactor = Math.min(1, Math.log10(len + 1) / Math.log10(100000));
    const volumetricRadius = minRadius + (trueDistFactor * (maxRadius - minRadius));
    
    const nx = (x / len) * volumetricRadius;
    const ny = (y / len) * volumetricRadius;
    const nz = (z / len) * volumetricRadius;

    return {
      id,
      name,
      mag,
      r, g, b,
      color: rgbToHex(r, g, b),
      dist_ly: len * 3.262, // 1 parsec = 3.262 light years
      type: type || 'G',
      position: { x: nx, y: ny, z: nz },
      size: magToSize(mag),
    };
  });

  setLoading(loadingBar, loadingText, 90, `Processed ${stars.length} stars…`);
  return stars;
}

function setLoading(bar, textEl, percent, text) {
  if (bar) bar.style.width = percent + '%';
  if (textEl) textEl.textContent = text;
}

/**
 * Format distance for display.
 */
export function formatDistance(ly) {
  if (!ly || ly === 0) return 'Unknown';
  if (ly < 10)    return `${ly.toFixed(2)} ly`;
  if (ly < 1000)  return `${Math.round(ly)} ly`;
  return `${(ly / 1000).toFixed(1)}k ly`;
}

/**
 * Format RA in HH MM SS format.
 */
export function formatRA(raDeg) {
  const h = raDeg / 15;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = Math.round(((h - hh) * 60 - mm) * 60);
  return `${String(hh).padStart(2,'0')}h ${String(mm).padStart(2,'0')}m ${String(ss).padStart(2,'0')}s`;
}

/**
 * Format Dec with sign and DMS.
 */
export function formatDec(decDeg) {
  const sign = decDeg >= 0 ? '+' : '−';
  const abs  = Math.abs(decDeg);
  const dd   = Math.floor(abs);
  const mm   = Math.floor((abs - dd) * 60);
  const ss   = Math.round(((abs - dd) * 60 - mm) * 60);
  return `${sign}${String(dd).padStart(2,'0')}° ${String(mm).padStart(2,'0')}′ ${String(ss).padStart(2,'0')}″`;
}

/**
 * Get a short description for a star based on its spectral type and magnitude.
 */
export function getStarDescription(star) {
  const typeInfo = SPECTRAL_TYPES[star.type] || {};
  const brightness = star.mag < 1   ? 'one of the brightest stars in the sky'
                   : star.mag < 2   ? 'a prominent star visible to the naked eye'
                   : star.mag < 3.5 ? 'easily visible on clear nights'
                   : 'a faint star at the edge of naked-eye visibility';
  const generated = star.generated ? 'This background star is part of our simulated star field. ' : '';
  return `${generated}${typeInfo.description || ''} ${star.name} is ${brightness}${star.dist_ly ? `, located ${formatDistance(star.dist_ly)} from Earth` : ''}.`;
}

export const FAMOUS_MISSIONS = {
  'ISS': { name: 'International Space Station', country: 'NASA, Roscosmos, ESA, JAXA', purpose: 'Space research & astronauts', fact: 'Humans live here in space 🌍', targetId: 'ISS', image: '/images/satellites/iss.png', launchDate: 'November 20, 1998' },
  'CSS': { name: 'Tiangong Space Station', country: 'China', purpose: 'Space research', fact: 'China’s own space station 🇨🇳', targetId: 'CSS', image: '/images/satellites/css.png', launchDate: 'April 29, 2021' },
  'Hubble': { name: 'Hubble Space Telescope', country: 'NASA', purpose: 'Space observation', fact: 'Captured amazing galaxy images 🔭', targetId: 'HUBBLE', image: '/images/satellites/hubble.png', launchDate: 'April 24, 1990' },
  'James Webb': { name: 'James Webb Space Telescope', country: 'NASA', purpose: 'Deep universe exploration', fact: 'Most advanced telescope ever ✨', image: '/images/satellites/jwst.png', launchDate: 'December 25, 2021', orbitParams: { target: 'Earth', distance: 15, speed: 0.05, size: 0.1 } },

  'Mangalyaan': { name: 'Mangalyaan (MOM)', country: 'ISRO', purpose: 'Mars mission', fact: 'India reached Mars in first attempt 🔥', image: '/images/satellites/mangalyaan.png', launchDate: 'November 5, 2013', orbitParams: { target: 'Mars', distance: 2.0, speed: 0.3, size: 0.05 } },
  'Voyager 1': { name: 'Voyager 1', country: 'NASA', purpose: 'Deep space exploration', fact: 'Farthest human-made object 🌌', image: '/images/satellites/voyager.png', launchDate: 'September 5, 1977', staticPos: { x: 5000, y: 1500, z: -2000 }, size: 0.2 },
  'Voyager 2': { name: 'Voyager 2', country: 'NASA', purpose: 'Planet exploration', fact: 'Visited Uranus & Neptune 🪐', image: '/images/satellites/voyager.png', launchDate: 'August 20, 1977', staticPos: { x: 3000, y: -2500, z: -4000 }, size: 0.2 },
  'Starlink': { name: 'Starlink', country: 'SpaceX', purpose: 'Internet service', fact: 'Thousands of satellites orbit Earth 📡', targetId: 'STARLINK', image: '/images/satellites/starlink.png', launchDate: '2019 - Present' },
  'Galileo': { name: 'Galileo Spacecraft', country: 'NASA / JPL', purpose: 'Jupiter exploration', fact: 'First spacecraft to orbit Jupiter & study its moons 🪐', image: '/images/satellites/galileo.png', launchDate: 'October 18, 1989', wiki: 'https://en.wikipedia.org/wiki/Galileo_(spacecraft)', staticPos: { x: 4200, y: 500, z: -3800 }, size: 0.2 },
  'GPS Block III': { name: 'GPS Block III', country: 'USA', purpose: 'Global positioning', fact: 'Used in maps & phones 📍', targetId: 'NAVSTAR', image: '/images/satellites/gps.png', launchDate: 'December 23, 2018' }
};
