import { JourneySimulator } from './JourneySimulator.js';

export class ImmersiveStarUI {
  constructor(app) {
    this.app = app;
    this.$overlay = document.getElementById('immersive-star-overlay');
    this.$closeBtn = document.getElementById('immersive-close-btn');
    
    // Header
    this.$starName = document.getElementById('immersive-star-name');
    this.$starType = document.getElementById('immersive-star-type');
    
    // Data Fields
    this.$dataId = document.getElementById('imm-data-id');
    this.$dataDist = document.getElementById('imm-data-dist');
    this.$dataTemp = document.getElementById('imm-data-temp');
    this.$dataMass = document.getElementById('imm-data-mass');
    this.$dataLum = document.getElementById('imm-data-lum');
    this.$dataRad = document.getElementById('imm-data-rad');
    this.$dataClass = document.getElementById('imm-data-class');
    
    // Story
    this.$storyText = document.getElementById('imm-story-text');
    this.$storyFact = document.getElementById('imm-story-fact');

    // Controls
    this.$btnAutoRotate = document.getElementById('imm-btn-rotate');
    this.$btnReset = document.getElementById('imm-btn-reset');
    this.$btnFly = document.getElementById('imm-btn-fly');
    this.$btnExplode = document.getElementById('imm-btn-explode');
    this.$btnComet = document.getElementById('imm-btn-comet');
    
    this._bindEvents();
    this._wireCollapsibleCards();
    this.activeStar = null;
    this.isRotating = false;
    this.isCometUnlocked = false;

    // Ensure overlay is fully hidden on init (fixes default-visible bug)
    if (this.$overlay) {
      this.$overlay.classList.remove('open');
      this.$overlay.classList.add('hidden');
    }
  }

  // ── Collapsible section toggle (Stellar, Journey, Story, Actions) ──
  _wireCollapsibleCards() {
    const cardIds = ['card-stellar', 'card-journey', 'card-story', 'card-actions'];

    cardIds.forEach((cardId) => {
      const card = document.getElementById(cardId);
      if (!card) return;

      // Find the toggle button inside this card's header
      const btn = card.querySelector('.imm-toggle-btn');
      if (!btn) return;

      const toggle = (e) => {
        e.stopPropagation();   // prevent header getting the event too
        e.preventDefault();    // prevent any scroll/zoom on mobile
        const isCollapsed = card.classList.toggle('collapsed');
        btn.textContent = isCollapsed ? '▶' : '▼';
        btn.title = isCollapsed ? 'Show' : 'Hide';
      };

      // Both click (desktop) and touchend (mobile) for reliability
      btn.addEventListener('click',    toggle, { passive: false });
      btn.addEventListener('touchend', toggle, { passive: false });
    });
  }

  _bindEvents() {
    if (this.$closeBtn) {
      this.$closeBtn.addEventListener('click', () => this.close());
    }
    
    if (this.$btnAutoRotate) {
      this.$btnAutoRotate.addEventListener('click', () => {
        this.isRotating = !this.isRotating;
        this.app.renderer.controls.autoRotate = this.isRotating;
        this.$btnAutoRotate.style.color = this.isRotating ? '#38bdf8' : '#cbd5e1';
      });
    }

    if (this.$btnReset) {
      this.$btnReset.addEventListener('click', () => {
        if (this.activeStar) {
          this.app.renderer.viewStar3D(this.activeStar);
        }
      });
    }

    if (this.$btnComet) {
      this.$btnComet.addEventListener('click', () => {
        // Button is only clickable when unlocked via authorization
        if (this.app.renderer && this.app.renderer.triggerCinematicComet) {
          this.app.renderer.triggerCinematicComet();
        }
      });
    }

    if (this.$btnFly) {
      this.$btnFly.addEventListener('click', () => {
        if (this.activeStar) {
          const targetStar = this.activeStar;
          this.close(false); // Hide UI
          
          if (!this.journeySim) {
             this.journeySim = new JourneySimulator(this.app.renderer, 'journey-ui-layer');
          }
          this.journeySim.startJourney(targetStar);
        }
      });
    }

    if (this.$btnExplode) {
      this.$btnExplode.addEventListener('click', () => {
        if (this.activeStar) {
          const targetStar = this.activeStar;
          // Do not close with resetCamera, just hide UI so we can watch the explosion
          this.close(false);
          this.app.renderer.triggerSupernova(targetStar);
        }
      });
    }
  }

