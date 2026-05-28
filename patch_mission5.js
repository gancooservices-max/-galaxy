import fs from 'fs';
let code = fs.readFileSync('src/MissionSimulator.js', 'utf8');

// 1. Separate timeline CSS and update HUD CSS for responsiveness and polish
const newCSS = `
      .mission-timeline {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 90vw;
        max-width: 800px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(10, 16, 28, 0.65);
        border: 1px solid rgba(0, 212, 255, 0.2);
        border-radius: 8px;
        padding: 10px 15px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 10000;
        animation: hudFadeInDown 0.4s ease;
      }
      @keyframes hudFadeInDown {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      .isro-hud {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 400px;
        max-width: 90vw;
        background: rgba(10, 16, 28, 0.75);
        border: 1px solid rgba(0, 212, 255, 0.25);
        border-radius: 12px;
        padding: 16px 20px;
        color: #ffffff;
        font-family: 'Inter', sans-serif;
        z-index: 10000;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 16px 40px rgba(0,0,0,0.6);
        display: flex;
        flex-direction: column;
        gap: 16px;
        animation: hudFadeIn 0.3s ease;
      }
      @media (max-width: 768px) {
        .isro-hud {
          bottom: 15px;
          right: 50%;
          transform: translateX(50%);
          width: 95vw;
          padding: 12px;
        }
        .mission-timeline {
          flex-wrap: wrap;
          justify-content: center;
          gap: 4px;
        }
        .chain-node { font-size: 9px !important; padding: 2px 6px !important; }
      }
      @keyframes hudFadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .hud-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        padding-bottom: 8px;
      }
      .hud-header h2 {
        margin: 0;
        font-size: 13px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        font-weight: 600;
        color: #00d4ff;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .hud-beacon {
        width: 8px; height: 8px;
        background: #00ff66;
        border-radius: 50%;
        animation: pulseBeacon 1.2s infinite alternate;
        box-shadow: 0 0 8px #00ff66;
      }
      @keyframes pulseBeacon {
        from { opacity: 0.3; transform: scale(0.8); }
        to { opacity: 1.0; transform: scale(1.2); }
      }
      .chain-node {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.03em;
        color: rgba(255,255,255,0.4);
        padding: 4px 10px;
        border-radius: 4px;
        background: rgba(255,255,255,0.03);
        border: 1px solid transparent;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        position: relative;
      }
      .chain-node.active {
        color: #ffffff;
        background: rgba(0, 212, 255, 0.15);
        border-color: rgba(0, 212, 255, 0.4);
        box-shadow: 0 0 12px rgba(0,212,255,0.15);
        transform: scale(1.05);
      }
      .chain-node.done {
        color: rgba(0, 255, 102, 0.85);
        background: rgba(0, 255, 102, 0.05);
        border-color: rgba(0, 255, 102, 0.2);
      }
      .hud-main-grid {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .hud-telemetry {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      .tel-box {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.05);
        padding: 10px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      .tel-box.status-box {
        grid-column: span 3;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 212, 255, 0.05);
        border-color: rgba(0, 212, 255, 0.15);
      }
      .tel-lbl {
        font-size: 9px;
        text-transform: uppercase;
        color: rgba(255,255,255,0.45);
        letter-spacing: 0.05em;
        margin-bottom: 4px;
        font-weight: 600;
      }
      .tel-val {
        font-family: 'Courier New', Courier, monospace;
        font-size: 15px;
        font-weight: 700;
        color: #00ffaa;
      }
      .hud-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        align-items: center;
      }
      .hud-btn {
        padding: 8px 16px;
        background: #e65c00;
        border: 1px solid #ff7a24;
        border-radius: 6px;
        color: white;
        font-weight: bold;
        cursor: pointer;
        pointer-events: auto;
        transition: all 0.25s ease;
        font-size: 11px;
        text-transform: uppercase;
        box-shadow: 0 4px 14px rgba(230, 92, 0, 0.2);
        letter-spacing: 0.03em;
      }
      .hud-btn:hover:not(:disabled) {
        background: #ff6a00;
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(230, 92, 0, 0.35);
      }
      .hud-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
      }
      .hud-btn.sec {
        background: rgba(255,255,255,0.06);
        border-color: rgba(255,255,255,0.15);
        color: rgba(255,255,255,0.7);
        box-shadow: none;
      }
      .hud-btn.sec:hover {
        background: rgba(255,255,255,0.15);
        color: #ffffff;
      }
`;

