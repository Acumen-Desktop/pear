# Pear architecture (reference)

High-level overview of the original Pear runtime for comparison.
- Electron main + preload + renderer
- GUI orchestrator with Window/View (BrowserView), tray, devtools
- Sidecar daemon with pear-ipc; hypercore/corestore/hyperdrive/hyperswarm
- Deep links via pear://, asset bundling, atomic updates via swap/current

See _notes/pear-architecture.md for full details.