  open(starData) {
    this.activeStar = starData;
    
    // Hide standard UI elements robustly via CSS
    document.body.classList.add('is-immersive-view');

    // Generate procedural data since we don't have all DB fields
    const proceduralData = this._generateProceduralData(starData);

    // Get registration info
    const reg = this.app.ui && this.app.ui.registeredStars && this.app.ui.registeredStars[starData.id];
    let displayName = starData.name || 'Unknown Star';
    if (reg && reg.starName) {
      displayName = reg.starName;
    }

    // Populate UI
    if (this.$starName) this.$starName.textContent = displayName;
    if (this.$starType) this.$starType.textContent = proceduralData.fullType;
    
    // Add owner details to fact/story if registered
    if (reg && reg.owner) {
      proceduralData.fact = `⭐ PREMIUM STAR: Owned by ${reg.owner}. ${reg.message ? `"${reg.message}"` : ''}`;
    }
    
    if (this.$dataId) this.$dataId.textContent = starData.id || `HIP ${starData.hip}`;
    if (this.$dataDist) this.$dataDist.textContent = `${starData.dist ? starData.dist.toFixed(1) : '?'} ly`;
    if (this.$dataTemp) this.$dataTemp.textContent = `${proceduralData.temp} K`;
    if (this.$dataMass) this.$dataMass.textContent = `${proceduralData.mass} M☉`;
    if (this.$dataLum) this.$dataLum.textContent = `${proceduralData.lum} L☉`;
    if (this.$dataRad) this.$dataRad.textContent = `${proceduralData.rad} R☉`;
    if (this.$dataClass) this.$dataClass.textContent = proceduralData.spectralClass;

    if (this.$storyText) this.$storyText.textContent = proceduralData.story;
    if (this.$storyFact) this.$storyFact.textContent = proceduralData.fact;

    // ── Populate Mobile Bottom Sheet ──────────────────────────
    const mobId    = document.getElementById('mob-data-id');
    const mobDist  = document.getElementById('mob-data-dist');
    const mobTemp  = document.getElementById('mob-data-temp');
    const mobClass = document.getElementById('mob-data-class');
    const mobMass  = document.getElementById('mob-data-mass');
    const mobRad   = document.getElementById('mob-data-rad');
    const mobLum   = document.getElementById('mob-data-lum');
    const mobStory = document.getElementById('mob-story-text');
    const mobFact  = document.getElementById('mob-story-fact');

    if (mobId)    mobId.textContent    = starData.id || `HIP ${starData.hip}`;
    if (mobDist)  mobDist.textContent  = `${starData.dist ? starData.dist.toFixed(1) : '?'} ly`;
    if (mobTemp)  mobTemp.textContent  = `${proceduralData.temp} K`;
    if (mobClass) mobClass.textContent = proceduralData.spectralClass;
    if (mobMass)  mobMass.textContent  = `${proceduralData.mass} M☉`;
    if (mobRad)   mobRad.textContent   = `${proceduralData.rad} R☉`;
    if (mobLum)   mobLum.textContent   = `${proceduralData.lum} L☉`;
    if (mobStory) mobStory.textContent = proceduralData.story;
    if (mobFact)  mobFact.textContent  = proceduralData.fact;

    // Wire mobile action buttons (only once)
    this._wireMobileButtons();

    // Reset sheet state: fully collapsed + pull tab + zoom controls visible
    const sheet       = document.getElementById('mobile-details-sheet');
    const pullTab     = document.getElementById('mob-pull-tab');
    const zoomCtrls   = document.getElementById('mob-zoom-controls');
    if (sheet)     sheet.classList.remove('expanded');
    if (pullTab)   pullTab.classList.remove('hidden');
    if (zoomCtrls) zoomCtrls.style.display = 'flex'; // show zoom buttons

    // Ensure overlay element exists before showing
    if (!this.$overlay) {
      this.$overlay = document.getElementById('immersive-star-overlay');
    }
    if (this.$overlay) {
      this.$overlay.classList.remove('hidden');
      // Use .open class for CSS-driven visibility (fixes default-visible bug)
      this.$overlay.classList.add('open');
    }

    // Command Renderer to focus on star
    this.app.renderer.viewStar3D(starData);
    
    // Tweak renderer for immersive mode
    this.app.renderer.controls.autoRotate = true;
    this.app.renderer.controls.autoRotateSpeed = 0.5;
    this.isRotating = true;
    if (this.$btnAutoRotate) this.$btnAutoRotate.style.color = '#38bdf8';
  }

