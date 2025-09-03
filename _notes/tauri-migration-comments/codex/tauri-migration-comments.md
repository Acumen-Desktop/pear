# Pear → Tauri Migration — Codex Comments

## Executive Summary

- Feasibility: High. A single Tauri host can replace the shared Electron runtime while Sidecar continues to serve/bundle apps. Windows load Sidecar HTTP routes as today.
- Primary work: Reimplement the desktop host (window mgmt, tray, deep links, wakeups, badging, minimal OS bridges) in Tauri and provide a JS “preload adapter” exposing the existing `Pear` API surface without Node.
- Highest risk areas: lack of Electron session partitions, no BrowserView equivalent, media/screen-capture parity, and replacing several Electron-specific window/IPC affordances.

## What Stays the Same

- Sidecar: replication, bundling, HTTP routing, trust gate, wakeup orchestration remain unchanged.
- App delivery: GUI windows load Sidecar URLs (`/~entry`, `+resolve`, `+platform-resolve`); `script-linker/runtime` can continue using XHR/fetch from the webview.
- Applings registry: Sidecar continues mapping app key → desktop runtime path; only the “runtime path” target changes to the Tauri app binary.

## Current Electron Anchors (to replicate or adapt)

- Deep link + wakeup: `url-handler.js`, `run.js`, and Electron main focus/route logic.
- Window/view lifecycle and session multiplexing: `gui/gui.js` creates windows/BrowserViews and sets User-Agent containing `Pear <client@start>`.
  - Reference: `gui/gui.js:1` and `electron-main.js:...`.
- Renderer bootstrap and Pear API exposure: `preload.js` builds platform/app script-linker runtimes, sets globals, and exposes `Pear` API via `gui/preload.js`.
  - References: `preload.js:1`, `gui/preload.js:1`.
- Network filtering and permissions: Electron `onBeforeRequest`, media access prompts, desktop capture (`desktopSources`).

## Tauri Architecture Shape

- Single host binary: A Tauri app acts as the shared desktop runtime, creating one `WebviewWindow` per Pear app. No BrowserView; use one window per app or a parent window plus a child app window.
- Session multiplexing: Preserve Sidecar’s UA-based routing by setting a per-window custom user agent (`Pear <client@start>`). Ensure Sidecar HTTP parses UA as it does today.
- Deep links: Register the `pear://` scheme and use a single-instance handler to focus/route to the right window or create a new one.
- IPC: Replace `electron.ipcRenderer.invoke`/events with Tauri commands and the JS `@tauri-apps/api` events. Minimize the command surface by pushing most logic through Sidecar HTTP and keeping a small set of window/OS bridges in Rust.

## Preload Adapter Strategy (minimally invasive)

- Goal: Keep Pear app code unchanged by re-exposing the same `Pear` API in the webview.
- Adapter: A small JS shim that mirrors `gui/preload.js`’s class surface but calls Tauri instead of Electron.
  - Map window ops (focus, blur, show/hide, minimize/maximize/fullscreen/restore, dimensions, close/quit) to `@tauri-apps/api/window` and `tauri::command` helpers.
  - Map tray/badge to Tauri system tray and badge plugins (see Risks).
  - Media access prompts: prefer standard `getUserMedia`/`getDisplayMedia` flows; expose only what is truly needed via commands.
  - Keep XHR/fetch-based `script-linker` code intact; ensure CORS permits Sidecar origins.

## Concrete Mappings (Electron → Tauri)

- BrowserView: Use separate `WebviewWindow` per app. No general-purpose BrowserView abstraction exists cross-platform in Tauri.
- User agent: Set per-window custom UA via `WebviewUrl`/builder configuration in Rust.
- Deep links: Use `tauri-plugin-deep-link` (v2) or platform-specific URL handler; forward to existing instance via `tauri-plugin-single-instance`.
- Window controls: `@tauri-apps/api/window` (`setFocus`, `maximize`, `toggleMaximize`, `minimize`, `close`, `isFullscreen`, etc.).
- Menus/shortcuts: Tauri menu API; accelerators supported; DevTools toggling available in dev.
- Tray and badging: Use `SystemTray` API and a badge plugin (community) for macOS Dock counts.
- External links: Use `@tauri-apps/api/shell.open`.
- DevTools: Dev-time only; for prod toggling, gate behind a dev config build flag.

## Sidecar/HTTP Considerations

