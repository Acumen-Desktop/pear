# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Testing
- `npm test` - Run all tests using bare scripts/test.mjs  
- `npm run test:gen` - Generate tests using brittle framework

### Code Quality
- `npm run lint` - Run standard linter
- `npm run lint:fix` - Auto-fix linting issues with standard

### Platform Development (localdev)
- `npm install` - Install dependencies
- `npm run bootstrap [KEY]` - Bootstrap runtime binaries (defaults to production key)
- `npm run archdump` - Dump architecture information
- `npm run prestage` - Prepare staging with external corestore and prune prebuilds
- `npm run hyperdb:build` - Build hyperdb using bare script

### Runtime Execution
- `./pear.dev` (Linux/Mac) or `\\pear.ps1` / `\\pear.cmd` (Windows) - Execute Pear Runtime directly in localdev

## Architecture Overview

### Core Components
- **Boot System** (`boot.js`) - Entry point that determines boot type (sidecar, CLI, electron, preload) and routes to appropriate module
- **CLI** (`cli.js`) - Command-line interface that connects to sidecar via IPC
- **Sidecar** (`sidecar.js`) - Background process handling core platform operations
- **Commands** (`cmd/`) - Individual command implementations (init, stage, seed, release, run, etc.)
- **Library** (`lib/`) - Shared utilities (worker, logger, crasher, teardown, etc.)

### Platform Structure
- **Runtime Path**: Platform-specific directories for binaries and libraries
  - macOS: `~/Library/Application Support/pear`
  - Linux: `~/.config/pear` 
  - Windows: `~\\AppData\\Roaming\\pear`
- **Drives**: Uses hyperdrive for P2P distribution with atomic swapping mechanism
- **Bootstrap**: Self-updating system via `boot.bundle` with sparse drive representation

### Key Technologies
- **Bare Runtime**: Cross-platform minimal JS runtime (including mobile)
- **Hyperswarm**: P2P networking layer
- **Hyperdrive**: Distributed file system
- **IPC**: Inter-process communication between CLI and sidecar
- **Brittle**: Testing framework for the test suite

### Application Types
- `terminal` - Command-line applications
- `desktop` - GUI applications using electron-like interface
- `terminal-node` - Node.js compatible terminal applications

### Development Notes
- Uses `standard` for code style enforcement
- Platform uses atomic swapping for updates via symlinks
- Applications run in isolated corestores with per-app data storage
- Global `Bare`, `Pear`, and `LOG` objects available in runtime environment
- Test fixtures in `test/fixtures/` cover various worker scenarios and platform features