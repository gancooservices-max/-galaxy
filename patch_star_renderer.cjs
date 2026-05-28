const fs = require('fs');
let content = fs.readFileSync('src/StarRenderer.js', 'utf8');

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// ── Real-time Earth Rotation (UTC-based for correct day/night) ──')) {
    // Insert the wrapper condition right after if (this.earth) {
    if (lines[i+1].includes('if (this.earth) {')) {
      lines.splice(i+2, 0, '        if (!(this.missionSimulator && this.missionSimulator.active && this.missionSimulator.stage < 2)) {');
      break;
    }
  }
}

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('this.earth.rotation.y = -gmst_rad;')) {
    lines.splice(i+1, 0, '        }');
    break;
  }
}

fs.writeFileSync('src/StarRenderer.js', lines.join('\n'));
console.log('Fixed StarRenderer.js');