  close(resetCamera = true) {
    if (!this.$overlay) {
      this.$overlay = document.getElementById('immersive-star-overlay');
    }
    if (this.$overlay) {
      this.$overlay.classList.remove('open'); // Hide via CSS class
      this.$overlay.classList.add('hidden');  // Extra safety
    }

    // Hide mobile pull tab, sheet, and zoom controls on close
    const pullTab2  = document.getElementById('mob-pull-tab');
    const sheet2    = document.getElementById('mobile-details-sheet');
    const zoomCtrls = document.getElementById('mob-zoom-controls');
    if (pullTab2)  pullTab2.classList.add('hidden');
    if (sheet2)    sheet2.classList.remove('expanded');
    if (zoomCtrls) zoomCtrls.style.display = 'none';

    // Cache the star if we need it for an action before nulling
    const prevStar = this.activeStar;
    this.activeStar = null;

    this.isRotating = false;
    this.app.renderer.controls.autoRotate = false;

    // Show standard UI elements
    document.body.classList.remove('is-immersive-view');

    if (resetCamera) {
      this.app.renderer.resetView();
    }
  }

  _generateProceduralData(star) {
    // Attempt to import or use real star info if available
    const mainClass = star.type ? star.type.charAt(0) : 'G';
    
    let temp = 5800;
    let mass = 1.0;
    let lum = 1.0;
    let rad = 1.0;
    let fullType = 'Main Sequence Star';
    let story = 'A distant star shining quietly in the cosmos.';
    let fact = 'Stars like this are common throughout the Milky Way.';

    switch(mainClass) {
      case 'O': temp=30000; mass=16; lum=30000; rad=10; fullType='Blue Supergiant'; story='A massive, incredibly hot blue star burning furiously.'; fact='O-type stars have very short lifespans, ending in brilliant supernovae.'; break;
      case 'B': temp=15000; mass=5; lum=100; rad=4; fullType='Blue-White Star'; story='A brilliant blue-white luminary, radiating immense energy.'; fact='Often found in young star clusters and OB associations.'; break;
      case 'A': temp=8000; mass=2; lum=20; rad=1.5; fullType='White Star'; story='A bright white star, often visible to the naked eye.'; fact='Sirius and Vega are famous examples of A-type stars.'; break;
      case 'F': temp=6500; mass=1.2; lum=3; rad=1.2; fullType='Yellow-White Star'; story='A slightly hotter cousin to our Sun, glowing with a bright golden-white hue.'; fact='F-type stars possess habitable zones that are wider than our Sun.'; break;
      case 'G': temp=5500; mass=1; lum=1; rad=1; fullType='Yellow Dwarf'; story='A stable, long-lived star, similar to Earth\'s Sun.'; fact='G-type stars are prime candidates for hosting Earth-like planets.'; break;
      case 'K': temp=4000; mass=0.7; lum=0.2; rad=0.8; fullType='Orange Dwarf'; story='A cool, reddish-orange star, slowly burning its fuel over billions of years.'; fact='K-type dwarfs are considered excellent candidates for extraterrestrial life due to their long stable lifespans.'; break;
      case 'M': temp=3000; mass=0.3; lum=0.01; rad=0.3; fullType='Red Dwarf'; story='A small, dim red star, the most common type of star in the universe.'; fact='Red dwarfs can live for trillions of years, far longer than the current age of the universe.'; break;
    }

    // Adjust with actual data if available
    let realTemp = temp + Math.floor(Math.random() * 500) - 250;
    
    // We can try to use some actual UI data
    const uiDataClass = star.type || mainClass + ' V';

    return {
      temp: realTemp,
      mass: (mass + (Math.random() * 0.2 - 0.1)).toFixed(2),
      lum: (lum + (Math.random() * lum * 0.1)).toFixed(2),
      rad: (rad + (Math.random() * 0.1)).toFixed(2),
      spectralClass: uiDataClass,
      fullType,
      story,
      fact
    };
  }

