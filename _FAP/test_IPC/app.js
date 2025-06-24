/** @typedef {import('pear-interface')} */ /* global Pear */

// click headline easter-egg
const headline = document.querySelector('h1')
headline.addEventListener('click', e => { e.target.textContent = '🍐' })

// UI — ping & move buttons
const btn = document.getElementById('pingBtn')
btn?.addEventListener('click', () => {
  console.log('sending ping -> main')
  Pear.message({ type: 'ping' })
})

// When main (or any view) echoes back a pong we show it
Pear.messages({ type: 'pong' }, () => {
  console.log('<- pong')
  headline.textContent = 'pong 🏓'
})

// Renderer no longer responds to incoming ping – we let the main process
// reply so we can see its log in the terminal.

// hot-reload in dev
// Move button
const moveBtn = document.getElementById('moveBtn')
moveBtn?.addEventListener('click', () => {
  console.log('requesting window move')
  Pear.message({ type: 'ctrl', action: 'move', dx: 100, dy: 100 })
})

Pear.updates(() => Pear.reload());

// Universal IPC logger – logs every message the renderer receives
Pear.messages({}, (msg) => {
  console.log('[Renderer saw]', msg)
})

// --- Diagnostic Ping helper -------------------------------------------
// We inject a button that lets us send a uniquely typed ping so we can
// trace whether the message leaves the renderer and (ideally) comes back.
const diagBtn = document.createElement('button')
diagBtn.id = 'diagBtn'
diagBtn.textContent = 'Diag Ping'
// place it next to existing buttons
const bar = document.getElementById('pingBtn')?.parentElement || document.body
bar.appendChild(diagBtn)

diagBtn.addEventListener('click', () => {
  console.log('sending diagnostic-ping')
  Pear.message({ type: 'diagnostic-ping', ts: Date.now() })
})
