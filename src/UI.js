/**
 * UI.js
 * Manages all UI interactions: search bar, tooltip, side panel, bottom controls.
 */

import { SPECTRAL_TYPES, formatDistance, formatRA, formatDec, getStarDescription } from './StarData.js';

const PLANET_INFO = {
  'Sun': { temp: '5,778 K', type: 'Yellow Dwarf Star', spec: 'G2V', desc: 'The star at the center of the Solar System.', mass: '1.989 × 10^30 kg', radius: '696,340 km', gravity: '274 m/s²', orbit: '230 million years', day: '27 days', wiki: 'https://en.wikipedia.org/wiki/Sun', img: '/textures/sun.png' },
  'Mercury': { temp: '-173 °C to 427 °C', type: 'Terrestrial Planet', spec: 'Rocky', desc: 'The smallest and closest planet to the Sun.', mass: '3.30 × 10^23 kg', radius: '2,439.7 km', gravity: '3.7 m/s²', orbit: '88 days', day: '59 days', wiki: 'https://en.wikipedia.org/wiki/Mercury_(planet)', img: '/textures/mercury.png' },
  'Venus': { temp: '462 °C', type: 'Terrestrial Planet', spec: 'Atmospheric Rocky', desc: 'The hottest planet in our solar system, with a dense greenhouse atmosphere.', mass: '4.87 × 10^24 kg', radius: '6,051.8 km', gravity: '8.87 m/s²', orbit: '225 days', day: '243 days', wiki: 'https://en.wikipedia.org/wiki/Venus', img: '/textures/venus.png' },
  'Earth': { temp: '15 °C', type: 'Terrestrial Habitable Planet', spec: 'Oceanic Rocky', desc: 'Our home planet and the only known place in the universe to support life.', mass: '5.97 × 10^24 kg', radius: '6,371 km', gravity: '9.807 m/s²', orbit: '365.25 days', day: '24 hours', wiki: 'https://en.wikipedia.org/wiki/Earth', img: '/textures/earth_color.jpg' },
  'Moon': { temp: '-130 °C to 120 °C', type: 'Natural Satellite', spec: 'Rocky Moon', desc: 'Earth\'s only natural satellite, playing a key role in tides and stability.', mass: '7.34 × 10^22 kg', radius: '1,737.4 km', gravity: '1.62 m/s²', orbit: '27.3 days', day: '27.3 days', wiki: 'https://en.wikipedia.org/wiki/Moon', img: '/textures/moon.png' },
  'Mars': { temp: '-62 °C', type: 'Terrestrial Planet', spec: 'Rocky', desc: 'The Red Planet, featuring massive volcanoes and ancient riverbeds.', mass: '6.42 × 10^23 kg', radius: '3,389.5 km', gravity: '3.721 m/s²', orbit: '687 days', day: '24.6 hours', wiki: 'https://en.wikipedia.org/wiki/Mars', img: '/textures/mars.png' },
  'Jupiter': { temp: '-108 °C', type: 'Gas Giant', spec: 'Hydrogen-Helium Gas', desc: 'The largest planet in our solar system, famous for its Great Red Spot.', mass: '1.898 × 10^27 kg', radius: '69,911 km', gravity: '24.79 m/s²', orbit: '11.8 years', day: '9.9 hours', wiki: 'https://en.wikipedia.org/wiki/Jupiter', img: '/textures/jupiter.png' },
  'Saturn': { temp: '-139 °C', type: 'Gas Giant', spec: 'Hydrogen-Helium Gas', desc: 'The ringed giant, with a spectacular Cassini & Encke ring division system.', mass: '5.68 × 10^26 kg', radius: '58,232 km', gravity: '10.44 m/s²', orbit: '29.5 years', day: '10.7 hours', wiki: 'https://en.wikipedia.org/wiki/Saturn', img: '/textures/saturn.png' },
  'Uranus': { temp: '-197 °C', type: 'Ice Giant', spec: 'Water-Ammonia Ice', desc: 'An ice giant that spins on its side with a vertical ring system.', mass: '8.68 × 10^25 kg', radius: '25,362 km', gravity: '8.69 m/s²', orbit: '84 years', day: '17.2 hours', wiki: 'https://en.wikipedia.org/wiki/Uranus', img: '/textures/uranus.png' },
  'Neptune': { temp: '-201 °C', type: 'Ice Giant', spec: 'Water-Ammonia Ice', desc: 'The farthest planet, swept by supersonic winds and methane haze.', mass: '1.024 × 10^26 kg', radius: '24,622 km', gravity: '11.15 m/s²', orbit: '164.8 years', day: '16.1 hours', wiki: 'https://en.wikipedia.org/wiki/Neptune', img: '/textures/neptune.png' }
};

