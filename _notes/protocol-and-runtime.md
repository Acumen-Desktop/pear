## Protocol and Runtime: lifecycle, bundling, routing

### App lifecycle

- pear run resolves a link (pear://, file://, or path) -> Sidecar.start
- Sidecar validates trust, sets encryption keys if needed, prepares Bundle and Linker
- GUI opens, identifies with Sidecar, creates window/view, and loads the app entry via HTTP
- Wakeups: new pear:// links are routed to existing windows where possible

### Bundling and module system

- DriveBundler.bundle mounts the app under a virtual scheme and materializes assets

<augment_code_snippet path="subsystems/sidecar/lib/bundle.js" mode="EXCERPT">
````js
const res = await DriveBundler.bundle(this.drive, { entrypoint, cwd: SWAP, assets, absoluteFiles: true, mount: 'pear://' + id })
````
</augment_code_snippet>

- Sidecar HTTP performs resolution and transformation

<augment_code_snippet path="subsystems/sidecar/lib/http.js" mode="EXCERPT">
````js
const [url, protocol='app', type='app'] = req.url.split('+')
if (protocol === 'resolve') res.end(link.filename)
else res.end(await linker.transform(link))
````
</augment_code_snippet>

- Preload bootstraps runtime loaders for the app and platform

<augment_code_snippet path="preload.js" mode="EXCERPT">
````js
const appsl = runtime({ builtins: gunk.builtins, map: gunk.app.map, protocol: gunk.app.protocol, getSync(url){/*XHR*/}, resolveSync(req, dirname,{isImport}){/*XHR resolve*/} })
````
</augment_code_snippet>

### Security model & sandboxing

- Trust gate: Sidecar.trusted() allows aliases and previously staged apps; otherwise GUI prompts for permission
- Electron webPreferences
  - nodeIntegration: true (apps are privileged by trust gate)
  - contextIsolation: false (tight integration with Pear APIs)
  - session partitions: persist:<applink> per app to isolate storage and cookies
- Outbound network control: GUI constrains onBeforeRequest to allowed hosts (pear.links) plus Sidecar host

### Routing specifics

- Entry URL construction: GUI builds this.entry as `${sidecar}${entry}` where entry starts with /~<entrypoint>
- Deep link segments: sidecar passes pathname/hash through pear/wakeup messages so app code can handle routing

