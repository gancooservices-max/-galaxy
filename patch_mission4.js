import fs from 'fs';
let code = fs.readFileSync('src/MissionSimulator.js', 'utf8');

// Update stage 6 to 7 transition to show "End Mission" instead of disabled "Hold Status..."
code = code.replace(
  `// Landing Powered Descent
      this.stage = 7;
      this.timeInStage = 0.0;
      this._startThrusterSound();
      this.telemetry.fuel -= 18.0;
      actionBtn.textContent = 'Hold Status...';
      actionBtn.disabled = true;`,
  `// Landing Powered Descent
      this.stage = 7;
      this.timeInStage = 0.0;
      this._startThrusterSound();
      this.telemetry.fuel -= 18.0;
      actionBtn.textContent = 'End Mission';
      actionBtn.disabled = false;
      actionBtn.style.background = '#cc0000';
      actionBtn.style.borderColor = '#ff3333';`
);

// Add stage 7 handler in _handleNextAction to actually exit the mission
code = code.replace(
  `if (this.stage === 1) {`,
  `if (this.stage === 7) {
      // Exit mission completely and restore normal state
      const btn = document.getElementById('btn-mission');
      if (btn) {
        btn.click(); // This cleanly triggers the UI toggle which calls this.exit()
      } else {
        this.exit();
      }
      return;
    }
    
    if (this.stage === 1) {`
);

fs.writeFileSync('src/MissionSimulator.js', code);
console.log('Patch 4 successfully applied!');
