const fs = require('fs');

// 1. Update index.html to add the Escape button inside the death screen
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('bh-escape-btn')) {
  // Replace the old simple text with a container holding text + button
  const oldContent = 'SPAGHETTIFICATION COMPLETE';
  const newContent = `
    <div style="text-align: center; pointer-events: auto;">
      <div style="margin-bottom: 30px;">SPAGHETTIFICATION COMPLETE</div>
      <button id="bh-escape-btn" style="padding: 15px 30px; font-size: 18px; font-family: monospace; font-weight: bold; cursor: pointer; background: black; color: white; border: 2px solid white; border-radius: 5px; text-transform: uppercase; transition: all 0.3s;">Return to Solar System</button>
    </div>
  `;
  html = html.replace(oldContent, newContent);
  // Also enable pointer-events on the blackhole-death container so the button can be clicked, but wait...
  // If we set pointer-events: auto on the container, it blocks interaction with the canvas even when invisible if display isn't none!
  // Oh! The old code has: pointer-events: none; opacity: 0;
  // We can leave pointer-events: none on the container, but set pointer-events: auto on the inner div.
  // Wait, if container is pointer-events: none, children with pointer-events: auto CAN receive clicks!
  fs.writeFileSync('index.html', html);
}

// 2. Add Event Listener to main.js
let main = fs.readFileSync('src/main.js', 'utf8');
if (!main.includes("document.getElementById('bh-escape-btn')")) {
  const escapeLogic = `
  const escapeBtn = document.getElementById('bh-escape-btn');
  if (escapeBtn) {
    escapeBtn.addEventListener('click', () => {
      // Teleport back to Earth
      renderer.camera.position.set(0, 50, 150);
      renderer.controls.target.set(0, 0, 0);
      
      // Instantly hide the death screen
      document.getElementById('blackhole-death').style.opacity = '0';
      
      // Turn off audio
      if (renderer.bhAudio) {
        renderer.bhAudio.setVolume(0);
      }
    });
  }
`;
  
  main = main.replace("bhBtn.addEventListener('click', () => {", escapeLogic + "\n  bhBtn.addEventListener('click', () => {");
  fs.writeFileSync('src/main.js', main);
}