export class UI {
  constructor() {
    // Elements
    this.$searchInput    = document.getElementById('search-input');
    this.$searchDropdown = document.getElementById('search-dropdown');
    this.$tooltip        = document.getElementById('star-tooltip');
    this.$tooltipName    = document.getElementById('tooltip-name');
    this.$tooltipMag     = document.getElementById('tooltip-mag');
    this.$tooltipDist    = document.getElementById('tooltip-dist');
    this.$tooltipTemp    = document.getElementById('tooltip-temp');
    this.$tooltipType    = document.getElementById('tooltip-type');
    this.$sidePanel      = document.getElementById('side-panel');
    this.$panelName      = document.getElementById('panel-star-name');
    this.$panelTypeBadge = document.getElementById('panel-type-badge');
    this.$panelMagBadge  = document.getElementById('panel-mag-badge');
    this.$panelDist      = document.getElementById('panel-dist');
    this.$panelRA        = document.getElementById('panel-ra');
    this.$panelDec       = document.getElementById('panel-dec');
    this.$panelSpectral  = document.getElementById('panel-spectral');
    this.$panelTemp      = document.getElementById('panel-temp');
    this.$panelMagnitude = document.getElementById('panel-magnitude');
    this.$panelDesc      = document.getElementById('panel-description');
    this.$panelGlow       = document.getElementById('panel-star-glow');
    this.$panelSatImgCard = document.getElementById('panel-sat-img-card');
    this.$panelPlanetImg  = document.getElementById('panel-planet-img');      // satellite img (inside card)
    this.$panelPlanetImgP = document.getElementById('panel-planet-img-planet'); // planet img
    this.$panelMass      = document.getElementById('panel-mass');
    this.$panelRadius    = document.getElementById('panel-radius');
    this.$panelGravity   = document.getElementById('panel-gravity');
    this.$panelOrbit     = document.getElementById('panel-orbit');
    this.$panelDay       = document.getElementById('panel-day');
    this.$panelWikiLink  = document.getElementById('panel-wiki-link');
    this.$panelClose     = document.getElementById('side-panel-close');
    this.$panelFlyBtn    = document.getElementById('panel-fly-btn');
    this.$panelViewStarBtn = document.getElementById('panel-view-star-btn');
    this.$panelZoomInBtn = document.getElementById('panel-zoom-in-btn');
    this.$panelZoomOutBtn = document.getElementById('panel-zoom-out-btn');
    this.$panelTelescopeControls = document.getElementById('panel-telescope-controls');
    this.$panelSupernovaControls = document.getElementById('panel-supernova-controls');
    this.$panelSupernovaBtn = document.getElementById('panel-supernova-btn');
    this.$panelSatName     = document.getElementById('panel-sat-name');
    this.$panelSatCountry  = document.getElementById('panel-sat-country');
    this.$panelSatLaunch   = document.getElementById('panel-sat-launch');
    this.$panelSatPurpose  = document.getElementById('panel-sat-purpose');
    this.$panelSatStatus   = document.getElementById('panel-sat-status');
    this.$panelSatDist     = document.getElementById('panel-sat-dist');
    this.$panelViewStarBtn = document.getElementById('panel-view-star-btn');
    this.$starPlanetStats  = document.getElementById('star-planet-stats');
    this.$starPlanetDivider= document.getElementById('star-planet-divider');
    this.$starCountNum   = document.getElementById('star-count-num');

    this.$btnReset       = document.getElementById('btn-reset');
    this.$btnAutoRot     = document.getElementById('btn-autorotate');
    this.$btnGrid        = document.getElementById('btn-grid');
    this.$btnStars       = document.getElementById('btn-stars');
    this.$btnDeselect    = document.getElementById('btn-deselect');
    this.$btnMission     = document.getElementById('btn-mission');
    this.$loadingScreen  = document.getElementById('loading-screen');
    this.$navHint        = document.getElementById('nav-hint');

    // Planet search elements
    this.$planetSearchWrapper = document.getElementById('planet-search-wrapper');
    this.$planetSearchInput   = document.getElementById('planet-search-input');
    this.$planetSearchDropdown= document.getElementById('planet-search-dropdown');

    this.$satelliteSearchWrapper = document.getElementById('satellite-search-wrapper');
    this.$satelliteSearchInput   = document.getElementById('satellite-search-input');
    this.$satelliteSearchDropdown= document.getElementById('satellite-search-dropdown');

    // State
    this.stars = [];
    this.planets = [];
    this.currentStar = null;
    this._searchResults = [];
    this._activeResultIdx = -1;
    this._tooltipVisible = false;

    // Callbacks
    this.onStarClick  = null;  // (star) => void
    this.onFlyTo      = null;  // (star) => void
    this.onViewStar   = null;  // (star) => void
    this.onTriggerSupernova = null; // (star) => void
    this.onMissionToggle    = null; // () => void

    this.onReset      = null;  // () => void
    this.onAutoRotate = null;  // (bool) => void
    this.onGridToggle = null;  // () => void
  }

