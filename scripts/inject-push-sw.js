#!/usr/bin/env node

/**
 * Post-build script to inject push notification handlers into service worker
 * Adds importScripts call to load sw-push.js into the generated sw.js
 */

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '../public/sw.js');
const IMPORT_LINE = "importScripts('/sw-push.js');";

// Read the generated service worker
let swContent = fs.readFileSync(SW_PATH, 'utf8');

// Check if already injected (avoid duplicate imports)
if (swContent.includes(IMPORT_LINE)) {
  console.log('✅ Push handlers already injected in service worker');
  process.exit(0);
}

// Inject importScripts at the beginning (after the first line)
const lines = swContent.split('\n');
lines.splice(1, 0, '', '// Load Web Push notification handlers', IMPORT_LINE, '');
swContent = lines.join('\n');

// Write back to file
fs.writeFileSync(SW_PATH, swContent, 'utf8');

console.log('✅ Successfully injected push handlers into service worker');
console.log(`   Added: ${IMPORT_LINE}`);
