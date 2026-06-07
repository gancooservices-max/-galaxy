/**
 * main.js
 * Application entry point — wires all modules together.
 */

import './style.css';
import * as THREE from 'three';
import { loadStarCatalog } from './StarData.js';
import { StarRenderer }    from './StarRenderer.js';
import { Interaction }     from './Interaction.js';
import { UI }              from './UI.js';
import { getPlanetsData } from './PlanetData.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { mountLandingPage } from './landing/index.jsx';


async function main() {
  // ─── 1. Load star data ──────────────────────────────────────
  const stars = await loadStarCatalog();
  const planets = getPlanetsData(new Date());

  // ─── 2. Initialize Renderer ─────────────────────────────────
  const container = document.getElementById('canvas-container');
  const renderer  = new StarRenderer(container);
  renderer.init();
  renderer.buildStars(stars);
  renderer.addPlanets(planets);
  
  // Custom VR Toggle Logic
  const hiddenVrContainer = document.createElement('div');
  hiddenVrContainer.style.display = 'none';
  const vrBtnDefault = VRButton.createButton(renderer.renderer);
  hiddenVrContainer.appendChild(vrBtnDefault);
  document.body.appendChild(hiddenVrContainer);

  const btnVr = document.getElementById('btn-vr');
  if (btnVr) {
    btnVr.addEventListener('click', () => {
      vrBtnDefault.click();
    });
    // Check if VR is actually supported and update our custom button UI
    setTimeout(() => {
      if (vrBtnDefault.textContent.toUpperCase().includes('NOT SUPPORTED')) {
        btnVr.style.opacity = '0.5';
        btnVr.title = 'VR Not Supported on this device';
        const label = btnVr.querySelector('.ctrl-label');
        if (label) label.textContent = 'VR (N/A)';
      }
    }, 500);
  }

  // Update loading bar
  const bar  = document.getElementById('loading-bar');
  const text = document.getElementById('loading-text');
  if (bar)  bar.style.width  = '100%';
  if (text) text.textContent = 'Launching StarVoyager…';



  // ─── 4. Initialize UI ────────────────────────────────────────
  const ui = new UI();
  await ui.init(stars, planets);
  ui.renderer = renderer;
  if (ui.registeredStars) {
    renderer.highlightRegisteredStars(ui.registeredStars);
  }

  // ─── 4.5. Mount Landing Page ────────
  const uiElements = [
    'app-header', 'corner-menubar', 'time-controller', 'bottom-controls', 'nav-hint'
  ];
  
  const handleExplore = (target) => {
    window.dispatchEvent(new CustomEvent('stop-tracking-mystar'));
    // Show 3D UI
    uiElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = ''; // Clear inline display so CSS takes over
    });
    // Ensure specific elements have correct display
    const btnToggleFeatures = document.getElementById('btn-toggle-features');
    if (btnToggleFeatures) btnToggleFeatures.style.display = '';

    const rootEl = document.getElementById('react-root');
    if (rootEl) {
      rootEl.style.pointerEvents = 'none';
      rootEl.style.display = 'none';
    }

    if (typeof target === 'string') {
      if (target === 'Stars') {
        renderer.resetView();
      } else if (target === 'Earth') {
        renderer.flyToEarth();
      } else {
        const targetObj = renderer.planetMeshes ? renderer.planetMeshes.find(pm => pm.data.id === target) : null;
        if (targetObj) {
          renderer.flyTo({ isPlanet: true, mesh: targetObj.mesh, data: targetObj.data }, 3000);
        } else {
          renderer.resetView();
        }
      }
    } else {
      renderer.resetView();
    }
  };

  const mountHome = () => {
    uiElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const btnToggleFeatures = document.getElementById('btn-toggle-features');
    if (btnToggleFeatures) btnToggleFeatures.style.display = 'none';

    window.dispatchEvent(new CustomEvent('stop-tracking-mystar'));

    const rootEl = document.getElementById('react-root');
    if (rootEl) {
      rootEl.style.pointerEvents = 'auto';
      rootEl.style.display = 'block';
    }
    renderer.resetView(); // Reset the view to solar system
    mountLandingPage('react-root', handleExplore);
  };

  // Mount initially
  mountHome();

  // Bind Home Button
  const btnHome = document.getElementById('menu-btn-home');
  if (btnHome) {
    btnHome.addEventListener('click', () => {
      // Close side panel and map modal if open
      ui.closePanel();
      ui.closeMapModal();
      
      // Collapse menu sidebar
      if (typeof collapseMenu === 'function') {
        collapseMenu();
      } else {
        const cornerMenubar = document.getElementById('corner-menubar');
        const btnToggleFeatures = document.getElementById('btn-toggle-features');
        if (cornerMenubar) cornerMenubar.classList.add('collapsed');
        if (btnToggleFeatures) btnToggleFeatures.classList.remove('hidden');
      }
      
      mountHome();
    });
  }

  // Bind My Star Button
  const btnMyStar = document.getElementById('menu-btn-mystar');
  if (btnMyStar) {
    btnMyStar.addEventListener('click', () => {
      // Close side panel and map modal if open
      ui.closePanel();
      ui.closeMapModal();
      
      // Collapse menu sidebar
      if (typeof collapseMenu === 'function') {
        collapseMenu();
      } else {
        const cornerMenubar = document.getElementById('corner-menubar');
        const btnToggleFeatures = document.getElementById('btn-toggle-features');
        if (cornerMenubar) cornerMenubar.classList.add('collapsed');
        if (btnToggleFeatures) btnToggleFeatures.classList.remove('hidden');
      }
      
      // Make react-root visible so the portal can be seen OVER the 3D map
      const rootEl = document.getElementById('react-root');
      if (rootEl) {
        rootEl.style.pointerEvents = 'auto';
        rootEl.style.display = 'block';
      }
      
      // Tell React to show the My Star Portal after a tiny delay
      // to avoid race conditions
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-mystar', { detail: { source: 'galaxy' } }));
      }, 50);
    });
  }

  window.addEventListener('mystar-zoom-in', () => {
    if (!renderer) return;
    if (!renderer._active3DStar && window.isMyStarTracking && window.currentTrackedStarId) {
      const starData = renderer.stars.find(s => String(s.id) === String(window.currentTrackedStarId) || String(s.id) === `CUST-${window.currentTrackedStarId}`);
      if (starData) {
        // "directly showing the 3d view"
        renderer.viewStar3D(starData, true); // instant = true
        
        // "all features is visible" (restore UI)
        return;
      }
    }
    renderer.zoomTowardsSelected(true);
  });

  window.addEventListener('mystar-zoom-out', () => {
    if (!renderer) return;
    if (!renderer._active3DStar && window.isMyStarTracking && window.currentTrackedStarId) {
      const starData = renderer.stars.find(s => String(s.id) === String(window.currentTrackedStarId) || String(s.id) === `CUST-${window.currentTrackedStarId}`);
      if (starData) {
        renderer.viewStar3D(starData, true); // instant = true
        return;
      }
    }
    renderer.zoomTowardsSelected(false);
  });

  window.addEventListener('mystar-toggle-3d', (e) => {
    if (!renderer) return;
    const starId = e.detail?.starId || window.currentTrackedStarId;
    const starData = renderer.stars.find(s => String(s.id) === String(starId) || String(s.id) === `CUST-${starId}`);
    
    if (starData) {
      if (renderer._active3DStar) {
        // Switch back to 2D normal star mode
        renderer._clearActiveStarSystem();
        renderer.selectStar(starData);
        renderer.flyTo(starData, 1500);
      } else {
        // Switch to Photorealistic 3D Star mode
        renderer.viewStar3D(starData);
      }
    }
  });

  // Listen for the MyStar Portal's "Locate in Galaxy" action
  window.addEventListener('locate-mystar', (e) => {
    const starId = e.detail?.starId;
    if (!starId || !renderer || !renderer.stars) return;

    window.isMyStarTracking = true;
    window.currentTrackedStarId = starId; // Save for 3D toggle

    if (typeof ui !== 'undefined') {
      ui.hideTooltip();
      ui.closePanel(); // Close side panel
    }
    
    // Hide UI for a clean tracking view
    const elsToHide = ['app-header', 'bottom-controls', 'btn-toggle-features', 'corner-menubar', 'time-controller', 'side-panel'];
    elsToHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    
    // Find the star
    // The star_id in the database can either be a standard HYG id, or 'CUST-XXXX'
    const starData = renderer.stars.find(s => String(s.id) === String(starId) || String(s.id) === `CUST-${starId}`);
    
    if (starData) {
      if (renderer._active3DStar) {
        renderer._clearActiveStarSystem();
      }
      renderer.selectStar(starData); // Applies the blinking marker
      renderer.flyTo(starData, 3000);
    } else {
      console.warn("Star not found in current loaded map:", starId);
    }
  });

  window.addEventListener('stop-tracking-mystar', () => {
    window.isMyStarTracking = false;
    
    if (renderer && renderer.controls) {
      renderer.controls.autoRotate = false;
    }

    // Restore 3D UI
    const elsToShow = ['app-header', 'bottom-controls', 'btn-toggle-features', 'corner-menubar', 'time-controller'];
    elsToShow.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = ''; // restore
    });

  });

  // ─── 5. Initialize Interaction ───────────────────────────────
  const interaction = new Interaction(
    renderer.renderer,
    renderer.camera,
    stars,
    renderer.pointsMesh,
    renderer.earth,
    renderer.planetMeshes,
    renderer
  );

  const updatePlanetRealtimeDistance = (star) => {
    if (star && star.isPlanet) {
      const earthMesh = renderer.earth;
      const planetMesh = renderer.planetMeshes.find(pm => pm.data.id === star.id)?.mesh;
      if (earthMesh && planetMesh && star.id !== 'Earth') {
        const dist = planetMesh.position.distanceTo(earthMesh.position);
        const distAu = dist / 93924.2;
        const distKm = distAu * 149597870.7;
        star.realtimeDist = distAu < 0.1 
          ? `${Math.round(distKm).toLocaleString()} km` 
          : `${distAu.toFixed(3)} AU`;
      } else if (star.id === 'Earth') {
        star.realtimeDist = '0 km (You are here)';
      }
    }
  };

  // Hover handler
  interaction.onHover = (star, x, y) => {
    if (renderer.missionSimulator && renderer.missionSimulator.active) return;
    if (window.isMyStarTracking) {
      ui.hideTooltip();
      return;
    }

    if (star) {
      updatePlanetRealtimeDistance(star);
      ui.showTooltip(star, x, y);
      renderer.renderer.domElement.style.cursor = 'pointer';
    } else {
      ui.hideTooltip();
      renderer.renderer.domElement.style.cursor = 'grab';
    }
  };

  // Click handler
  interaction.onClick = (star) => {
    if (renderer.missionSimulator && renderer.missionSimulator.active) return;

    updatePlanetRealtimeDistance(star);
    renderer.selectStar(star);
    ui.openPanel(star);
    renderer.setAutoRotate(false);
    ui.$btnAutoRot.classList.remove('active');
    
    if (star.isPlanet || star.isSatellite) {
      renderer.flyTo(star, 2500);
    }
  };

  renderer.onPlanetClick = interaction.onClick;


  // Earth click handler
  interaction.onEarthClick = () => {
    const earthData = planets.find(p => p.id === 'Earth');
    if (earthData) {
      updatePlanetRealtimeDistance(earthData);
      renderer.selectStar(earthData);
      ui.openPanel(earthData);
      renderer.setAutoRotate(false);
      ui.$btnAutoRot.classList.remove('active');
    }
  };

  interaction.enable();

  // --- Corner Menubar Logic ---

  const btnCollapse = document.getElementById('menu-collapse-btn');
  const btnToggleFeatures = document.getElementById('btn-toggle-features');
  const cornerMenubar = document.getElementById('corner-menubar');
  
  function collapseMenu() {
    if (cornerMenubar) {
      cornerMenubar.classList.add('collapsed');
      if (btnToggleFeatures) btnToggleFeatures.classList.remove('hidden');
    }
  }

  function openMenu() {
    if (cornerMenubar) {
      cornerMenubar.classList.remove('collapsed');
      if (btnToggleFeatures) btnToggleFeatures.classList.add('hidden');
    }
  }

  if (btnCollapse) {
    btnCollapse.addEventListener('click', collapseMenu);
  }

  if (btnToggleFeatures) {
    btnToggleFeatures.addEventListener('click', openMenu);
  }


  const btnChandra = document.getElementById('menu-btn-chandra');

  if (btnChandra) {
    btnChandra.addEventListener('click', () => {
      // Safely trigger the existing Chandrayaan button
      const existingBtn = document.getElementById('btn-mission');
      if (existingBtn) {
        existingBtn.click();
      }
      collapseMenu();
    });
  }


  // ─── 6. Wire UI Callbacks ────────────────────────────────────
  // Planet HUD marker click handler
  renderer.onPlanetMarkerClick = (planet) => {
    if (renderer.missionSimulator && renderer.missionSimulator.active) return;
    updatePlanetRealtimeDistance(planet);
    renderer.selectStar(planet);
    ui.openPanel(planet);
    renderer.setAutoRotate(false);
    ui.$btnAutoRot.classList.remove('active');
    renderer.flyTo(planet, 2500);
  };

  // Search click / fly to
  ui.onStarClick = (star) => {
    updatePlanetRealtimeDistance(star);
    renderer.selectStar(star);
    // Simply select the star/planet, it will set the camera target for manual zooming
    // User can click "Fly To" in the UI to travel there.
    ui.openPanel(star);
    renderer.setAutoRotate(false);
    ui.$btnAutoRot.classList.remove('active');
  };

  // Fly-to button in panel
  ui.onFlyTo = (star) => {
    renderer.flyTo(star);
    renderer.setAutoRotate(false);
    ui.$btnAutoRot.classList.remove('active');
  };

  // View 3D Star button in panel
  ui.onViewStar = (star) => {
    renderer.viewStar3D(star);
    renderer.setAutoRotate(false);
    ui.$btnAutoRot.classList.remove('active');

    if (ui.$panelViewStarBtn) {
      if (renderer._active3DStar) {
        ui.$panelViewStarBtn.innerHTML = '<span>❌</span> Exit 3D View';
        ui.$panelViewStarBtn.style.background = 'rgba(255, 60, 60, 0.15)';
        ui.$panelViewStarBtn.style.borderColor = 'rgba(255, 60, 60, 0.3)';
        if (ui.$panelSupernovaControls) ui.$panelSupernovaControls.classList.remove('hidden');
        if (ui.$panelSupernovaBtn) {
          ui.$panelSupernovaBtn.disabled = false;
          ui.$panelSupernovaBtn.style.opacity = '1.0';
          ui.$panelSupernovaBtn.innerHTML = '<span>💥</span> Trigger Supernova';
        }
      } else {
        ui.$panelViewStarBtn.innerHTML = '<span>👁️</span> View 3D Star';
        ui.$panelViewStarBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        ui.$panelViewStarBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        if (ui.$panelSupernovaControls) ui.$panelSupernovaControls.classList.add('hidden');
      }
    }
  };

  // Trigger Supernova click
  ui.onTriggerSupernova = (star) => {
    if (ui.$panelSupernovaBtn) {
      ui.$panelSupernovaBtn.disabled = true;
      ui.$panelSupernovaBtn.style.opacity = '0.5';
      ui.$panelSupernovaBtn.innerHTML = '<span>⏳</span> Supernova Initiated...';
    }
    renderer.triggerSupernova(star);
  };

  // Mission Toggle click
  ui.onMissionToggle = () => {
    if (renderer.missionSimulator) {
      const active = renderer.missionSimulator.toggle();
      if (ui.$btnMission) {
        ui.$btnMission.classList.toggle('active', active);
      }
      
      const cornerMenu = document.getElementById('corner-menubar');

      // Close side detail panels to prevent UI clutter and confusion
      if (active) {
        ui.closePanel();
        const celPanel = document.getElementById('celestial-info-panel');
        if (celPanel) celPanel.classList.remove('visible');
        if (cornerMenu) cornerMenu.style.display = 'none';
      } else {
        if (cornerMenu) cornerMenu.style.display = '';
      }
    }
  };


  // Reset view
  ui.onReset = () => {
    if (renderer.missionSimulator) {
      renderer.missionSimulator.exit();
      if (ui.$btnMission) {
        ui.$btnMission.classList.remove('active');
      }
      const cornerMenu = document.getElementById('corner-menubar');
      if (cornerMenu) cornerMenu.style.display = '';
    }
    renderer.resetView();
    renderer.setAutoRotate(false);
    ui.$btnAutoRot.classList.remove('active');
  };

  // Auto-rotate toggle
  ui.onAutoRotate = (enabled) => renderer.setAutoRotate(enabled);

  // Celestial Grid Toggle
  ui.onGridToggle = () => {
    return renderer.toggleCelestialGrid();
  };

  // ─── Time Travel Engine Controls ─────────────────────────────
  const btnTimePlay    = document.getElementById('btn-time-play');
  const btnTimeRewind  = document.getElementById('btn-time-rewind');
  const btnTimeForward = document.getElementById('btn-time-forward');
  const btnTimeNow     = document.getElementById('btn-time-now');

  // Timescales index matching [-10M, -1M, -100k, -1k, -1, 1, 1k, 100k, 1M, 10M]
  const timescales = [-10000000, -1000000, -100000, -1000, -1, 1, 1000, 100000, 1000000, 10000000];
  let timescaleIndex = 5;

  function updateTimeScaleUI() {
    btnTimeRewind.classList.remove('active');
    btnTimeForward.classList.remove('active');
    btnTimePlay.classList.remove('active');

    if (renderer.isTimePaused) {
      btnTimePlay.textContent = '▶️';
      btnTimePlay.title = 'Play Simulation';
    } else {
      btnTimePlay.textContent = '⏸️';
      btnTimePlay.title = 'Pause Simulation';
      btnTimePlay.classList.add('active');

      if (renderer.timeScale > 1) {
        btnTimeForward.classList.add('active');
      } else if (renderer.timeScale < 0) {
        btnTimeRewind.classList.add('active');
      }
    }
  }

  if (btnTimePlay) {
    btnTimePlay.addEventListener('click', () => {
      renderer.isTimePaused = !renderer.isTimePaused;
      updateTimeScaleUI();
    });
  }

  if (btnTimeForward) {
    btnTimeForward.addEventListener('click', () => {
      renderer.isTimePaused = false;
      if (timescaleIndex < timescales.length - 1) {
        timescaleIndex++;
      }
      renderer.timeScale = timescales[timescaleIndex];
      updateTimeScaleUI();
    });
  }

  if (btnTimeRewind) {
    btnTimeRewind.addEventListener('click', () => {
      renderer.isTimePaused = false;
      if (timescaleIndex > 0) {
        timescaleIndex--;
      }
      renderer.timeScale = timescales[timescaleIndex];
      updateTimeScaleUI();
    });
  }

  if (btnTimeNow) {
    btnTimeNow.addEventListener('click', () => {
      renderer.simulationTime = new Date();
      renderer.timeScale = 1.0;
      timescaleIndex = 5;
      renderer.isTimePaused = false;
      updateTimeScaleUI();
    });
  }

  updateTimeScaleUI();

  // Map Teleport (Planetarium View)
  ui.onTeleport = (lat, lon) => {
    renderer.teleportToSurface(lat, lon);
    document.getElementById('planetarium-ui').classList.remove('hidden');
    document.getElementById('bottom-controls').classList.add('hidden');
  };

  // Solar System Button (Launch into Space)
  const btnSolarSystem = document.getElementById('btn-solar-system');
  if (btnSolarSystem) {
    btnSolarSystem.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('stop-tracking-mystar'));
      renderer.resetView(); // Exits planetarium mode and returns to space
      const pUi = document.getElementById('planetarium-ui');
      if (pUi) pUi.classList.add('hidden');
      const bCtrl = document.getElementById('bottom-controls');
      if (bCtrl) bCtrl.classList.remove('hidden');
    });
  }

  // Map Drive (Spaceship Mode)
  ui.onDriveSpaceship = () => {
    renderer.enableSpaceshipMode();
    document.getElementById('drive-ui').classList.remove('hidden');
    document.getElementById('bottom-controls').classList.add('hidden');
    const cockpit = document.getElementById('spaceship-cockpit');
    if (cockpit) cockpit.classList.remove('hidden');
  };

  // Exit Drive Mode
  const btnExitDrive = document.getElementById('btn-exit-drive');
  if (btnExitDrive) {
    btnExitDrive.addEventListener('click', () => {
      renderer.disableSpaceshipMode();
      document.getElementById('drive-ui').classList.add('hidden');
      document.getElementById('bottom-controls').classList.remove('hidden');
      const cockpit = document.getElementById('spaceship-cockpit');
      if (cockpit) cockpit.classList.add('hidden');
    });
  }



  // Panel fly btn
  ui.$panelFlyBtn.addEventListener('click', () => {
    if (ui.currentStar) renderer.flyTo(ui.currentStar);
  });

  // ─── 7. Start Render Loop ────────────────────────────────────
  renderer.startRenderLoop();

  // ─── 8. Cinematic Intro / Default View ───────────────────────
  // We will start focused on the Sun with a wide view.
  const sunData = planets.find(p => p.id === 'Sun');
  if (sunData) {
    renderer.flyTo({ isPlanet: true, ...sunData }, 0); // instantly go to sun
    
    // Zoom out significantly for a wide view of the solar system
    setTimeout(() => {
      renderer.camera.position.set(0, 2000, 8000);
      renderer.controls.update();
    }, 100);
  }

  // ─── 9. Pre-compile Shaders and Hide Loading Screen ──────────
  try {
    renderer.renderer.compile(renderer.scene, renderer.camera);
  } catch (e) {
    console.warn("Shader pre-compilation failed, rendering may stutter initially.", e);
  }
  ui.hideLoading();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
  console.error('StarVoyager failed to initialize:', err);
  const text = document.getElementById('loading');
  if (text) {
    text.textContent = `Error: ${err.message}`;
    text.style.color = 'red';
  }
  const errDiv = document.createElement('div');
  errDiv.style.cssText = 'position:fixed;top:50px;left:0;z-index:9999;background:red;color:white;padding:10px;font-family:monospace;max-width:100%;word-wrap:break-word;';
  errDiv.textContent = 'FATAL ERROR: ' + (err.stack || err.message);
  document.body.appendChild(errDiv);
});
