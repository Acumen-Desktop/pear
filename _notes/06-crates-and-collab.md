# Foundational crates and collaboration engine

Recommendation: yrs (Rust Yjs) + Yjs in the webview; iroh for blobs and QUIC.

## Why
- Strong editor ecosystem on the web side (Yjs adapters)
- Shared update format (Y protocol) between GUI (Yjs) and daemon (yrs)
- Pure Rust core with iroh transport/storage

## Architecture
- Transport: QUIC (iroh) per room; snapshots to blobs
- CRDTs: Y.Text for docs; Y.Map/Array for boards/chat
- Presence: y-protocol awareness
- Storage: append log + periodic snapshots; registry tracks latest snapshot CID

## Crates
- Runtime: iroh, yrs, quinn (if direct), serde, sha2, ed25519-dalek, redb/sqlite, interprocess, tokio, tracing
- GUI: Tauri core + SystemTray + deep-link, Yjs (in webview), plain JS/CSS/HTML UI

## Risks
- If iroh live streams are early, use quinn for streams and iroh for blobs
- Large docs: snapshot/prune; partition as needed