const htmlRegex = /this\.styleEl\.innerHTML = \`[\s\S]*?\`;/m;
code = code.replace(htmlRegex, \`this.styleEl.innerHTML = \\\`\n\${newCSS}\n    \\\`;\`);

// 2. Separate DOM structure
const oldDOM = /<div class="hud-progress-chain">[\s\S]*?<\/div>\s*<div class="hud-main-grid">/;
code = code.replace(oldDOM, \`
      <div class="hud-main-grid">\`);

const uiHTMLRegex = /this\.overlayEl\.innerHTML = \`([\s\S]*?)\`;/m;
let match = code.match(uiHTMLRegex);
if(match) {
  let innerHTML = match[1];
  let newHTML = \`
      <div class="mission-timeline">
        <span class="chain-node active" id="node-1">Launch Pad</span>
        <span class="chain-node" id="node-2">Ascent</span>
        <span class="chain-node" id="node-3">Orbit</span>
        <span class="chain-node" id="node-4">Transfer</span>
        <span class="chain-node" id="node-5">Capture</span>
        <span class="chain-node" id="node-6">Landing</span>
        <span class="chain-node" id="node-7">Explore</span>
      </div>
      \` + innerHTML;
      
  // Update telemetry HTML to use new grid structure
  newHTML = newHTML.replace(/<div class="hud-telemetry">[\s\S]*?<\/div>\s*<div class="hud-actions">/, 
  \`<div class="hud-telemetry">
          <div class="tel-box">
            <div class="tel-lbl">Velocity</div>
            <div class="tel-val" id="tel-velocity">0.00 km/s</div>
          </div>
          <div class="tel-box">
            <div class="tel-lbl">Altitude</div>
            <div class="tel-val" id="tel-altitude">0.00 km</div>
          </div>
          <div class="tel-box">
            <div class="tel-lbl">Propellant</div>
            <div class="tel-val" id="tel-fuel">100.0 %</div>
          </div>
          <div class="tel-box status-box">
            <div class="tel-lbl">Status</div>
            <div class="tel-val" style="color: #00d4ff; font-size: 13px; text-shadow: 0 0 5px rgba(0,212,255,0.4);" id="tel-status">Systems Check OK. Ready.</div>
          </div>
        </div>
        <div class="hud-actions">\`);
        
  code = code.replace(uiHTMLRegex, \`this.overlayEl.innerHTML = \\\`\${newHTML}\\\`;\`);
}

// 3. Cinematic Camera Polishing
// Wide Cam framing
code = code.replace(
  \`const camPos = centerPoint.clone().addScaledVector(sideDir, 280.0).add(new THREE.Vector3(0, 40.0, 0));\`,
  \`const camPos = centerPoint.clone().addScaledVector(sideDir, 220.0).add(new THREE.Vector3(20.0, 45.0, -10.0));\`
);

// Rocket Cam Offset (Move target slightly above rocket for better rule of thirds)
code = code.replace(
  \`this.renderer.controls.target.copy(this.rocket.position);\`,
  \`this.renderer.controls.target.copy(this.rocket.position).add(new THREE.Vector3(0, 0.05, 0));\`
);
code = code.replace(
  \`const camOffset = new THREE.Vector3(0.12, 0.06, -0.24); // Scaled for 0.08 rocket\`,
  \`const camOffset = new THREE.Vector3(0.1, 0.04, -0.2); // Closer cinematic tracking shot\`
);

// Landing Descent Cam (smoother framing)
code = code.replace(
  \`const camOffset = new THREE.Vector3(2.5 - tDesc * 1.5, 0.8 - tDesc * 0.4, 4.0 - tDesc * 2.5); // zoom in close\`,
  \`const camOffset = new THREE.Vector3(2.5 - tDesc * 1.8, 1.2 - tDesc * 0.7, 3.5 - tDesc * 2.2); // Sweeping descent track\`
);

fs.writeFileSync('src/MissionSimulator.js', code);
console.log('Patch 5 applied!');
