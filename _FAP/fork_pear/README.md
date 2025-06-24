# Pear Minimal Fork (`fork_pear`)

This directory contains a minimal fork of the Pear runtime, designed to:
- Give you full control over the Electron main process and preload scripts
- Reuse as much of the user's existing Pear, Electron, and Bare modules as possible
- Serve as a template for advanced Pear app experimentation

## Structure
- `electron-main.js`: Forked main process entry. Imports most logic from upstream Pear, but allows custom hooks and preload injection.
- `preload.js`: Forked preload script. Can be chained or replaced with custom logic.
- `package.json`: Declares this as a runnable app and ensures dependencies are resolved from the main Pear install if possible.

## Usage
1. Place your custom main process logic in `electron-main.js` and preload logic in `preload.js`.
2. Launch your app using this fork (see below).
3. All other Pear/Electron/Bare modules are loaded from the main Pear install, minimizing duplication and download size.

## Example Launch
```sh
pear run -d _FAP/fork_pear
```

## Custom Preload Example
To use a custom preload, edit `electron-main.js` to point to your own script or inject logic as needed.

---

## Why Fork?
This approach is for advanced users who need more control than Pear's standard sandboxed IPC allows. It is ideal for experiments, debugging, and extending Pear's capabilities without waiting for upstream changes.

---

## Warning
This fork is for experimentation and may break compatibility with future Pear updates. Use with caution in production environments.
