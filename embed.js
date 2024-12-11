// embed.js
const fs = require('fs');
const path = require('path');

// Paths to the files
const bundlePath = path.join(__dirname, 'dist', 'bundle.js');
const templatePath = path.join(__dirname, 'index.template.html');
const outputPath = path.join(__dirname, 'index.html');

// Read the bundled JavaScript
const bundle = fs.readFileSync(bundlePath, 'utf-8');

// Read the HTML template
let html = fs.readFileSync(templatePath, 'utf-8');

// Replace the placeholder with the bundled JavaScript
html = html.replace('${BUNDLE_JS_CONTENT}', bundle);

// Write the final index.html
fs.writeFileSync(outputPath, html);

console.log('index.html has been generated with embedded JavaScript.');
