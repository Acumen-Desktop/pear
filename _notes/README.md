# FAP Design Package (macOS first)

This is the coherent, numbered reading order for the FAP (Freedom Application Platform) runtime and app model. It summarizes decisions, then links to the individual design notes.

## Principles and decisions
- Platform
  - Pure Rust + Tauri; zero Node/Electron
  - macOS first, Windows next; Linux later
  - Deep links: fap:// only (pear:// later only if needed)
- Distribution
  - Native iroh for P2P content distribution (blobs, snapshots) over QUIC
  - Apps are content-addressed bundles fetched at run-time; runtime performs atomic self-updates
- Collaboration
  - Real-time CRDTs with Yjs/Yrs (yrs in daemon, Yjs in webview)
  - Plain JS/CSS/HTML in the UI (no big frameworks)
- Focus
  - Make it work first (chat, whiteboard, multi-edit docs), then harden security

## Reading order

1) MVP scope and flow
   - _notes/01-fap-mvp.md
   - One main window; macOS deep-link; iroh-backed store; initial collab primitives; minimal IPC

2) High-level iroh distribution design
   - _notes/02-iroh-design.md
   - How the daemon resolves links, fetches blobs via iroh, and serves content to the GUI

3) Data model mapping to iroh
   - _notes/03-iroh-data-model.md
   - Mapping of manifests, pointers, files, CRDT snapshots to iroh storage, plus pinning/GC

4) Manifest and signing
   - _notes/04-manifest-and-signing.md
   - JSON schema, canonicalization (JCS-like), Ed25519 signatures, pointer (mutable) for updates

5) Deep link and custom protocol
   - _notes/05-deeplink-and-protocol.md
   - macOS fap:// registration and handler; fap://app/<id>/<path> protocol and validation; Windows checklist

6) Collaboration engine and crate choices
   - _notes/06-crates-and-collab.md
   - Recommends Yjs/Yrs with iroh; transport, snapshotting, editor integration strategy

7) Real-time room protocol
   - _notes/07-room-protocol.md
   - QUIC message types (join, state_vector, update, awareness, snapshot_*), framing, backpressure

8) Daemon ↔ GUI IPC schema
   - _notes/08-daemon-gui-ipc.md
   - Local JSONL envelopes, commands (start, get_manifest, open_room, send_update, subscribe_room), events

9) Security roadmap (phased)
   - _notes/09-security-roadmap.md
   - MVP checks and staged hardening: transport encryption, auth, CSP, sandboxing, updates, secrets

Appendix A) Pear architecture (reference)
- _notes/90-pear-architecture.md
- How the original Pear platform is assembled (Electron/sidecar/Hyper* stack)

Appendix B) Interop options (reference)
- _notes/91-p2p-compat-options.md
- Strategies for pear:// compatibility (deferred unless needed)

## Suggested implementation order (MVP)
- Deep link (macOS): capture fap:// and route to daemon.start
- Protocol handler: serve fap://app/<id>/... from local store with hash verification
- iroh store and registry: manifests, pointers, blobs, pinning/GC
- IPC: identify, start, get_manifest; progress events
- Collaboration (one room): QUIC stream, Y state vector + updates, minimal chat
- Snapshots: periodic Y snapshot; advertise and fast-sync late joiners

## Notes
- If you want file names to encode order (e.g., 01-mvp.md, 02-iroh-design.md, …), say the word and I’ll rename with redirects noted here.
- These docs are intentionally minimal and composable—optimize for simplicity first.

