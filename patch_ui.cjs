const fs = require('fs');

let uiCode = fs.readFileSync('src/UI.js', 'utf-8');

uiCode = uiCode.replace(
  `  hideLoading() {
    if (this.$loading) {
      this.$loading.style.opacity = '0';
      setTimeout(() => this.$loading.style.display = 'none', 500);
    }
  }`,
  `  hideLoading() {
    if (this.$loading) {
      this.$loading.style.opacity = '0';
      setTimeout(() => this.$loading.style.display = 'none', 500);
    }
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
    this.$btnDrive = document.getElementById('btn-drive');
    
    this.selectedLat = null;
    this.selectedLon = null;

    this.$closeMapBtn.addEventListener('click', () => this.closeMapModal());
    this.$btnDrive.addEventListener('click', () => {
      this.closeMapModal();
      if (this.onDriveSpaceship) this.onDriveSpaceship();
    });
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
      
      this.$mapCoords.textContent = \`Lat: \${this.selectedLat.toFixed(2)}°, Lon: \${this.selectedLon.toFixed(2)}°\`;
      
      this.$mapPin.style.left = \`\${x + this.$earthImg.offsetLeft}px\`;
      this.$mapPin.style.top = \`\${y + this.$earthImg.offsetTop}px\`;
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
  }

  closeMapModal() {
    this.$mapModal.classList.add('hidden');
  }`
);

fs.writeFileSync('src/UI.js', uiCode, 'utf-8');

console.log('UI.js patched');
