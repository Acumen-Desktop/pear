# FAP Security Roadmap (phased)

## MVP
- Verify sha256 for every served file; reject path traversal
- Require Ed25519 signature on Manifest; signed Pointer for updates
- fap:// only; devtools only in dev; no external navigation by default
- Logs for daemon+GUI

## Phase 1
- Encrypt room traffic (X25519+ChaCha20-Poly1305)
- Rate-limit awareness; expire stale presence
- Sign snapshots; verify on install
- CSP for fap:// origin; block inline scripts by default
- Secrets in OS store (Keychain / DPAPI)

## Phase 2
- Join tokens/ACLs; replay protection with nonces/session IDs
- Tighten Tauri allowances; update safety (signed snapshots, rollback)
- Signer rotation and key revocation

## Phase 3
- Encrypted-at-rest blobs
- Attestation for runtime
- Privacy-preserving telemetry (opt-in)
- Formal threat model doc

## Checklist
- [ ] File hash-verify
- [ ] Manifest & pointer signatures verified
- [ ] Deep link handler blocks http(s)
- [ ] Dev/prod flags enforced
- [ ] Logs redact secrets
- [ ] Room flood control caps
- [ ] OS key storage
- [ ] Update/rollback tested

