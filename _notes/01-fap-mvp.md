# FAP MVP plan (macOS first)

Target: One main Tauri window loading fap:// content from a Rust daemon using iroh for P2P, and a minimal set of collaboration features (chat, whiteboard, multi‑edit docs). Security can be tightened later; only fap:// is supported initially.

## Scope
- Platforms: macOS first; Windows next
- UI: Single main window; in‑app layout handles panels/views
- Protocol: fap:// only; no pear://
- P2P: Native iroh; avoid Node/Electron

## High‑level flow
1) User opens fap://<app-id>/ (via deep link or app launcher)
2) Tauri app starts (or is focused) and signals the FAP daemon
3) Daemon resolves <app-id> → current manifest → missing blobs
4) Daemon fetches via iroh, verifies hashes and signatures, writes to store
5) Tauri loads the app entry via fap://app/<app-id>/index.html (custom protocol)
6) App initializes collaboration features using daemon‑exposed docs/logs

## Components
- FAP Daemon (Rust)
  - iroh node + blob/collection store
  - App registry: manifests, trusted keys, pointer (mutable) → manifest hash
  - Custom protocol backing: read‑only file serving by path from the store
  - IPC API (Unix socket): identify, start(link), get_manifest(id), read(path), subscribe(events)
  - Collab primitives: docs/logs backed by CRDTs (see below)
- Tauri GUI (Rust + web front‑end)
  - Custom protocol: fap://app/<id>/<path>
  - Commands: daemon.invoke("start", link), daemon.stream("progress"), window ops, tray
  - Single window layout hosting the app UI; in‑app panels manage layout

## App manifest (strawman)
- id: string
- version: string
- entry: string (path like "index.html")
- files: [{ path: string, sha256: hex, size: number, mime?: string }]
- links?: { allowlist?: string[] }
- signature: { key_id: string, sig: base64 } (detached over canonical JSON)
- publisher_keys: [{ key_id, key_ed25519_base64 }]

Pointers (mutable references):
- pointer_id → manifest_hash
- signed by one of the publisher keys

Note: this is a starting point; refine after reviewing prior art (e.g., osvauld) and iroh object model.

## Collaboration primitives
- Shared document (multi‑edit):
  - Option A: automerge-rs (mature, CRDT for JSON‑like data)
  - Option B: yrs (Rust Yjs bindings) with Web bindings)
  - Option C: iroh-docs if available/stable (integrated with iroh replication)
- Whiteboard:
  - Represent shapes/strokes as CRDT collections (same as docs) with a lightweight schema (id, kind, path/points, color, z)
  - Periodically snapshot to blobs for fast load; real‑time ops via CRDT
- Chat:
  - Append‑only log (CRDT list of messages) with per‑message timestamp and author
- Presence:
  - Ephemeral presence channel (peer heartbeats) or a transient CRDT map with expirations

Replication strategy:
- Real‑time: CRDT deltas sent over a QUIC stream (iroh or a side channel)
- Persistence: periodic commits to iroh blobs and compacting logs

## Deep link and protocol (MVP)
- Register fap:// only
- macOS: CFBundleURLTypes + handler routes to daemon.start(link)
- Windows: registry URL protocol later (phase 2)
- Custom protocol: fap://app/<id>/<path> served by daemon from the store; hash check on each read for defense in depth

## Minimal IPC surface
- identify() → { platform_id, version }
- start(link) → resolve+fetch; emits progress events (fetch %, file path)
- get_manifest(app_id) → manifest
- open_doc(name) → stream handle
- doc_ops(handle, op) → apply CRDT op; events emitted to subscribers

## MVP acceptance
- Open fap://<app-id> on macOS launches the app UI
- Missing files fetched via iroh and cached locally
- Chat, whiteboard, and doc edit between two peers synchronize within a few seconds
- App window remains responsive; tray + hide‑on‑close optional

## Next steps
- Finalize manifest schema + signature rules
- Choose CRDT library (automerge-rs vs yrs vs iroh-docs)
- Detail iroh data model (collections vs manifest‑root)
- Write deep‑link registration and protocol design notes

