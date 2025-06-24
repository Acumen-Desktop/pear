// Pear Minimal Fork: gui.js
// This is a patched copy of Pear's gui.js that allows custom preload injection via PEAR_CUSTOM_PRELOAD.

const path = require('path');
const electron = require('electron');

// ... (rest of the original imports and code)

// --- PATCH: Use custom preload if set ---
function getPreloadPath() {
  return process.env.PEAR_CUSTOM_PRELOAD || path.join(__dirname, 'preload.js');
}

// Find the section where BrowserWindow is created and patch webPreferences:
// (This is a simplified pseudo-snippet; actual code will match the original structure)

// Example (in the View or Window class):
// ...
// webPreferences: {
//   preload: getPreloadPath(),
//   ...
// }
// ...

// The rest of gui.js should remain unchanged, except for the preload path logic.

// NOTE: This is a template. You should copy the actual gui.js code here and patch only the preload path usage as described above.