  init(stars, planets) {
    this.stars = stars;
    this.planets = planets || [];
    this.$starCountNum.textContent = stars.length.toLocaleString();
    this._setupSearch();
    this._setupPlanetSearch();
    this._setupPanelClose();
    this._setupBottomControls();
    this._setupKeyboard();
  }

  /* ---- Loading ---- */
  hideLoading() {
    setTimeout(() => {
      this.$loadingScreen.classList.add('fade-out');
    }, 300);

    // Dismiss nav hint after 8s
    setTimeout(() => {
      if (this.$navHint) {
        this.$navHint.style.transition = 'opacity 1s ease';
        this.$navHint.style.opacity = '0';
        setTimeout(() => this.$navHint.remove(), 1000);
      }
    }, 8000);
  }

  // Map Modal
  initMap() {
    this.$mapModal = document.getElementById('map-modal');
    this.$closeMapBtn = document.getElementById('close-map-btn');
    this.$mapContainer = document.getElementById('map-container');
    this.$earthImg = document.getElementById('earth-map-img');
    this.$mapPin = document.getElementById('map-pin');
    this.$mapCoords = document.getElementById('map-coords');
    this.$btnTeleport = document.getElementById('btn-teleport');
    this.$btnCancelMap = document.getElementById('btn-cancel-map');
    
    this.selectedLat = null;
    this.selectedLon = null;

    this.$closeMapBtn.addEventListener('click', () => this.closeMapModal());
    this.$btnCancelMap.addEventListener('click', () => this.closeMapModal());
    this.$btnTeleport.addEventListener('click', () => {
      this.closeMapModal();
      if (this.onTeleport && this.selectedLat !== null) {
        this.onTeleport(this.selectedLat, this.selectedLon);
      }
    });

    this.$earthImg.addEventListener('click', (e) => {
      const rect = this.$earthImg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const pxRatio = x / rect.width;
      const pyRatio = y / rect.height;
      
      this.selectedLon = (pxRatio * 360) - 180;
      this.selectedLat = 90 - (pyRatio * 180);
      
      this.$mapCoords.textContent = `Lat: ${this.selectedLat.toFixed(2)}°, Lon: ${this.selectedLon.toFixed(2)}°`;
      this.$mapCoords.classList.add('selected');
      
      this.$mapPin.style.left = `${x + this.$earthImg.offsetLeft}px`;
      this.$mapPin.style.top = `${y + this.$earthImg.offsetTop}px`;
      this.$mapPin.classList.remove('hidden');
      this.$btnTeleport.disabled = false;
    });
  }

  openMapModal() {
    if (!this.$mapModal) this.initMap();
    this.$mapModal.classList.remove('hidden');
    this.$mapPin.classList.add('hidden');
    this.$btnTeleport.disabled = true;
    this.$mapCoords.textContent = 'Lat: --, Lon: --';
    this.$mapCoords.classList.remove('selected');
  }

  closeMapModal() {
    this.$mapModal.classList.add('hidden');
  }