- CORS: Ensure Sidecar HTTP sets appropriate `Access-Control-Allow-Origin` for the Tauri webview origins. Simplest: allow `http://127.0.0.1:*`/`http://localhost:*` used by Sidecar; or a narrower explicit origin if you fix the port.
- UA routing: Continue using the `Pear <client@start>` UA. Expose a per-window `startId` so Sidecar can multiplex sessions.

## Risks, Gaps, and Mitigations

- Session partitions: Electron used per-app partitions; Tauri lacks a first-class equivalent.
  - Mitigation: Avoid sensitive use of browser storage; prefer Sidecar-managed storage. Use distinct window labels and, where available, distinct cookie stores (platform-limited). Consider clearing storage on app close when isolation is required.
- BrowserView parity: Not available; move to one window per app or window + embedded webview composition.
- Media access (`getMediaAccessStatus`, `askForMediaAccess`, `desktopSources` in `gui/preload.js`):
  - Use standard `navigator.mediaDevices.getUserMedia`/`getDisplayMedia` where possible. Electron-specific desktopCapturer parity is not guaranteed; confirm platform behavior. Add Rust-side helpers only if necessary.
- Chromium flags (e.g., `allow-loopback-in-peer-connection`):
  - WebKit/WKWebView/WebView2 do not expose Chromium command-line features uniformly; assume this flag is not adjustable. Validate if still required; if yes, explore platform-specific workarounds.
- Protocol privileges: Electron’s `registerSchemesAsPrivileged` is not needed; Tauri allows secure remote content with allowlist and CSP.
- Badge/tray dark mode handling: Map to Tauri APIs; icons may need separate light/dark assets. Auto-detect via theme APIs.

## Code Touchpoints in This Repo

- `constants.js:DESKTOP_EXEC` — point to the packaged Tauri runtime name (per-OS); keep `RUNTIME_EXEC` and `WAKEUP_EXEC` as-is.
- `electron-main.js` — replaced by Tauri `src-tauri/src/main.rs`; CLI launch path (`run.js`) keeps spawning `DESKTOP_RUNTIME`.
- `gui/preload.js` — replace with a Tauri adapter that re-exports the same `Pear` API surface without direct `electron` calls.
- `gui/gui.js` — functionality moves to Rust (Tauri) for window lifecycle and IPC; keep menu shape/labels consistent in Tauri menu definitions.
- `url-handler.js` — superseded on macOS/Windows by Tauri configuration and deep-link plugin; Linux `.desktop` generation may remain as a backup if needed.

## Minimal PoC Plan

1) Scaffold `src-tauri` and create a single window that loads a Sidecar URL (e.g. `decal.html`) with a custom UA containing `Pear <client@start>`.
2) Add deep link + single instance; route incoming links to focus an existing window or spawn a new one.
3) Implement a tiny command set: focus/show/hide/min/max/fullscreen/close/version/badge. Verify basic Pear app lifecycle through Sidecar.
4) Port the preload adapter (JS) to expose `Pear` API used by current apps; leave Node-only features behind or reimplement narrowly via commands.
5) Validate CORS and UA multiplexing against Sidecar; iterate headers if needed.
6) Expand parity: tray, menu accelerators, notifications; assess media/screen-capture needs with a concrete app (e.g., Keet).

## Open Questions / Decision Log

- Do we need strict per-app persistent storage isolation beyond Sidecar? If yes, investigate per-profile data dirs per window on each platform.
- Is desktop/window capture required? If so, prototype `getDisplayMedia` UX and, if insufficient, explore a native plugin per platform.
- Production DevTools: do we need a controlled backdoor? If yes, compile a special dev build variant.
- Update channel: Pear updater remains Sidecar-driven; clarify whether Tauri runtime updates come via Sidecar or OS installers.

## References in Code

- `preload.js:1` — script-linker bootstrapping and Electron preload behavior to mirror in Tauri adapter.
- `gui/preload.js:1` — IPC- and window-facing `Pear` API to emulate via Tauri commands.
- `gui/gui.js:1` — window creation, devtools toggling, menu wiring to translate to Tauri menu.
- `electron-main.js:1` — runtime entry that moves to Tauri Rust; keep CLI boot logic in `run.js` unchanged.
- `url-handler.js:1` — superseded by Tauri deep-link registration; Linux path can remain as fallback.

## Suggested Next Repos/Docs (validated)

- Tauri v2 docs: https://v2.tauri.app
- Plugins workspace (deep-link, single-instance, badge, etc.): https://github.com/tauri-apps/plugins-workspace

---

If you want, I can scaffold `src-tauri` with a minimal window loading the Sidecar URL and a tiny command bridge to kick off the PoC.

