## Shared Electron Runtime (Pear Runtime)

The project avoids shipping one Electron per app by providing a single packaged runtime that hosts multiple apps.

### Core idea

- A single Electron application (Pear Runtime) is installed once.
- Apps are delivered via Hyperdrive/Localdrive as bundles and are served by the Sidecar’s HTTP server.
- The Electron host opens BrowserWindows/BrowserViews pointing at Sidecar URLs, not file:// app packages.

### Key building blocks

- Sidecar "applings" registry remembers which desktop binary hosts a given app key.

<augment_code_snippet path="subsystems/sidecar/lib/applings.js" mode="EXCERPT">
````js
async set (hexKey, path) { /* persist mapping key->path */ }
async get (hexKey) { /* retrieve mapped path */ }
````
</augment_code_snippet>

- run.js chooses between detached wakeup vs spawning the shared runtime.

<augment_code_snippet path="run.js" mode="EXCERPT">
````js
if (detached) {
  const { wokeup, appling } = await ipc.detached({ key, link, storage, appdev })
  if (!appling) spawn(constants.RUNTIME, ['run','--detach', ...args], opts)
  else spawn(constants.DESKTOP_RUNTIME, [constants.BOOT,'--appling', appling,'--run', ...args], opts)
}
````
</augment_code_snippet>

- Electron main defers to GUI which creates windows and loads app URLs from Sidecar.

<augment_code_snippet path="gui/gui.js" mode="EXCERPT">
````js
const entry = state.entrypoint || '/' + (config?.main || state.main)
this.entry = `${this.sidecar}${entry}`
await this.view.webContents.loadURL(this.entry)
````
</augment_code_snippet>

### How one runtime hosts many apps

- Session multiplexing: the Sidecar HTTP uses the User-Agent header (Pear <client@start>) to associate requests with a specific app session.
- Module-level isolation: ScriptLinker resolves modules per-app; DriveBundler mounts app content under pear://<id> and transforms on demand.
- Process model: One Electron process tree; each app is a BrowserView/Window with its own Electron session partition and preload args.

### Comparison to traditional Electron distribution

- Traditional: each app bundles its own Electron, increasing download size and update churn.
- Pear: one host runtime is updated independently; apps are small Hyperdrive bundles that the host loads.
- Benefits: smaller per-app updates, shared caching, centralized trust and network stack.

### Security considerations

- WebPreferences deliberately enable nodeIntegration for Pear apps; trust gate is enforced before loading external drives.
- Allowed outbound requests are filtered per app via allowed hosts derived from pear.links config.
- App isolation relies on Electron session partitions and Sidecar session routing rather than OS-level sandboxes.

