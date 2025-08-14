# FAP Runtime: iroh-based distribution design (macOS + Windows)

This doc proposes a pure Rust P2P content layer for the Freedom Application Platform (fap://), centered on iroh. No Node/Electron.

## Goals
- Content-addressed app bundles distributed over P2P (iroh)
- Local store and verification before serving to the GUI
- Simple, auditable manifest format with signatures
- Atomic updates for the runtime snapshots (current→next swap)

## Components
- Runtime Daemon (Rust)
  - iroh node + store (blobs/collections)
  - Manifest verifier (signatures, hash checking)
  - App registry (installed/known apps, pinsets, trust keys)
  - HTTP-free local protocol server (custom scheme handler read path)
  - IPC server (Unix socket on macOS, named pipe on Windows)
- GUI Host (Tauri)
  - Custom protocol fap:// to load app assets
  - Commands/events to request app start, observe progress, tray, window ops

## App bundle model
- App Manifest (immutable):
  - id, name, version, entry
  - files: [{ path, size, sha256, mime }]
  - links: allowlist (optional)
  - signature(s) & publisher keys
- Pointer (mutable):
  - pointer_id → manifest_hash; signed by publisher

## iroh mapping
- Store files as blobs; manifest as a JSON blob
- Option A: iroh collections; Option B: registry maps manifest→blobs
- Replication via QUIC; snapshots for fast join

## Serving to the GUI
- Tauri registers fap:// scheme
- fap://app/<id>/<path> → resolve manifest → read blob → verify sha256 → stream

## Link resolution
- fap://<app-id>/<path>#fragment → daemon.start()

## Updates
- New pointer version signed by publisher → fetch, verify, update current manifest
- Runtime self-update → write new snapshot, update current symlink atomically

## Security posture
- Custom origin; no remote nav by default
- Manifest and file hash verification; signatures for manifests and pointers
- Further hardening in Security Roadmap

