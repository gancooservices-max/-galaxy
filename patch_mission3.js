import fs from 'fs';
let code = fs.readFileSync('src/MissionSimulator.js', 'utf8');

// 1. Add soundEnabled flag
code = code.replace(
  `this.roverKeys = { w: false, a: false, s: false, d: false };`,
  `this.roverKeys = { w: false, a: false, s: false, d: false };\n    this.soundEnabled = true;`
);

// 2. Add mute/unmute UI button in _injectUI HTML
code = code.replace(
  `id="cam-wide">Wide Cam</button>`,
  `id="cam-wide">Wide Cam</button>\n            <button class="hud-btn sec" style="padding: 4px 6px; font-size: 12px; margin-left: 8px;" id="cam-mute" title="Toggle Sound">🔊</button>`
);

// 3. Attach mute button listener in _injectUI JS
code = code.replace(
  `if (btnWide) btnWide.onpointerdown = (e) => { e.stopPropagation(); this.activeCameraMode = 'Wide'; this._playBeep(); };`,
  `if (btnWide) btnWide.onpointerdown = (e) => { e.stopPropagation(); this.activeCameraMode = 'Wide'; this._playBeep(); };
    const btnMute = document.getElementById('cam-mute');
    if (btnMute) btnMute.onpointerdown = (e) => {
      e.stopPropagation();
      this.soundEnabled = !this.soundEnabled;
      btnMute.textContent = this.soundEnabled ? '🔊' : '🔇';
      if (!this.soundEnabled && this.thrusterGain && this.audioCtx) {
        this.thrusterGain.gain.linearRampToValueAtTime(0.0, this.audioCtx.currentTime + 0.1);
      } else if (this.soundEnabled && this.thrusterGain && this.audioCtx) {
        this.thrusterGain.gain.linearRampToValueAtTime(0.7, this.audioCtx.currentTime + 0.1);
      }
      this._playBeep();
    };`
);

// 4. Update _playBeep to respect soundEnabled
code = code.replace(
  `_playBeep() {
    if (!this.audioCtx) return;`,
  `_playBeep() {
    if (!this.audioCtx || !this.soundEnabled) return;`
);

// 5. Update _speakISRO to respect soundEnabled
code = code.replace(
  `_speakISRO(text) {
    if (!window.speechSynthesis) return;`,
  `_speakISRO(text) {
    if (!window.speechSynthesis || !this.soundEnabled) return;`
);

// 6. Update CSS to make panel much smaller and compact
code = code.replace(
  `width: 720px;`,
  `width: 380px;`
);

code = code.replace(
  `padding: 16px 20px;`,
  `padding: 12px 14px;`
);

// 7. Fix grid layout so telemetry wraps properly on small panel
code = code.replace(
  `.hud-main-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
      }`,
  `.hud-main-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }`
);

// 8. Make telemetry items wrap
code = code.replace(
  `.hud-telemetry {
        display: flex;
        gap: 15px;
        align-items: center;
      }`,
  `.hud-telemetry {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }`
);

code = code.replace(
  `font-size: 16px;`,
  `font-size: 14px;`
);

// 9. Remove redundant header text that takes up space
code = code.replace(
  `<h2><span class="hud-beacon"></span> ISRO Chandrayaan Flight Operations Control Center</h2>`,
  `<h2><span class="hud-beacon"></span> ISRO Mission Control</h2>`
);

fs.writeFileSync('src/MissionSimulator.js', code);
console.log('Patch 3 successfully applied!');