  /* ---- Tooltip ---- */
  showTooltip(star, screenX, screenY) {
    this.$tooltipName.textContent = star.name;
    this.$tooltipMag.textContent  = `mag ${star.mag?.toFixed(2) || '—'}`;
    
    // Distance
    if (star.isPlanet) {
      this.$tooltipDist.textContent = star.realtimeDist || '—';
    } else {
      this.$tooltipDist.textContent = star.dist_ly ? formatDistance(star.dist_ly) : '—';
    }

    // Temperature & Type
    let tempVal = '—';
    let typeVal = '—';
    if (star.isPlanet && PLANET_INFO[star.id]) {
      tempVal = PLANET_INFO[star.id].temp;
      typeVal = PLANET_INFO[star.id].type;
    } else {
      tempVal = SPECTRAL_TYPES[star.type]?.temp || '—';
      typeVal = SPECTRAL_TYPES[star.type]?.label || star.type || '—';
    }

    this.$tooltipTemp.textContent = tempVal;
    this.$tooltipType.textContent = typeVal;
    this.$tooltipType.style.color = star.color || '#00d4ff';

    // Position near cursor
    const margin = 16;
    let left = screenX + margin;
    let top  = screenY - 40;

    const tipW = 210, tipH = 95;
    if (left + tipW > window.innerWidth)  left = screenX - tipW - margin;
    if (top  + tipH > window.innerHeight) top  = screenY - tipH - margin;

    this.$tooltip.style.left = left + 'px';
    this.$tooltip.style.top  = top  + 'px';
    this.$tooltip.classList.remove('hidden');
    this._tooltipVisible = true;
  }

  hideTooltip() {
    this.$tooltip.classList.add('hidden');
    this._tooltipVisible = false;
  }

