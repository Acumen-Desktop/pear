## Tauri Migration Plan — Shared Runtime Concept

Goal: Replace Electron with a Tauri host while preserving “single shared runtime” and Sidecar-driven app delivery.

### Feasibility summary

- Tauri can host multiple windows and webviews; a single Tauri app could play the role of the shared desktop host.
- Sidecar HTTP and bundling can remain unchanged; Tauri windows would load the same Sidecar URLs.
- OS protocol handlers are supported in Tauri (deep link plugin / custom URL scheme per platform).
- Biggest differences: API surface (no nodeIntegration), security model, IPC bridging, multi-process vs single-process webviews.

### Architecture deltas

- Electron preload & Node APIs -> Tauri Commands + JS APIs
  - Replace nodeIntegration features with explicit commands invoked via @tauri-apps/api
  - Recreate Pear APIs exposed to renderer via a thin JS client that proxies to Sidecar over HTTP/IPC
- Webview isolation and CSP
  - Tauri uses system webviews (WKWebView/WebView2/WebKitGTK)
  - Ensure Sidecar HTTP headers (CORS) are compatible; likely need CORS enabled for Sidecar host
- Session/partitioning
  - Electron used partition='persist:pear' and per-app sessions; Tauri lacks explicit partitions
  - Emulate per-app storage by
    - unique window labels + custom cookie stores where supported
    - or route app storage paths via Sidecar instead of browser storage

### Shared runtime mechanics in Tauri

- Single Tauri binary “Pear Runtime (Tauri)”
- Windows are created per app with:
  - Custom user agent including Pear <client@start> to preserve Sidecar multiplexing
  - Load URL: `${sidecar}/~<entry>` (same as Electron)
- Wakeup/deep link
  - Use tauri-plugin-deep-link or platform code to capture owls:// or pear://
  - Forward to a running instance via Tauri Single Instance plugin; focus existing window or open new
- Applings registry
  - Keep Sidecar-side applings map unchanged; it will store path to the Tauri runtime app

### Challenges and mitigations

- Node APIs in renderer
  - Remove direct Node access; provide minimal API surface via Tauri commands or Sidecar HTTP
- Preload replacement
  - Move preload logic to a JS bootstrap loaded by each window; communicate with Sidecar over HTTP and with Tauri over invoke
- DevTools, chromium flags, WebRTC
  - Tauri exposes devtools in dev; for WebRTC loopback flags, may need OS-level or webview config per platform

### Migration steps

1. Spike a minimal Tauri host that loads Sidecar’s decal.html and a sample app entry via Sidecar URL
2. Implement deep link handler and Single Instance routing (focus existing window)
3. Inject custom UA with Pear <client@start> and verify Sidecar HTTP multiplexing works
4. Port preload bootstrap to a pure JS bootstrap; remove Node-only calls or replace with Tauri commands
5. Implement allowed-host filtering using webview request filter or within app bootstrap
6. Verify Keet/Runtime flows; iterate on CORS and headers from Sidecar HTTP

### Electron vs Tauri impacts on shared runtime

- Electron-specific features used:
  - nodeIntegration, BrowserView, partitioned sessions, custom protocol privileges
- Tauri equivalents:
  - No nodeIntegration; commands instead
  - Multiple windows; no BrowserView equivalent across all platforms — use windows or stacked webviews
  - URL scheme registration supported via plugins/platform config

