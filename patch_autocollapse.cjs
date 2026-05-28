const fs = require('fs');

let main = fs.readFileSync('src/main.js', 'utf8');

const replacementLogic = `
  const btnCollapse = document.getElementById('menu-collapse-btn');
  const menuItems = document.getElementById('corner-menubar-items');
  
  function collapseMenu() {
    if (menuItems && menuItems.style.display !== 'none') {
      menuItems.style.display = 'none';
      if (btnCollapse) btnCollapse.textContent = '▲';
    }
  }

  if (btnCollapse && menuItems) {
    btnCollapse.addEventListener('click', () => {
      if (menuItems.style.display === 'none') {
        menuItems.style.display = 'flex';
        btnCollapse.textContent = '▼';
      } else {
        collapseMenu();
      }
    });
  }
`;

// Replace the top part of the corner menubar logic
const oldTopLogicRegex = /const btnCollapse = document\.getElementById\('menu-collapse-btn'\);[\s\S]*?btnCollapse\.textContent = '▲';\n\s*}\n\s*}\);\n\s*}/m;
if (oldTopLogicRegex.test(main)) {
  main = main.replace(oldTopLogicRegex, replacementLogic);
} else {
  console.log("Could not find top logic");
}

// Inject collapseMenu() into btnBh click handler
main = main.replace(/if \(overlay\) overlay\.style\.display = 'none';\n\s*}/g, "if (overlay) overlay.style.display = 'none';\n      }\n      collapseMenu();");

// Inject collapseMenu() into btnStars click handler
main = main.replace(/if \(ui\) ui\.style\.display = 'none';\n\s*}/g, "if (ui) ui.style.display = 'none';\n      }\n      collapseMenu();");

// Inject collapseMenu() into btnChandra click handler
main = main.replace(/existingBtn\.click\(\);\n\s*}/g, "existingBtn.click();\n      }\n      collapseMenu();");

// Inject collapseMenu() into btnSolar click handler
main = main.replace(/else renderer\._isCinematicFlight = false;\n\s*};\n\s*requestAnimationFrame\(flyAnim\);/g, "else renderer._isCinematicFlight = false;\n      };\n      requestAnimationFrame(flyAnim);\n      collapseMenu();");

fs.writeFileSync('src/main.js', main);