  /* ---- Side Panel ---- */
  openPanel(star) {
    this.currentStar = star;
    if (this.$panelViewStarBtn) {
      this.$panelViewStarBtn.innerHTML = '<span>👁️</span> View 3D Star';
      this.$panelViewStarBtn.style.background = 'rgba(255,255,255,0.05)';
      this.$panelViewStarBtn.style.borderColor = 'rgba(255,255,255,0.1)';
    }
    const typeInfo = SPECTRAL_TYPES[star.type] || {};
    const isPlanet = star.isPlanet;
    const isSatellite = star.isSatellite;

    this.$panelName.textContent = star.name;

    // Show/hide entire star-planet stats section vs satellite section
    const showStarPlanet = !isSatellite;
    this.$starPlanetStats.classList.toggle('hidden', !showStarPlanet);
    this.$starPlanetDivider.classList.toggle('hidden', !showStarPlanet);
    document.querySelectorAll('.star-stat').forEach(el => el.classList.toggle('hidden', isPlanet || isSatellite));
    document.querySelectorAll('.planet-stat').forEach(el => el.classList.toggle('hidden', !isPlanet));
    document.querySelectorAll('.sat-stat').forEach(el => el.classList.toggle('hidden', !isSatellite));

    if (this.$btnDeselect) {
      this.$btnDeselect.style.display = 'flex';
    }

    if (isPlanet && PLANET_INFO[star.id]) {
      const pInfo = PLANET_INFO[star.id];
      this.$panelTypeBadge.textContent = pInfo.type;
      this.$panelTypeBadge.className   = `type-badge type-A`;
      
      this.$panelMass.textContent = pInfo.mass;
      this.$panelRadius.textContent = pInfo.radius;
      this.$panelGravity.textContent = pInfo.gravity;
      this.$panelOrbit.textContent = pInfo.orbit;
      this.$panelDay.textContent = pInfo.day;
      
      // Hide satellite card, show planet img
      this.$panelSatImgCard.classList.add('hidden');
      this.$panelPlanetImgP.src = pInfo.img;
      this.$panelPlanetImgP.classList.remove('hidden');
      this.$panelGlow.classList.add('hidden');
      if (this.$panelViewStarBtn) this.$panelViewStarBtn.classList.add('hidden');
      
      this.$panelWikiLink.href = pInfo.wiki;
      this.$panelWikiLink.classList.remove('hidden');

      this.$panelTemp.textContent  = pInfo.temp;
      this.$panelDesc.textContent  = pInfo.desc;
    } else if (isSatellite) {
      this.$panelTypeBadge.textContent = 'Artificial Satellite';
      this.$panelTypeBadge.className   = `type-badge type-A`;
      
      const fData = star.famousData;
      
      // Show satellite image card, hide planet img and glow
      this.$panelPlanetImgP.classList.add('hidden');
      this.$panelGlow.classList.add('hidden');
      if (fData && fData.image) {
          this.$panelPlanetImg.src = fData.image;
          this.$panelSatImgCard.classList.remove('hidden');
      } else {
          this.$panelSatImgCard.classList.add('hidden');
      }
      if (this.$panelViewStarBtn) this.$panelViewStarBtn.classList.add('hidden');
      
      const wikiUrl = (fData && fData.wiki) ? fData.wiki : `https://en.wikipedia.org/wiki/${encodeURIComponent(star.name)}`;
      this.$panelWikiLink.href = wikiUrl;
      this.$panelWikiLink.classList.remove('hidden');

      // Populate Satellite Stats
      this.$panelSatName.textContent    = star.name;
      this.$panelSatCountry.textContent = fData ? fData.country : 'Unknown';
      this.$panelSatLaunch.textContent  = fData && fData.launchDate ? fData.launchDate : 'Unknown';
      this.$panelSatPurpose.textContent = fData ? fData.purpose : 'Spacecraft / Probe';
      this.$panelSatStatus.textContent  = 'Active';
      
      let distanceText = 'Tracking...';
      if (this.renderer && this.renderer.earth && star.mesh) {
          const distWorld = star.mesh.position.distanceTo(this.renderer.earth.position);
          const distKm = (distWorld * (6371.0 / 4.0)) - 6371.0;
          if (distKm > 0) {
              distanceText = Math.round(distKm).toLocaleString() + ' km';
          }
      }
      this.$panelSatDist.textContent = distanceText;

      this.$panelDesc.textContent = fData 
        ? `Fact: ${fData.fact}`
        : `${star.name} is currently orbiting Earth. Its position and trajectory are tracked in real-time using live NORAD TLE data.`;
      
      // Show code badge in mag area
      const codeStr = star.code || (star.mesh && star.mesh.userData.satData && star.mesh.userData.satData.code) || '—';
      this.$panelMagBadge.textContent  = codeStr;
      this.$panelMagBadge.style.fontFamily = 'monospace';
      this.$panelMagBadge.style.letterSpacing = '1px';
    } else {
      // Star: hide sat card and planet img, show glow
      this.$panelSatImgCard.classList.add('hidden');
      this.$panelPlanetImgP.classList.add('hidden');
      this.$panelGlow.classList.remove('hidden');
      if (this.$panelViewStarBtn) this.$panelViewStarBtn.classList.remove('hidden');

      const badgeType = star.type || 'A';
      this.$panelTypeBadge.textContent = star.type ? `${star.type}-type` : '—';
      this.$panelTypeBadge.className   = `type-badge type-${badgeType}`;
      
      this.$panelGlow.classList.remove('hidden');
      this.$panelWikiLink.classList.add('hidden');

      this.$panelRA.textContent        = star.ra   != null ? formatRA(star.ra)   : '—';
      this.$panelDec.textContent       = star.dec  != null ? formatDec(star.dec) : '—';
      this.$panelSpectral.textContent  = typeInfo.label || star.type || '—';
      this.$panelTemp.textContent      = typeInfo.temp || '—';
      this.$panelMagnitude.textContent = star.mag?.toFixed(2) || '—';
      this.$panelDesc.textContent      = getStarDescription(star);

      // Star glow color
      this.$panelGlow.style.background = `radial-gradient(circle, white 0%, ${star.color || '#cce8ff'} 30%, rgba(0,0,0,0) 70%)`;
      this.$panelGlow.style.boxShadow  = `0 0 40px 20px ${star.color || '#cce8ff'}55`;
      this.$panelMagBadge.textContent  = `mag ${star.mag?.toFixed(2) || '—'}`;
    }
    
    // Distance
    if (isPlanet) {
      this.$panelDist.textContent = star.realtimeDist || '—';
    } else {
      this.$panelDist.textContent = star.dist_ly ? formatDistance(star.dist_ly) : 'Unknown';
    }

    // Dynamic Fly To Button Label
    const btnLabel = isPlanet ? `Fly To ${star.name || star.id || 'Planet'}` : (isSatellite ? `Track Satellite` : `Fly To Star`);
    if (this.$panelFlyBtn) this.$panelFlyBtn.innerHTML = `<span>🚀</span> ${btnLabel}`;

    if (this.renderer && this.renderer.isPlanetariumMode) {
      if (this.$panelTelescopeControls) this.$panelTelescopeControls.classList.remove('hidden');
      if (this.$panelFlyBtn) this.$panelFlyBtn.classList.add('hidden');
      if (this.$panelViewStarBtn) this.$panelViewStarBtn.classList.add('hidden');
    } else {
      if (this.$panelTelescopeControls) this.$panelTelescopeControls.classList.add('hidden');
      if (this.$panelFlyBtn) this.$panelFlyBtn.classList.remove('hidden');
    }

    if (this.$panelSupernovaControls) {
      this.$panelSupernovaControls.classList.toggle('hidden', isPlanet || isSatellite);
    }

    this.$sidePanel.classList.remove('hidden');
    this.hideTooltip();
  }

