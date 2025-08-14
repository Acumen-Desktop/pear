# FAP ↔ iroh data model mapping

This note defines how FAP objects map to iroh storage and how the custom protocol resolves fap://app/<id>/<path>.

## Objects and namespaces
- Files: iroh blobs by sha256
- Manifest: JSON blob; sha256 = manifest_hash
- Pointer: signed JSON → manifest_hash
- Snapshots: YDoc (or compact updates) blobs; optional signature

Namespaces (via our registry):
- blobs/: raw file blobs
- manifests/: <manifest_hash>.json
- pointers/: app/<app-id>.json
- snapshots/: app/<app-id>/<room>/<timestamp>.bin

## Name resolution for fap://app/<id>/<path>
1) app_id → current manifest_hash (from pointer)
2) Load manifest
3) Find file by path
4) Read and hash-verify blob; set content-type
5) If missing path, serve manifest.entry

## Registry and pinning
- Keep app metadata, manifest index, pointer index, pins
- Pin files/manifests on install; unpin old versions per policy
- GC unpinned blobs; keep N manifests and M snapshots per room

## Versioning and updates
- Accept new manifest if signatures valid; update current
- Apply pointer updates if signed by authorized publishers
- Runtime update via atomic symlink swap

## Bootstrap peers
- MVP: static peers/relays config; later discover via iroh

## CRDT snapshots
- Track latest snapshot CID per room for fast join
- Snapshot cadence: time/ops-based; size bounded

## Integrity and signatures
- Verify file sha256; verify manifest/pointer signatures
- Optional snapshot signatures (post-MVP)

