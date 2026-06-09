/**
 * UI.js
 * Manages all UI interactions: search bar, tooltip, side panel, bottom controls.
 */

import { SPECTRAL_TYPES, CONSTELLATIONS, formatDistance, formatRA, formatDec, getStarDescription } from './StarData.js';
import { ImmersiveStarUI } from './ImmersiveStarUI.js';

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
    
    // Ownership block
    this.$starOwnershipBlock = document.getElementById('star-ownership-block');
    this.$starOwnerInfo      = document.getElementById('star-owner-info');
    this.$starOwnerName      = document.getElementById('star-owner-name');
    this.$starOwnerMessage   = document.getElementById('star-owner-message');
    this.$starRegisterBtnCon = document.getElementById('star-register-btn-container');
    this.$btnRegisterStar    = document.getElementById('btn-register-star');
    
    // Registration Modal
    this.$registerModal      = document.getElementById('register-star-modal');
    this.$registerTarget     = document.getElementById('register-star-target');
    this.$registerInputName  = document.getElementById('register-input-name');
    this.$registerInputMsg   = document.getElementById('register-input-message');
    this.$btnCancelRegister  = document.getElementById('btn-cancel-register');
    this.$btnSubmitRegister  = document.getElementById('btn-submit-register');

    this.$starLiveAuthCon    = document.getElementById('star-live-auth-container');
    this.$starPasskeyInput   = document.getElementById('star-passkey-input');
    this.$btnLiveToGalaxy    = document.getElementById('btn-live-to-galaxy');
    this.$starAuthStatus     = document.getElementById('star-auth-status');

    if (this.$btnLiveToGalaxy) {
      this.$btnLiveToGalaxy.addEventListener('click', async () => {
        const key = this.$starPasskeyInput.value;
        if (!key) {
           this.$starAuthStatus.textContent = 'Only registered user can access';
           this.$starAuthStatus.classList.remove('hidden');
           return;
        }
        
        try {
          this.$starAuthStatus.textContent = 'Verifying...';
          this.$starAuthStatus.classList.remove('hidden');
          const res = await fetch(`/api/mystar/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
          });
          const data = await res.json();
          if (res.ok && (String(data.star_id) === String(this.currentStar?.id) || String(data.unique_id) === String(this.currentStar?.id))) {
             this.$starAuthStatus.classList.add('hidden');
             this.$starLiveAuthCon.classList.add('hidden');
             if (this.$panelViewStarBtn) this.$panelViewStarBtn.classList.remove('hidden');
             
             // Trigger comet passing animation to celebrate successful authorization!
             if (this.renderer && this.renderer.triggerComet) {
               this.renderer.triggerComet();
             }
          } else {
             this.$starAuthStatus.textContent = 'Only registered user can access';
             this.$starAuthStatus.classList.remove('hidden');
          }
        } catch (e) {
             this.$starAuthStatus.textContent = 'Network error';
             this.$starAuthStatus.classList.remove('hidden');
        }
      });
    }

    this.registeredStars = {};

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
    this.$btnConstellations = document.getElementById('btn-constellations');
    this.$btnCinematicComet = document.getElementById('menu-btn-cinematic-comet');
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

  async init(stars, planets) {
    this.stars = stars;
    this.planets = planets || [];
    this.$starCountNum.textContent = stars.length.toLocaleString();
    this._setupSearch();
    this._setupPlanetSearch();
    this._setupPanelClose();
    this._setupBottomControls();
    this._setupKeyboard();
    this._setupRegistration();

    try {
      const res = await fetch('/api/stars');
      if (res.ok) {
        this.registeredStars = await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch registered stars:', e);
    }
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
    if (this.$mapModal) {
      this.$mapModal.classList.add('hidden');
    }
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

    // Show registration status
    const isRegistered = this.registeredStars && this.registeredStars[star.id];
    if (isRegistered) {
      this.$tooltipName.innerHTML = `⭐ <span style="color:#ffd700">${isRegistered.starName || star.name}</span>`;
      this.$tooltipType.textContent = 'Registered Star';
      this.$tooltipType.style.color = '#ffd700';
    }

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
  openImmersiveUI(star) {
    const isPlanet = !!star.isPlanet;
    const isSatellite = !!star.isSatellite;
    if (isPlanet || isSatellite) return;

    if (!this.immersiveUI) {
      this.immersiveUI = new ImmersiveStarUI({ renderer: this.renderer });
      
      const immRegBtn = document.getElementById('imm-btn-register');
      if (immRegBtn && this.$btnRegisterStar) {
        immRegBtn.addEventListener('click', () => {
          this.$btnRegisterStar.click();
        });
      }
    }
    
    const immRegBtn = document.getElementById('imm-btn-register');
    const immAuthCon = document.getElementById('imm-live-auth-container');
    const immPasskey = document.getElementById('imm-passkey-input');
    const immBtnLive = document.getElementById('imm-btn-live-galaxy');

    if (immRegBtn && immAuthCon) {
      const immBtnComet = document.getElementById('imm-btn-comet');
      const reg = this.registeredStars && this.registeredStars[star.id];
      if (reg) {
        immRegBtn.textContent = '⭐ Premium Star (Owned)';
        immRegBtn.style.background = 'rgba(255,255,255,0.1)';
        immRegBtn.style.color = '#fff';
        immRegBtn.style.pointerEvents = 'auto';
        immRegBtn.style.cursor = 'pointer';

        if (this.authorizedStars && this.authorizedStars[star.id]) {
          immAuthCon.classList.add('hidden');
          if (immBtnComet) {
            immBtnComet.style.opacity = '1';
            immBtnComet.style.pointerEvents = 'auto';
            immBtnComet.textContent = '🎬 Cinematic Comet';
            immBtnComet.style.color = '#FFD700';
          }
        } else {
          immAuthCon.classList.remove('hidden');
          if (immBtnComet) {
            immBtnComet.style.opacity = '0.4';
            immBtnComet.style.pointerEvents = 'none';
            immBtnComet.textContent = '🔒 Cinematic Comet';
            immBtnComet.style.color = '#ccc';
          }
        }
      } else {
        immRegBtn.textContent = '⭐ Register this Star';
        immRegBtn.style.background = 'linear-gradient(45deg, #ffd700, #ffa500)';
        immRegBtn.style.color = '#000';
        immRegBtn.style.pointerEvents = 'auto';
        immAuthCon.classList.add('hidden');
        if (immBtnComet) {
          immBtnComet.style.opacity = '0.4';
          immBtnComet.style.pointerEvents = 'none';
          immBtnComet.textContent = '🔒 Cinematic Comet';
          immBtnComet.style.color = '#ccc';
        }
      }

      if (immBtnLive && !immBtnLive.dataset.bound) {
        immBtnLive.dataset.bound = "true";
        immBtnLive.addEventListener('click', async () => {
          const pass = immPasskey.value.trim();
          if (!pass) return alert("Please enter the secret key.");
          immBtnLive.textContent = 'Verifying...';
          
          try {
            const res = await fetch('/api/stars/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ starId: this.immersiveUI.activeStar.id, secretKey: pass })
            });
            const data = await res.json();
            if (data.success) {
              if (!this.authorizedStars) this.authorizedStars = {};
              this.authorizedStars[this.immersiveUI.activeStar.id] = true;
              immAuthCon.classList.add('hidden');
              
              const immBtnComet = document.getElementById('imm-btn-comet');
              if (immBtnComet) {
                immBtnComet.style.opacity = '1';
                immBtnComet.style.pointerEvents = 'auto';
                immBtnComet.textContent = '🎬 Cinematic Comet';
                immBtnComet.style.color = '#FFD700';
              }
              
              alert("Access Granted! Live to Galaxy connection established. Cinematic Comet unlocked!");
            } else {
              alert("Invalid Secret Key!");
            }
          } catch (e) {
            console.error(e);
            alert("Error verifying key.");
          } finally {
            immBtnLive.textContent = 'Live to Galaxy';
          }
        });
      }
    }
    
    this.immersiveUI.open(star);
    this.hideTooltip();
    
    if (this.$sidePanel) {
      this.$sidePanel.classList.remove('visible');
      setTimeout(() => this.$sidePanel.classList.add('hidden'), 300);
    }
  }

  /* ---- Side Panel ---- */
  openPanel(star) {
    this.currentStar = star;
    
    const isPlanet = !!star.isPlanet;
    const isSatellite = !!star.isSatellite;

    if (!isPlanet && !isSatellite) {
      // It's a star, open immersive UI instead!
      this.openImmersiveUI(star);
      return;
    }
    if (this.$panelViewStarBtn) {
      this.$panelViewStarBtn.innerHTML = '<span>👁️</span> View 3D Star';
      this.$panelViewStarBtn.style.background = 'rgba(255,255,255,0.05)';
      this.$panelViewStarBtn.style.borderColor = 'rgba(255,255,255,0.1)';
    }
    let panelTitle = star.name || star.id;
    let typeBadgeText = '—';
    let typeBadgeClass = 'type-badge';


    
    const satDisplayName = isSatellite ? (star.name || '').replace(/\(.*\)/, '').trim() : '';
    
    // Check if it's a registered star
    const reg = this.registeredStars && this.registeredStars[star.id];
    if (reg && reg.starName) {
      panelTitle = reg.starName; // Display custom registered name!
    }

    this.$panelName.textContent = isPlanet ? star.id : (isSatellite ? satDisplayName : panelTitle);




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
      if (this.$starOwnershipBlock) this.$starOwnershipBlock.classList.add('hidden');
      
      this.$panelWikiLink.href = pInfo.wiki;
      this.$panelWikiLink.classList.remove('hidden');

      if (this.$panelTemp) this.$panelTemp.textContent = pInfo.temp || '—';
      
      this.$panelDesc = this.$panelDesc || document.getElementById('panel-description');
      if (this.$panelDesc) this.$panelDesc.textContent = pInfo.desc || '';
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

      this.$panelDesc = this.$panelDesc || document.getElementById('panel-description');
      if (this.$panelDesc) {
        this.$panelDesc.textContent = fData 
          ? `Fact: ${fData.fact}`
          : `${star.name} is currently orbiting Earth. Its position and trajectory are tracked in real-time using live NORAD TLE data.`;
      }
      
      // Show code badge in mag area
      const codeStr = star.code || (star.mesh && star.mesh.userData.satData && star.mesh.userData.satData.code) || '—';
      this.$panelMagBadge.textContent  = codeStr;
      this.$panelMagBadge.style.fontFamily = 'monospace';
      this.$panelMagBadge.style.letterSpacing = '1px';

      if (this.$starOwnershipBlock) this.$starOwnershipBlock.classList.add('hidden');
    } else {
      // Star: hide sat card and planet img, show glow
      this.$panelSatImgCard.classList.add('hidden');
      this.$panelPlanetImgP.classList.add('hidden');
      this.$panelGlow.classList.remove('hidden');

      const badgeType = star.type || 'A';
      this.$panelTypeBadge.textContent = star.type ? `${star.type}-type` : '—';
      this.$panelTypeBadge.className   = `type-badge type-${badgeType}`;
      
      this.$panelGlow.classList.remove('hidden');
      this.$panelWikiLink.classList.add('hidden');

      this.$panelRA.textContent        = star.ra   != null ? formatRA(star.ra)   : '—';
      this.$panelDec.textContent       = star.dec  != null ? formatDec(star.dec) : '—';
      
      const typeInfo = SPECTRAL_TYPES[badgeType] || {};
      this.$panelSpectral.textContent  = typeInfo.label || star.type || '—';
      this.$panelTemp.textContent      = typeInfo.temp || '—';
      this.$panelMagnitude.textContent = star.mag?.toFixed(2) || '—';
      this.$panelDesc = this.$panelDesc || document.getElementById('panel-description');
      if (this.$panelDesc) this.$panelDesc.textContent = getStarDescription(star);

      // Star glow color
      this.$panelGlow.style.background = `radial-gradient(circle, white 0%, ${star.color || '#cce8ff'} 30%, rgba(0,0,0,0) 70%)`;
      this.$panelGlow.style.boxShadow  = `0 0 40px 20px ${star.color || '#cce8ff'}55`;
      this.$panelMagBadge.textContent  = `mag ${star.mag?.toFixed(2) || '—'}`;

      // Reset auth state
      if (this.$starLiveAuthCon) {
        this.$starLiveAuthCon.classList.remove('hidden');
      }
      if (this.$starPasskeyInput) {
        this.$starPasskeyInput.value = '';
      }
      if (this.$starAuthStatus) {
        this.$starAuthStatus.classList.add('hidden');
        this.$starAuthStatus.textContent = '';
      }
      if (this.$panelViewStarBtn) {
        this.$panelViewStarBtn.classList.add('hidden'); // hidden until authorized!
      }

      // Star Registry Ownership
      if (this.$starOwnershipBlock) {
        this.$starOwnershipBlock.classList.remove('hidden');
        const reg = this.registeredStars && this.registeredStars[star.id];
        if (reg) {
          // It's owned!
          this.$starOwnerInfo.style.display = 'block'; // force display block just in case
          this.$starOwnerInfo.classList.remove('hidden');
          this.$starOwnerName.textContent = reg.owner || 'Unknown Owner';
          this.$starOwnerMessage.textContent = reg.message ? `"${reg.message}"` : '';
          this.$starRegisterBtnCon.classList.add('hidden');
          this.$starRegisterBtnCon.style.display = 'none';
        } else {
          // Available!
          this.$starOwnerInfo.style.display = 'none'; // force hide
          this.$starOwnerInfo.classList.add('hidden');
          this.$starRegisterBtnCon.style.display = 'block';
          this.$starRegisterBtnCon.classList.remove('hidden');
        }
      }
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

    // Star Search Mode & Filter Setup
    const modeSelect = document.getElementById('search-mode-select');
    const inputContainer = document.getElementById('search-input-container');
    const namedSelect = document.getElementById('named-stars-select');
    const conSelect = document.getElementById('constellation-select');

    if (modeSelect) {
      modeSelect.addEventListener('change', () => {
        const mode = modeSelect.value;
        
        inputContainer.classList.add('hidden');
        namedSelect.classList.add('hidden');
        conSelect.classList.add('hidden');

        if (mode === 'all') {
          inputContainer.classList.remove('hidden');
          if (this.renderer) {
            this.renderer.filterStars('all', 'all');
            this.renderer.exitTelescopeMode();
          }
          const btnExit = document.getElementById('btn-exit-telescope');
          if (btnExit) btnExit.classList.add('hidden');
        } else if (mode === 'named') {
          namedSelect.classList.remove('hidden');
          // If first time, populate named stars
          if (namedSelect.options.length <= 1 && this.stars) {
            const namedStars = this.stars.filter(s => s.isNamed).sort((a,b) => a.name.localeCompare(b.name));
            namedStars.forEach(s => {
              const opt = document.createElement('option');
              opt.value = s.id;
              opt.textContent = s.name;
              namedSelect.appendChild(opt);
            });
          }
          if (this.renderer) {
            this.renderer.filterStars('named', 'all');
            this.renderer.exitTelescopeMode();
          }
          const btnExit = document.getElementById('btn-exit-telescope');
          if (btnExit) btnExit.classList.add('hidden');
        } else if (mode === 'constellation') {
          conSelect.classList.remove('hidden');
          // If first time, populate constellations
          if (conSelect.options.length <= 1 && typeof CONSTELLATIONS !== 'undefined') {
            const sortedCons = Object.keys(CONSTELLATIONS).sort((a,b) => CONSTELLATIONS[a].localeCompare(CONSTELLATIONS[b]));
            sortedCons.forEach(con => {
              const opt = document.createElement('option');
              opt.value = con;
              opt.textContent = CONSTELLATIONS[con];
              conSelect.appendChild(opt);
            });
          }
          // Default: show stars of any constellation or 'all' if conSelect value is empty
          if (this.renderer) this.renderer.filterStars('constellation', conSelect.value || 'all');
        }
      });
    }

    if (namedSelect) {
      namedSelect.addEventListener('change', () => {
        const starId = namedSelect.value;
        if (!starId || !this.stars) return;
        const star = this.stars.find(s => String(s.id) === String(starId));
        if (star && this.onStarClick) {
          this.onStarClick(star);
          if (this.renderer) this.renderer.flyTo(star, 2500);
        }
      });
    }

    if (conSelect) {
      conSelect.addEventListener('change', () => {
        const conVal = conSelect.value;
        if (this.renderer && conVal && conVal !== 'all') {
          this.renderer.filterStars('constellation', conVal);
          this.renderer.enterTelescopeMode(conVal);
          const btnExit = document.getElementById('btn-exit-telescope');
          if (btnExit) btnExit.classList.remove('hidden');
        } else if (this.renderer && (!conVal || conVal === 'all')) {
          this.renderer.filterStars('constellation', 'all');
        }
      });
    }

    const btnExitTelescope = document.getElementById('btn-exit-telescope');
    if (btnExitTelescope) {
      btnExitTelescope.addEventListener('click', () => {
        if (this.renderer) {
          this.renderer.exitTelescopeMode();
        }
        btnExitTelescope.classList.add('hidden');
        if (modeSelect) {
          modeSelect.value = 'all';
          modeSelect.dispatchEvent(new Event('change'));
        }
      });
    }
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

    // Fuzzy search: match by name, registered owner, or registered star name
    this._searchResults = this.stars
      .filter(s => {
        if (s.generated) return false;
        
        // Match base name
        if (s.name.toLowerCase().includes(q)) return true;
        
        // Match registered details
        const reg = this.registeredStars && this.registeredStars[s.id];
        if (reg) {
          if (reg.owner && reg.owner.toLowerCase().includes(q)) return true;
          if (reg.starName && reg.starName.toLowerCase().includes(q)) return true;
        }
        
        return false;
      })
      .sort((a, b) => a.mag - b.mag) // brightest first
      .slice(0, 10);

    this._activeResultIdx = -1;
    this._renderDropdown();
  }

  _renderDropdown() {
    if (this._searchResults.length === 0) {
      this.$searchDropdown.innerHTML = '<div class="search-no-results">No stars found</div>';
    } else {
      this.$searchDropdown.innerHTML = this._searchResults.map((star, i) => {
        const reg = this.registeredStars && this.registeredStars[star.id];
        let displayName = this._highlightMatch(star.name, this.$searchInput.value);
        let metaName = `${star.type || ''}·mag ${star.mag?.toFixed(1) || ''}`;
        
        if (reg) {
           const matchStarName = reg.starName && reg.starName.toLowerCase().includes(this.$searchInput.value.toLowerCase());
           const matchOwner = reg.owner && reg.owner.toLowerCase().includes(this.$searchInput.value.toLowerCase());
           
           if (matchStarName || matchOwner) {
             displayName = `⭐ ${this._highlightMatch(reg.starName || star.name, this.$searchInput.value)}`;
             metaName = `Owned by ${this._highlightMatch(reg.owner, this.$searchInput.value)}`;
           }
        }

        return `<div class="search-result-item" data-idx="${i}">
          <div class="search-result-dot" style="background:${star.color || '#cce8ff'}; color:${star.color || '#cce8ff'}"></div>
          <span class="search-result-name">${displayName}</span>
          <span class="search-result-meta">${metaName}</span>
        </div>`;
      }).join('');

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

    if (this.$btnConstellations) {
      this.$btnConstellations.addEventListener('click', () => {
        const on = this.renderer.toggleConstellations();
        if (this.$btnConstellations) {
          this.$btnConstellations.classList.toggle('active', on);
        }
        if (on && !this.renderer.isPlanetariumMode) {
          // Take the user to the Earth surface
          this.renderer.teleportToSurface(19.0760, 72.8777, 2500);
        }
      });
    }

    if (this.$btnCinematicComet) {
      let isCometUnlocked = false;
      this.$btnCinematicComet.addEventListener('click', () => {
        if (!isCometUnlocked) {
          const key = prompt("Enter Secret Key to Unlock Cinematic Comet:");
          if (key && key.toUpperCase() === "LUMORA") {
            isCometUnlocked = true;
            document.getElementById('comet-btn-icon').textContent = "🎬";
            document.getElementById('comet-btn-text').textContent = "Cinematic Comet";
            document.getElementById('comet-btn-text').style.color = "#FFD700";
            if (this.renderer && this.renderer.triggerCinematicComet) {
              this.renderer.triggerCinematicComet();
            }
          } else if (key !== null) {
            alert("Invalid Secret Key!");
          }
        } else {
          if (this.renderer && this.renderer.triggerCinematicComet) {
            this.renderer.triggerCinematicComet();
          }
        }
      });
    }

    const btnCategories = document.getElementById('btn-star-categories');
    const dropdownCategories = document.getElementById('star-categories-dropdown');
    if (btnCategories && dropdownCategories) {
      btnCategories.addEventListener('click', () => {
        dropdownCategories.classList.toggle('hidden');
        btnCategories.classList.toggle('active', !dropdownCategories.classList.contains('hidden'));
      });
      
      const categories = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
      categories.forEach((cat, index) => {
        const checkbox = document.getElementById(`cat-${cat}`);
        if (checkbox) {
          checkbox.addEventListener('change', (e) => {
            if (this.renderer) {
              this.renderer.setCategoryVisibility(index, e.target.checked);
            }
          });
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

  showRegistrationModal(star) {
    this.currentStar = star;
    const targetEl = document.getElementById('register-star-target');
    if (targetEl) {
      targetEl.textContent = `Star ID: ${star.id} | Magnitude: ${star.mag || 'N/A'} | Constellation: ${star.con || 'Unknown'}`;
    }
    
    // Clear inputs
    const inputName = document.getElementById('register-input-name');
    const inputEmail = document.getElementById('register-input-email');
    const inputStarName = document.getElementById('register-input-starname');
    const inputMsg = document.getElementById('register-input-message');
    if (inputName) inputName.value = '';
    if (inputEmail) inputEmail.value = '';
    if (inputStarName) inputStarName.value = '';
    if (inputMsg) inputMsg.value = '';
    document.getElementById('register-star-modal').classList.remove('hidden');
    document.getElementById('register-star-modal').classList.add('modal-animate-in');
  }

  showAlreadyRegisteredModal(star) {
    const regInfo = this.registeredStars[star.id];
    if (!regInfo) return;

    document.getElementById('reg-info-starname').textContent = regInfo.starName || 'Unnamed Star';
    document.getElementById('reg-info-owner').textContent = regInfo.owner || 'Unknown';
    document.getElementById('reg-info-date').textContent = new Date(regInfo.date).toLocaleDateString();
    
    const modal = document.getElementById('already-registered-modal');
    modal.classList.remove('hidden');
    modal.classList.add('modal-animate-in');
    
    // Add Drag to Rotate 3D effect
    const flipper = document.getElementById('badge-flipper');
    const container = document.getElementById('already-registered-modal');
    if (flipper && !flipper.dataset.dragBound) {
      flipper.dataset.dragBound = 'true';
      
      let isDragging = false;
      let startX, startY;
      let currentRotateX = 0;
      let currentRotateY = 0;
      
      container.addEventListener('mousedown', (e) => {
        // Only start drag if we aren't clicking the close button
        if (e.target.closest('#btn-close-registered')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        flipper.style.transition = 'none'; // remove transition for smooth dragging
      });
      
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // Adjust sensitivity (lower is less sensitive)
        const newRotateY = currentRotateY + deltaX * 0.5;
        const newRotateX = currentRotateX - deltaY * 0.5;
        
        flipper.style.transform = `rotateX(${newRotateX}deg) rotateY(${newRotateY}deg)`;
      });
      
      window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        flipper.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
        
        // Save the new rotation state
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        currentRotateY += deltaX * 0.5;
        currentRotateX -= deltaY * 0.5;
        
        // Optional: snap to front or back if we want, or just let it stay where user left it.
        // We'll let it stay!
      });
    }
  }

  _setupRegistration() {
    if (this.$btnRegisterStar) {
      this.$btnRegisterStar.addEventListener('click', () => {
        if (!this.currentStar) return;
        const reg = this.registeredStars && this.registeredStars[this.currentStar.id];
        if (reg) {
          this.showAlreadyRegisteredModal(this.currentStar);
        } else {
          this.showRegistrationModal(this.currentStar);
        }
      });
    }

    const btnCancel = document.getElementById('btn-cancel-register');
    const btnSubmit = document.getElementById('btn-submit-register');
    const modal = document.getElementById('register-star-modal');
    const btnCloseReg = document.getElementById('btn-close-registered');
    const registeredModal = document.getElementById('already-registered-modal');

    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('modal-animate-in');
      });
    }

    if (btnCloseReg) {
      btnCloseReg.addEventListener('click', () => {
        registeredModal.classList.add('hidden');
        registeredModal.classList.remove('modal-animate-in');
      });
    }

    if (btnSubmit) {
      btnSubmit.addEventListener('click', async () => {
        const name = document.getElementById('register-input-name').value.trim();
        const email = document.getElementById('register-input-email').value.trim();
        const starName = document.getElementById('register-input-starname').value.trim();
        const message = document.getElementById('register-input-message').value.trim();

        if (!name || !email || !starName) {
          return alert('Please fill in your Name, Email, and Star Name.');
        }

        const originalText = btnSubmit.textContent;
        btnSubmit.textContent = 'Registering...';
        btnSubmit.disabled = true;

        try {
          const res = await fetch('/api/stars/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              starId: this.currentStar.id,
              ownerName: name,
              email: email,
              starName: starName,
              message: message,
              originalName: this.currentStar.name
            })
          });

          const data = await res.json();
          if (data.success) {
            this.registeredStars[this.currentStar.id] = { 
              owner: name, 
              message: message,
              starName: starName,
              uniqueId: data.uniqueId,
              date: new Date().toISOString()
            };
            modal.classList.add('hidden');
            modal.classList.remove('modal-animate-in');
            alert(`Star registered successfully!\nYour Security Key: ${data.secretKey}\nA certificate has been generated and emailed to you.`);
            
            // Trigger 3D renderer update
            if (this.renderer) {
               this.renderer.highlightRegisteredStars(this.registeredStars);
            }

            // Immediately refresh the side panel to show the new ownership
            if (this.currentStar) {
               this.openPanel(this.currentStar);
            }
          } else {
            alert(data.error || 'Failed to register.');
          }
        } catch (err) {
          console.error(err);
          alert('An error occurred during registration.');
        } finally {
          btnSubmit.textContent = originalText;
          btnSubmit.disabled = false;
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
      // Escape → close panel / search / exit telescope
      if (e.key === 'Escape') {
        this.closePanel();
        this._hideDropdown();
        if (this.renderer) {
          this.renderer.exitTelescopeMode();
        }
        const btnExit = document.getElementById('btn-exit-telescope');
        if (btnExit && !btnExit.classList.contains('hidden')) {
          btnExit.classList.add('hidden');
          if (this.$searchModeSelect) {
            this.$searchModeSelect.value = 'all';
            this.$searchModeSelect.dispatchEvent(new Event('change'));
          }
        }
      }
    });
  }
}
