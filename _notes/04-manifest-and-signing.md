# FAP Manifest and Signing

Defines the content-addressed app manifest, signatures, and update pointers for the fap:// runtime.

## Objects
- Manifest (immutable): id, version, entry, files[], metadata?, links?, integrity{ sha256_tree }, signatures[], publishers[]
- Pointer (mutable): pointer_id, manifest_hash, updated_at, signatures[]
- File: path, size, sha256, mime?, encoding?
- Signature: key_id, alg=Ed25519, sig(base64)
- PublisherKey: key_id, ed25519(base64)

## Canonicalization and hashing
- JCS-like canonical JSON; sha256 over canonical bytes
- manifest_hash = sha256(canonical(Manifest))
- pointer_hash = sha256(canonical(Pointer))
- Optional Merkle tree over files for large sets

## Signing
- Ed25519 signatures over canonical JSON
- Any signature by an authorized publisher key is sufficient

## Verification
1) Compute manifest_hash; verify signatures
2) Validate files (no traversal, size, sha256)
3) Compare integrity.sha256_tree if present
4) Accept into registry and set current

Pointer update
1) Verify signature by authorized publisher
2) Update current ← manifest_hash

## iroh mapping
- Files as blobs (sha256); manifest as JSON blob; optional collection

## Examples
- See fap-manifest.md (full examples)

