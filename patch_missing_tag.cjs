const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `
    <button id="menu-btn-solar" class="menu-btn">
      <span class="menu-icon">☀️</span>
      <span>Solar Data</span>
    </button>
  </div>
`;

if (html.includes(targetStr) && !html.includes('    </button>\n    </div>\n  </div>')) {
  const replacement = `
    <button id="menu-btn-solar" class="menu-btn">
      <span class="menu-icon">☀️</span>
      <span>Solar Data</span>
    </button>
    </div>
  </div>
`;
  html = html.replace(targetStr, replacement);
  fs.writeFileSync('index.html', html);
} else {
    console.log("Could not find the target string or already fixed.");
}
