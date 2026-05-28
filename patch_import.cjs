const fs = require('fs');
let c = fs.readFileSync('src/main.js', 'utf8');
if (!c.includes("import * as THREE")) {
  c = c.replace("import './style.css';", "import './style.css';\nimport * as THREE from 'three';");
  fs.writeFileSync('src/main.js', c);
}
