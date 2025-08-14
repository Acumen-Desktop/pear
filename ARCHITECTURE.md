# The Pear Runtime

```
platform-dir:
  - MacOS - `~/Library/Application Support/pear`
  - Linux - `~/.config/pear`
  - Windows - `~\\AppData\\Roaming\\pear`

platform-dkey: discovery key for platform core

..appdata: application data files

swap: incremental integer dirname (default: 0) - incremented with `swap + 1 & 3`

[platform-dir]
  - /app-storage/by-dkey/[app-dkey]/[...appdata]
  - /app-storage/by-name/[app-name]/[...appdata]
  - /corestores/platform -- corestore (platform code base + cores per app)
  - /by-dkey/[platform-dkey]
  - /by-dkey/[platform-dkey]/[swap] <-- consistent snapshot, sparse representation of the drive with self-generated bootstrap
    - /by-arch/[os]-[arch]
      - /bin
        - /pear-runtime (mac|linux) | pear-runtime.exe (win)
        - /pear-runtime.lib (win only)
        - /pear-runtime-app (win|linux) | /Pear Runtime.app (mac) <-- the ui engine (will be deprecated in the future to just be a shared lib)
        - /Pear.app (mac) | pear.exe (win) | pear (linux) <-- the bootstrap app that registers links etc
      - /lib
        - pear.dylib (shared lib entry point)
        - ...
    - /boot.bundle <-- the bare bundle to spawn with the bare bin that can boot the rest (localdev: boot.js)
    - /prebuilds <-- native bundled prebuilds
  - /current -> symlink -> /by-dkey/[platform-dkey]/[swap]
  - /next -> symlink -> /by-dkey/[platform-dkey]/[swap] <-- Windows only, for atomic swap,
  - /bin - prefixed to PATH to enable pear executable and pear run [key] --save-command flow
    - /pear -> symlink -> ../current/by-arch/[os]-[arch]/bin/pear-runtime <-- linux/mac
    - /pear.cmd | pear.ps1 -> win cmd/powershell script wrapper for ../current/by-arch/[os]-[arch]/bin/pear-runtime.exe
    - /[name] | ([name].cmd | [name].ps1) -> reserved
```

`boot.bundle` has just enough code to run itself with the bare js runtime and open the hyperdrive that contains the rest of the code.

When the platform updates, `boot.bundle` updates the drive in the background and makes a new version of `boot.bundle` that it atomically swaps in.

If the `by-arch` folder updates, a new swap is needed for a full atomic update. When a new swap has been extracted on disk, the `[platform-dir]/current` symlink is updated.

## Pear on Bare

Pear Runtime runs on [bare](https://github.com/holepunchto/bare), which is a cross-platform (including mobile) minimal JS runtime.


## What Pear actually does (simple terms)

At a high level, Pear is a platform runtime that can launch applications by link, without bundling each app with its own heavy runtime:
- A long‑lived platform daemon (“sidecar”) holds networking, storage, and update logic.
- A desktop UI engine (Electron in Pear) renders app UIs; the app’s assets are pulled from the platform and served to the window.
- A custom URL scheme (pear://) acts as the entrypoint; opening a link boots the platform, fetches the app, and runs it.
- Assets and code are distributed over a P2P content/drive layer (Holepunch stack: hypercore/hyperdrive/hyperswarm) and cached locally.
- Updates are applied atomically by swapping the platform dir/current symlink to a new snapshot.

In effect, “the heavy parts come by magic” because the shared runtime is already installed and apps are just content addressed bundles resolved at run time.

## Pure Rust + Tauri design (no Node/Electron)

We can replicate Pear’s behavior with a Rust runtime and a Tauri front‑end. Suggested components:
- Runtime daemon (Rust)
  - Always‑on or on‑demand process that owns:
    - P2P distribution (see iroh below)
    - Local content store and indices
    - App manifest verification and versioning
    - Update manager (atomic swap of snapshots, background apply)
    - Local IPC server (Unix socket on macOS/Linux, named pipe on Windows)
- Launcher (Rust/Tauri shell sidecar or small CLI)
  - Handles deep links (fap:// and optionally pear://), starts/contacts the daemon, passes the link and flags
- GUI host (Tauri app)
  - Manages windows, tray, hide‑on‑close, devtools in dev
  - Loads the app UI via a custom protocol (e.g., fap://app) served from the daemon/store
  - Uses Tauri commands to talk to the daemon; receives events/streams for logs/progress

Typical flow:
1) User opens a fap://... (or pear://...) link.
2) OS calls our Launcher; Launcher signals/boots the daemon with the link.
3) Daemon resolves link → manifest → bundle roots; fetches/replicates assets via P2P; validates signatures.
4) Daemon exposes the app bundle over a local protocol/endpoint; GUI opens/refreshes the window to that entry URL.
5) Updates or missing assets stream in the background.

