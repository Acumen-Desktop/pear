# Deep links and custom protocol for FAP (macOS first)

How the fap:// link and the fap://app/<id>/<path> custom protocol work in a Tauri runtime.

## Deep link registration

macOS (phase 1)
- CFBundleURLTypes with scheme "fap"; app activation handler
- Flow: parse URL → ensure daemon → daemon.start(link) → focus window → load fap://app/<id>/entry

Windows (phase 2)
- Registry HKEY_CLASSES_ROOT\fap with URL Protocol and command "...\FAP.exe" "%1"
- Single-instance handler; same flow using named pipe IPC

## Custom protocol fap://app/<id>/<path>
- Resolve id → manifest → file
- Read from store; verify sha256; set Content-Type; stream
- Directory/empty path → serve manifest.entry

Security (MVP)
- Reject path traversal; no external redirects by default
- Allow remote hosts only if in manifest.links.allowlist

Testing (macOS)
- open "fap://<app-id>/" launches app
- Fetches missing blobs via iroh; subsequent opens are instant

