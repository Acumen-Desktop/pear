// Pear Minimal Fork: preload.js
// This file runs all upstream Pear preload logic, but you can add custom logic below.

console.log("Line 4 custom preload.js loaded");

const path = require("path");

// --- Upstream Pear preload logic ---
require(path.join(__dirname, "../../gui/preload.js"));

// --- Custom Preload Hooks ---
// Add any privileged APIs or overrides below
// Example: expose a custom API to the renderer
window.customPearAPI = {
  hello: () => "Hello from custom preload!",
};