Notes on Tauri window/view:
- Yes, a Tauri webview can load local, remote, or custom‑protocol URLs. Prefer a custom protocol (e.g., fap://) to keep the UI origin locked to trusted content.
- BrowserView parity doesn’t exist in Tauri; emulate Pear’s View by: (a) single main window with in‑app routing, or (b) additional windows for secondary views.

## Deep link registration

macOS:
- Register a custom scheme (fap) via CFBundleURLTypes in the app bundle. With Tauri, use a deep link plugin or an app setup hook to define the scheme and an activation handler.
- The handler receives the link and arguments, then invokes the daemon (if needed) and brings the GUI to front.

Windows:
- Register URL protocol in the registry under HKEY_CLASSES_ROOT\\fap with URL Protocol and shell\open\command pointing to the app executable with "%1".
- Tauri’s deep link plugin can perform this registration at install time. The app receives the link via the single‑instance callback and forwards it to the daemon.

Optional pear:// compatibility:
- If helpful, the same handler can register pear:// and translate to the internal format (or treat it as an alias).
- For strict compatibility, you’d need to parse the pear link and either resolve via a compatible P2P backend or map it to your content addressing format.

## Content distribution and storage

Pear uses Hyperdrive over Hypercore with Hyperswarm DHT discovery. For a pure‑Rust runtime without Node/Electron dependencies:
- Candidate: iroh (https://github.com/n0-computer/iroh)
  - Rust, content‑addressed, peer‑to‑peer data sync using QUIC.
  - Provides a store and replication primitives suitable for distributing bundles (immutable content) and potentially mutable docs.
  - Good cross‑platform story for macOS and Windows.
- Alternatives:
  - libp2p (Rust) with a block exchange protocol (e.g., bitswap‑like), plus a KV (sled/rocksdb) for storage
  - Plain HTTPS fallback for initial bootstrap mirrors (optional)

Suggested model with iroh:
- App link resolves to a manifest object (content‑addressed root) describing entrypoint and bundle file list with hashes.
- Daemon retrieves missing blobs via iroh, verifies, and writes to the local store under PLATFORM_DIR.
- GUI loads fap://app/index.html; the custom protocol handler reads from the store and streams content.
- For mutable content or live updates, layer a signed manifest update mechanism (versioned pointers) and revalidate on navigation or on a background timer.

Platform directory layout (mirrors Pear’s useful ideas):
- PLATFORM_DIR (macOS: ~/Library/Application Support/fap)
  - app-storage/by-id/<app-id>/*
  - core/store/* (iroh/libp2p data)
  - snapshots/by-id/<platform-id>/<swap>/...
  - current → snapshots/.../<swap>
  - bin/, logs/, lock files, IPC socket

Atomic updates:
- Build a new snapshot under snapshots/.../<next-swap>; when ready, atomically update current symlink.
- Keep a small number of previous swaps for rollback.

## What the pear:// link implies and how to mirror it

Pear’s link encodes a drive key, which the sidecar resolves via the P2P network to a Hyperdrive and then serves to the GUI. To mirror the experience without exact wire‑compatibility:
- Define fap://<content-id>/<path>#fragment where content-id points to the manifest root in the P2P store (iroh hash or similar).
- Implement a pear:// adapter that:
  - Parses known pear links
  - Resolves them to your store by either: (a) a gateway/bridge (not recommended for zero‑Node goal), or (b) user‑provided mapping, or (c) an optional background converter/importer that materializes the content into your store format.
- Keep the adapter optional to avoid large engineering cost initially.

## Security posture
- Custom protocol origin only; disable arbitrary remote navigation unless explicitly allowed.
- CSP for app content; separate dev vs prod flags to enable devtools only in dev.
- Signature verification of manifests and critical assets; pin trusted keys per app.
- Sandboxed window (no Node integration; Tauri already isolates by default) and strict allowlist for any outbound requests the app needs.

## Why this preserves the “magic”
- The heavy runtime (UI engine + P2P + updater) is installed once as the FAP Runtime.
- Apps are just content bundles resolved at run time via P2P and cached locally.
- Deep links trigger instant app boot without the app bundling its own runtime.

## Scope priorities
- Platforms: macOS first, Windows second (Linux later).
- Interop: helpful but not at high cost — support a pear:// adapter where possible; prioritize the native iroh‑backed fap:// path.
- UX parity: tray + hide‑on‑close, quick boot from link, devtools in dev, atomic updates.
