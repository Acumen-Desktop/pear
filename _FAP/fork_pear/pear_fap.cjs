#!/usr/bin/env node
// pear_fap.cjs: Custom Pear runner for forked runtime using Pear's distributed Electron
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// 1. Locate Pear's DESKTOP_RUNTIME binary
function findDesktopRuntime() {
  const platform = process.platform;
  const arch = process.arch;
  let binPath;
  if (platform === "darwin") {
    binPath = `by-arch/${platform}-${arch}/bin/Pear Runtime.app/Contents/MacOS/Pear Runtime`;
  } else if (platform === "linux") {
    binPath = `by-arch/${platform}-${arch}/bin/pear-runtime-app/pear-runtime`;
  } else if (platform === "win32") {
    binPath = `by-arch/${platform}-${arch}/bin/pear-runtime-app/Pear Runtime.exe`;
  } else {
    throw new Error("Unsupported platform: " + platform);
  }

  // 1. Search system-wide Pear app support dir (macOS example)
  const homedir = require("os").homedir();
  const supportDir =
    platform === "darwin"
      ? path.join(homedir, "Library", "Application Support", "Pear")
      : platform === "linux"
      ? path.join(homedir, ".local", "share", "Pear")
      : null;
  if (supportDir && fs.existsSync(supportDir)) {
    // Recursively search for binPath
    const findRecursively = (dir) => {
      let found = null;
      for (const entry of fs.readdirSync(dir)) {
        const abs = path.join(dir, entry);
        if (fs.statSync(abs).isDirectory()) {
          found = findRecursively(abs) || found;
        } else if (abs.endsWith(binPath)) {
          return abs;
        }
      }
      return found;
    };
    const found = findRecursively(supportDir);
    if (found) return found;
  }

  // 2. Fallback to project-relative search
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, binPath);
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error("Could not find Pear DESKTOP_RUNTIME (" + binPath + ")");
}

// 2. Find the forked electron-main.cjs
const forkRoot = __dirname;
const mainEntry = path.join(forkRoot, "electron-main.cjs");
if (!fs.existsSync(mainEntry)) {
  console.error("ERROR: electron-main.cjs not found in", forkRoot);
  process.exit(1);
}

// 3. Pass all CLI args (after the script name)
const userArgs = process.argv.slice(2);

// 4. Launch Pear's Electron runtime with the forked main
const desktopRuntime = findDesktopRuntime();
console.log(`Line 70 - [pear_fap] Launching with: ${desktopRuntime}`);

// Patch: resolve --link path to absolute if present
const updatedArgs = userArgs.map((arg, i) => {
  if (arg === '--link' && userArgs[i+1]) {
    const abs = path.isAbsolute(userArgs[i+1]) ? userArgs[i+1] : path.resolve(process.cwd(), userArgs[i+1]);
    return [arg, abs];
  }
  // skip the value after --link, handled above
  if (userArgs[i-1] === '--link') return null;
  return arg;
}).flat().filter(Boolean);

const result = spawnSync(desktopRuntime, updatedArgs, {
  stdio: "inherit",
  cwd: path.dirname(desktopRuntime),
  env: { ...process.env }, // Remove PEAR_FAP_MAIN for now
});

if (result.error) {
  console.error("[pear_fap] Failed to launch:", result.error);
  process.exit(1);
}
process.exit(result.status);
