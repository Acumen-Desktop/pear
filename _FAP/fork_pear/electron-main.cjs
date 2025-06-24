// Pear Minimal Fork: electron-main.js
// This file reuses all upstream Pear/Electron logic, but allows you to inject custom preload scripts and main process hooks.
// To extend: modify the preload path or add hooks below as needed.

console.log('FORKED electron-main.js loaded');
'use strict'
const path = require('path')
const electron = require('electron')
const { isWindows, isMac, isLinux } = require('which-runtime')
const { command } = require('paparam')
const State = require('../../state')
// (Patched: do not require GUI here, follow Pear upstream structure)
const crasher = require('../../lib/crasher')
const tryboot = require('../../lib/tryboot')
const { SWAP, SOCKET_PATH, CONNECT_TIMEOUT } = require('../../constants')
const runDefinition = require('../../def/run')

// --- Custom Preload Injection ---
// Set this to your custom preload script (relative to this file)
// --- Custom Preload Injection ---
const customPreload = path.join(__dirname, 'preload.js')
process.env.PEAR_CUSTOM_PRELOAD = customPreload
// --- End Custom Patch ---

// --- Upstream Pear Logic ---
const argv = (process.argv.length > 1 && process.argv[1][0] === '-') ? process.argv.slice(1) : process.argv.slice(2)
const runix = argv.indexOf('--run')
if (runix > -1) argv.splice(runix, 1)

configureElectron()
const { ipcMain } = electron
ipcMain.handle('message', async (evt, msg) => {
  if (msg && msg.type === 'ping') {
    console.error('🍌 MAIN received ping (ipcMain)')
    return { type: 'pong' }
  }
})
crasher('electron-main', SWAP, argv.indexOf('--log') > -1)
const run = command('run', ...runDefinition, electronMain)
run.parse(argv)
run.running?.catch(console.error)

async function electronMain (cmd) {
  const state = new State({
    link: cmd.args.link.replace('_||', '://'),
    flags: cmd.flags,
    args: cmd.rest
  })
  State.storage(state)
  if (state.error) {
    console.error(state.error)
    electron.app.quit(1)
    return
  }
  const gui = new GUI({
    socketPath: SOCKET_PATH,
    connectTimeout: CONNECT_TIMEOUT,
    tryboot,
    state,
    // Pass custom preload to GUI if supported
    customPreload: process.env.PEAR_CUSTOM_PRELOAD
  })
  await gui.ready()
  // (You can add more hooks here)
  if (await gui.ipc.wakeup(state.link, state.storage, state.key === null ? state.dir : null, state.link?.startsWith('pear://dev'), state.flags.startId)) {
    electron.app.quit(0)
    return
  }
  electron.ipcMain.on('send-to', (e, id, channel, message) => { electron.webContents.fromId(id)?.send(channel, message) })
  if (cmd.flags.appName) {
    electron.app.setName(cmd.flags.appName)
  }
  const app = await gui.app()
  app.unloading().then(async () => {
    await app.close()
  })
}

function configureElectron () {
  // (Same as upstream Pear)
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  electron.protocol.registerSchemesAsPrivileged([
    { scheme: 'file', privileges: { secure: true, bypassCSP: true, corsEnabled: true, supportFetchAPI: true, allowServiceWorkers: true } }
  ])
  electron.app.commandLine.appendSwitch('disable-features', 'WindowCaptureMacV2')
  electron.app.commandLine.appendSwitch('allow-loopback-in-peer-connection')
  if (isLinux && process.env.XDG_SESSION_TYPE === 'wayland') {
    electron.app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer,WaylandWindowDecorations')
    electron.app.commandLine.appendSwitch('ozone-platform-hint', 'auto')
  }
}
