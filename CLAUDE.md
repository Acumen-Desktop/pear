# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the design documentation for FAP (Freedom Application Platform), a peer-to-peer application runtime and distribution system. FAP aims to replace Electron/Node-based solutions with a pure Rust + Tauri architecture using iroh for P2P content distribution.

## Architecture Summary

**Core Components:**
- **FAP Daemon (Rust)**: iroh node, blob/collection store, app registry, custom protocol server, IPC API, collaboration primitives
- **Tauri GUI (Rust + Web)**: Custom fap:// protocol handler, single window host, minimal IPC surface
- **P2P Layer**: iroh for content distribution over QUIC, content-addressed app bundles
- **Collaboration**: Yjs/Yrs CRDTs for real-time shared docs, whiteboard, and chat

**Key Design Decisions:**
- Pure Rust + Tauri (zero Node/Electron)
- macOS first, Windows next, Linux later
- fap:// protocol only (not pear://)
- Content-addressed bundles with Ed25519 signatures
- Real-time collaboration as core primitive

## Documentation Structure

The design is documented in numbered reading order in `_notes/`:

1. **01-fap-mvp.md** - MVP scope, components, and acceptance criteria
2. **02-iroh-design.md** - P2P distribution architecture using iroh
3. **03-iroh-data-model.md** - Mapping FAP objects to iroh storage
4. **04-manifest-and-signing.md** - App manifest format and cryptographic signatures
5. **05-deeplink-and-protocol.md** - fap:// deep links and custom protocol
6. **06-crates-and-collab.md** - Rust crate choices and collaboration engine
7. **07-room-protocol.md** - QUIC-based real-time room protocol
8. **08-daemon-gui-ipc.md** - IPC schema between daemon and GUI
9. **09-security-roadmap.md** - Phased security hardening approach

**Reference Documents:**
- **90-pear-architecture.md** - Original Pear platform architecture for comparison
- **91-p2p-compat-options.md** - P2P interoperability strategies (deferred)

## Key Technologies

**Core Stack:**
- **Rust**: Runtime daemon, cryptography, P2P networking
- **Tauri**: GUI framework with custom protocol support
- **iroh**: P2P content distribution and blob storage
- **Yjs/Yrs**: CRDT library for real-time collaboration
- **Ed25519**: Digital signatures for manifests and pointers
- **QUIC**: Transport protocol for real-time collaboration

**Platform Integration:**
- macOS: CFBundleURLTypes for deep link registration
- Windows: Registry URL protocol (planned)
- Custom protocol: fap://app/<id>/<path>

## Security Model

**Content Integrity:**
- All files verified by SHA256 hash
- Manifests signed with Ed25519
- Mutable pointers signed by authorized publishers
- No path traversal or external navigation by default

**Phased Security Approach:**
- MVP: Basic file integrity and signature verification
- Phase 1: Room traffic encryption, CSP, OS secret storage
- Phase 2: Join tokens/ACLs, update safety, key rotation
- Phase 3: Encrypted-at-rest blobs, attestation, formal threat model

## Development Approach

**Implementation Priority (MVP):**
1. Deep link registration (macOS)
2. Custom protocol handler with hash verification
3. iroh store and registry (manifests, pointers, blobs)
4. Basic IPC (identify, start, get_manifest)
5. Single-room collaboration (QUIC stream, Y state vector + updates)
6. Periodic snapshots for fast room joining

**Platform Strategy:**
- Start with macOS for MVP validation
- Windows support in phase 2
- Linux support deferred until later phases

## Collaboration Features

**Supported Collaboration Types:**
- **Shared Documents**: Multi-edit with CRDT synchronization
- **Whiteboard**: Real-time drawing with shapes/strokes as CRDT collections
- **Chat**: Append-only log with per-message timestamps
- **Presence**: Ephemeral awareness channel for peer status

**Data Flow:**
- Real-time: CRDT deltas over QUIC streams
- Persistence: Periodic commits to iroh blobs
- Fast sync: Latest snapshot CID tracking per room