  // ── Mobile bottom-sheet button wiring (runs once) ───────────
  _wireMobileButtons() {
    if (this._mobileButtonsBound) return;
    this._mobileButtonsBound = true;

    // Helper: fire callback on tap (click OR touchend, not both)
    const tap = (el, fn) => {
      if (!el) return;
      let didTouch = false;
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        didTouch = true;
        fn(e);
        setTimeout(() => { didTouch = false; }, 400);
      }, { passive: false });
      el.addEventListener('click', (e) => {
        if (!didTouch) fn(e);
      });
    };

    const sheet   = document.getElementById('mobile-details-sheet');
    const pullTab = document.getElementById('mob-pull-tab');
    const handle  = document.getElementById('mobile-sheet-toggle');

    // "View All Details" button → open sheet, hide button
    tap(pullTab, () => {
      if (sheet)   sheet.classList.add('expanded');
      if (pullTab) pullTab.classList.add('hidden');
    });

    // Handle bar → close sheet, show button again
    tap(handle, () => {
      if (sheet)   sheet.classList.remove('expanded');
      if (pullTab) pullTab.classList.remove('hidden');
    });

    // ── Zoom In (+) ──
    const zoomIn  = document.getElementById('mob-zoom-in');
    const zoomOut = document.getElementById('mob-zoom-out');

    // Single tap zoom
    tap(zoomIn,  () => this.app.renderer.zoomTowardsSelected(true));
    tap(zoomOut, () => this.app.renderer.zoomTowardsSelected(false));

    // Long-press continuous zoom
    const startContinuousZoom = (el, isIn) => {
      let interval = null;
      const stop = () => { clearInterval(interval); interval = null; };
      el.addEventListener('touchstart', () => {
        interval = setInterval(() => this.app.renderer.zoomTowardsSelected(isIn), 80);
      }, { passive: true });
      el.addEventListener('touchend',    stop, { passive: true });
      el.addEventListener('touchcancel', stop, { passive: true });
    };
    if (zoomIn)  startContinuousZoom(zoomIn,  true);
    if (zoomOut) startContinuousZoom(zoomOut, false);

    // Auto Rotate
    tap(document.getElementById('mob-btn-rotate'), () => {
      this.isRotating = !this.isRotating;
      this.app.renderer.controls.autoRotate = this.isRotating;
      const btn = document.getElementById('mob-btn-rotate');
      if (btn) btn.style.color = this.isRotating ? '#38bdf8' : '';
    });

    // Reset View
    tap(document.getElementById('mob-btn-reset'), () => {
      if (this.activeStar) this.app.renderer.viewStar3D(this.activeStar);
    });

    // Explode Star
    tap(document.getElementById('mob-btn-explode'), () => {
      if (this.activeStar) {
        const target = this.activeStar;
        this.close(false);
        this.app.renderer.triggerSupernova(target);
      }
    });

    // Fly To Star
    tap(document.getElementById('mob-btn-fly'), () => {
      if (this.activeStar) {
        const target = this.activeStar;
        this.close(false);
        if (!this.journeySim) {
          import('./JourneySimulator.js').then(mod => {
            this.journeySim = new mod.JourneySimulator(this.app.renderer, 'journey-ui-layer');
            this.journeySim.startJourney(target);
          });
        } else {
          this.journeySim.startJourney(target);
        }
      }
    });
  }
}
