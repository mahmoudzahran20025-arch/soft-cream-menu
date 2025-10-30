#!/usr/bin/env node
/**
 * inject-build.js
 * Auto-inject React build files into parent index.html
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist/react-app');
const INDEX_HTML = path.join(__dirname, '../index.html');

console.log('🔧 Injecting React build files into index.html...\n');

// Read dist/react-app/index.html to extract asset paths
const reactIndexPath = path.join(DIST_DIR, 'index.html');

if (!fs.existsSync(reactIndexPath)) {
  console.error('❌ React build not found. Run `npm run build` first.');
  process.exit(1);
}

const reactIndexContent = fs.readFileSync(reactIndexPath, 'utf-8');

// Extract JS and CSS file paths (Vite uses /assets/ not ./assets/)
const jsMatch = reactIndexContent.match(/src="\/assets\/(index-[^"]+\.js)"/);
const cssMatch = reactIndexContent.match(/href="\/assets\/(index-[^"]+\.css)"/);

if (!jsMatch || !cssMatch) {
  console.error('❌ Could not find asset paths in React build.');
  console.log('\n📄 React index.html content:');
  console.log(reactIndexContent);
  process.exit(1);
}

const jsFile = jsMatch[1];
const cssFile = cssMatch[1];

console.log(`✅ Found JS:  ${jsFile}`);
console.log(`✅ Found CSS: ${cssFile}`);

// Read parent index.html
let parentIndexContent = fs.readFileSync(INDEX_HTML, 'utf-8');

// New injection code
const injection = `<!-- 🆕 React Mini-App Scripts (auto-injected) -->
<link rel="stylesheet" crossorigin href="./dist/react-app/assets/${cssFile}">
<script type="module" crossorigin src="./dist/react-app/assets/${jsFile}"></script>`;

// Check for placeholder or existing injection
const placeholder = '<div id="react-scripts-placeholder"></div>';
const existingInjectionRegex = /<!-- 🆕 React Mini-App Scripts \(auto-injected[^)]*\) -->[\s\S]*?<script type="module"[^>]*><\/script>/;

if (parentIndexContent.includes(placeholder)) {
  // First time injection
  parentIndexContent = parentIndexContent.replace(placeholder, injection);
  fs.writeFileSync(INDEX_HTML, parentIndexContent, 'utf-8');
  console.log('\n✅ Successfully injected React build into index.html!');
} else if (existingInjectionRegex.test(parentIndexContent)) {
  // Update existing injection
  parentIndexContent = parentIndexContent.replace(existingInjectionRegex, injection);
  fs.writeFileSync(INDEX_HTML, parentIndexContent, 'utf-8');
  console.log('\n✅ Successfully updated React build in index.html!');
} else {
  console.error('\n❌ Neither placeholder nor existing injection found in index.html');
  console.log('💡 Looking for: <div id="react-scripts-placeholder"></div>');
  process.exit(1);
}