  closePanel() {
    this.$sidePanel.classList.add('hidden');
    this.currentStar = null;
    if (this.$btnDeselect) {
      this.$btnDeselect.style.display = 'none';
    }
  }

  /* ---- Search ---- */
  _setupSearch() {
    this.$searchInput.addEventListener('input', () => this._onSearchInput());
    this.$searchInput.addEventListener('keydown', (e) => this._onSearchKeydown(e));
    this.$searchInput.addEventListener('focus', () => {
      this._hidePlanetDropdown();
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#search-wrapper')) this._hideDropdown();
      if (this.$planetSearchWrapper && !e.target.closest('#planet-search-wrapper')) {
        this._hidePlanetDropdown();
      }
      if (this.$satelliteSearchWrapper && !e.target.closest('#satellite-search-wrapper')) {
        this._hideSatelliteDropdown();
      }
    });
  }

  _setupPlanetSearch() {
    if (this.$planetSearchInput) {
      this.$planetSearchInput.addEventListener('click', (e) => {
        e.stopPropagation();
        this._togglePlanetDropdown();
      });
    }
    if (this.$satelliteSearchInput) {
      this.$satelliteSearchInput.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleSatelliteDropdown();
      });
    }
  }

  _togglePlanetDropdown() {
    this._hideDropdown();
    this._hideSatelliteDropdown();
    if (this.$planetSearchDropdown.classList.contains('hidden')) {
      this._showPlanetDropdown();
    } else {
      this._hidePlanetDropdown();
    }
  }

  _showPlanetDropdown() {
    const planetColors = {
      'Sun': '#ffcc00',
      'Mercury': '#bbbbbb',
      'Venus': '#e3bb76',
      'Earth': '#4b90ff',
      'Moon': '#dddddd',
      'Mars': '#ff5f3f',
      'Jupiter': '#e0ae8a',
      'Saturn': '#dfd2a7',
      'Uranus': '#76cedf',
      'Neptune': '#4b70dd'
    };

    const planetIcons = {
      'Sun': '☀️',
      'Mercury': '🌑',
      'Venus': '🌕',
      'Earth': '🌍',
      'Moon': '🌙',
      'Mars': '🔴',
      'Jupiter': '🪐',
      'Saturn': '🪐',
      'Uranus': '🪐',
      'Neptune': '🪐'
    };

    this.$planetSearchDropdown.innerHTML = this.planets.map(planet => {
      const color = planetColors[planet.id] || '#ffffff';
      const icon = planetIcons[planet.id] || '🪐';
      return `
        <div class="search-result-item planet-item" data-id="${planet.id}">
          <div class="search-result-dot" style="background:${color}; color:${color}"></div>
          <span class="search-result-name">${icon} ${planet.id}</span>
          <span class="search-result-meta">${planet.id === 'Sun' ? 'Star' : planet.id === 'Moon' ? 'Satellite' : 'Planet'}</span>
        </div>
      `;
    }).join('');

    this.$planetSearchDropdown.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const planetId = el.getAttribute('data-id');
        const planet = this.planets.find(p => p.id === planetId);
        if (planet && this.onStarClick) {
          this.onStarClick(planet);
        }
        this._hidePlanetDropdown();
      });
    });

    this.$planetSearchDropdown.classList.remove('hidden');
    this._hideDropdown();
  }

  _hidePlanetDropdown() {
    if (this.$planetSearchDropdown) {
      this.$planetSearchDropdown.classList.add('hidden');
    }
  }

  _toggleSatelliteDropdown() {
    this._hideDropdown();
    this._hidePlanetDropdown();
    if (this.$satelliteSearchDropdown.classList.contains('hidden')) {
      this._buildSatelliteDropdown();
      this.$satelliteSearchDropdown.classList.remove('hidden');
    } else {
      this.$satelliteSearchDropdown.classList.add('hidden');
    }
  }

  _hideSatelliteDropdown() {
    if (this.$satelliteSearchDropdown) {
      this.$satelliteSearchDropdown.classList.add('hidden');
    }
  }

  _buildSatelliteDropdown() {
    if (!this.renderer || !this.renderer.satellites) return;
    this.$satelliteSearchDropdown.innerHTML = '';
    
    // Sort so main satellites are first
    const sats = [...this.renderer.satellites].sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return a.name.localeCompare(b.name);
    });
    
    sats.forEach(sat => {
      const item = document.createElement('div');
      item.className = 'search-result-item satellite-item';

      const code = sat.code || 'LMR-???';
      const displayName = sat.name.replace(/\(.*\)/, '').trim();
      const isMain = sat.isMain;

      const imgHtml = (sat.famousData && sat.famousData.image) 
          ? `<img src="${sat.famousData.image}" style="width: 22px; height: 22px; border-radius: 4px; object-fit: contain; flex-shrink:0;">`
          : `<span style="font-size:18px; flex-shrink:0;">🛰️</span>`;
          
      item.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;width:100%">
          ${imgHtml}
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-family:monospace;font-size:11px;font-weight:bold;letter-spacing:1px;color:${isMain ? '#00ffcc' : '#ffaa00'};background:rgba(0,0,0,0.5);padding:1px 6px;border-radius:3px;border:1px solid ${isMain ? 'rgba(0,255,204,0.4)' : 'rgba(255,170,0,0.4)'}">${code}</span>
            </div>
            <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${displayName}</div>
          </div>
        </div>
      `;
      item.addEventListener('click', () => {
        this.$satelliteSearchInput.value = code;
        this._hideSatelliteDropdown();
        if (!sat.isMain && sat.mesh && !sat.mesh.visible) {
            sat.mesh.visible = true;
        }
        
        const satData = {
          id: sat.name,
          name: sat.name.replace(/\(.*\)/, '').trim(),
          code: sat.code,
          isSatellite: true,
          mesh: sat.mesh,
          data: { id: sat.name, size: sat.isMain ? 0.1 : 0.05 },
          famousData: sat.famousData
        };
        
        this.openPanel(satData);
        this.renderer.selectStar(satData);
        this.renderer.flyTo(satData, 2500);
      });
      this.$satelliteSearchDropdown.appendChild(item);
    });
  }

  _onSearchInput() {
    const q = this.$searchInput.value.trim().toLowerCase();
    if (q.length < 1) {
      this._hideDropdown();
      return;
    }

    // Fuzzy search: match by name
    this._searchResults = this.stars
      .filter(s => !s.generated && s.name.toLowerCase().includes(q))
      .sort((a, b) => a.mag - b.mag) // brightest first
      .slice(0, 10);

    this._activeResultIdx = -1;
    this._renderDropdown();
  }

  _renderDropdown() {
    if (this._searchResults.length === 0) {
      this.$searchDropdown.innerHTML = '<div class="search-no-results">No stars found</div>';
    } else {
      this.$searchDropdown.innerHTML = this._searchResults.map((star, i) =>
        `<div class="search-result-item" data-idx="${i}">
          <div class="search-result-dot" style="background:${star.color || '#cce8ff'}; color:${star.color || '#cce8ff'}"></div>
          <span class="search-result-name">${this._highlightMatch(star.name, this.$searchInput.value)}</span>
          <span class="search-result-meta">${star.type || ''}·mag ${star.mag?.toFixed(1) || ''}</span>
        </div>`
      ).join('');

      this.$searchDropdown.querySelectorAll('.search-result-item').forEach((el, i) => {
        el.addEventListener('click', () => this._selectSearchResult(i));
      });
    }
    this.$searchDropdown.classList.remove('hidden');
  }

  _highlightMatch(name, query) {
    const idx = name.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return name;
    return `${name.slice(0, idx)}<mark style="background:rgba(0,212,255,0.2);color:var(--accent-cyan);border-radius:2px">${name.slice(idx, idx + query.length)}</mark>${name.slice(idx + query.length)}`;
  }

  _onSearchKeydown(e) {
    const n = this._searchResults.length;
    if (n === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._activeResultIdx = (this._activeResultIdx + 1) % n;
      this._updateActiveResult();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._activeResultIdx = (this._activeResultIdx - 1 + n) % n;
      this._updateActiveResult();
    } else if (e.key === 'Enter') {
      if (this._activeResultIdx >= 0) this._selectSearchResult(this._activeResultIdx);
      else if (n > 0)                 this._selectSearchResult(0);
    } else if (e.key === 'Escape') {
      this._hideDropdown();
      this.$searchInput.blur();
    }
  }

  _updateActiveResult() {
    this.$searchDropdown.querySelectorAll('.search-result-item').forEach((el, i) => {
      el.classList.toggle('active', i === this._activeResultIdx);
    });
  }

  _selectSearchResult(idx) {
    const star = this._searchResults[idx];
    if (!star) return;
    this.$searchInput.value = star.name;
    this._hideDropdown();
    if (this.onStarClick) this.onStarClick(star);
  }

  _hideDropdown() {
    this.$searchDropdown.classList.add('hidden');
    this._searchResults = [];
  }

  /* ---- Panel Controls ---- */
  _setupPanelClose() {
    this.$panelClose.addEventListener('click', () => this.closePanel());
    if (this.$panelFlyBtn) {
      this.$panelFlyBtn.addEventListener('click', () => {
        if (this.currentStar && this.onFlyTo) {
          this.onFlyTo(this.currentStar);
        }
      });
    }
    if (this.$panelViewStarBtn) {
      this.$panelViewStarBtn.addEventListener('click', () => {
        if (this.currentStar && this.onViewStar) {
          this.onViewStar(this.currentStar);
        }
      });
    }
    if (this.$panelSupernovaBtn) {
      this.$panelSupernovaBtn.addEventListener('click', () => {
        if (this.currentStar && this.onTriggerSupernova) {
          this.onTriggerSupernova(this.currentStar);
        }
      });
    }
    if (this.$panelZoomInBtn) {
      this.$panelZoomInBtn.addEventListener('click', () => {
        if (this.renderer) {
          this.renderer.zoomTowardsSelected(true);
        }
      });
    }
    if (this.$panelZoomOutBtn) {
      this.$panelZoomOutBtn.addEventListener('click', () => {
        if (this.renderer) {
          this.renderer.zoomTowardsSelected(false);
        }
      });
    }
  }

  /* ---- Bottom Controls ---- */
  _setupBottomControls() {
    this.$btnReset.addEventListener('click', () => {
      if (this.onReset) this.onReset();
      this.closePanel();
    });

    this.$btnAutoRot.addEventListener('click', () => {
      const nowActive = this.$btnAutoRot.classList.toggle('active');
      if (this.onAutoRotate) this.onAutoRotate(nowActive);
    });

    this.$btnGrid.addEventListener('click', () => {
      if (this.renderer) {
        const on = this.renderer.toggleCelestialGrid();
        this.$btnGrid.classList.toggle('active', on);
      }
    });

    if (this.$btnStars) {
      this.$btnStars.addEventListener('click', () => {
        if (this.renderer) {
          const on = this.renderer.toggleBackgroundStars();
          this.$btnStars.classList.toggle('active', on);
          const label = this.$btnStars.querySelector('.ctrl-label');
          if (label) {
            label.textContent = on ? 'Hide Stars' : 'Show Stars';
          }
        }
      });
    }

    if (this.$btnDeselect) {
      this.$btnDeselect.addEventListener('click', () => {
        this.closePanel();
        if (this.renderer) {
          this.renderer._clearSelection();
          this.renderer._trackedPlanet = null;
        }
      });
    }

    if (this.$btnMission) {
      this.$btnMission.addEventListener('click', () => {
        if (this.onMissionToggle) {
          this.onMissionToggle();
        }
      });
    }
  }

  /* ---- Keyboard Shortcuts ---- */
  _setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      // ⌘K or Ctrl+K → focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.$searchInput.focus();
        this.$searchInput.select();
      }
      // Escape → close panel / search
      if (e.key === 'Escape') {
        this.closePanel();
        this._hideDropdown();
      }
    });
  }
}
