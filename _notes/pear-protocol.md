## pear:// protocol — registration, parsing, routing

### Registration (OS integration)

- Linux: url-handler.js writes ~/.local/share/applications/pear.desktop with MimeType x-scheme-handler/pear and Exec pointing to the wakeup binary.
- Windows: url-handler.js writes HKCU\Software\Classes\pear and open\command to call the wakeup binary with the URL.
- macOS: handled via the packaged Electron app (Info.plist URL Types) — not in this repo, but Electron main handles links via argv.

Key entry:

<augment_code_snippet path="url-handler.js" mode="EXCERPT">
````js
module.exports = function register (executable) {
  if (isLinux) registerLinuxHandler(executable)
  if (isWindows) registerWindowsHandler(executable)
}
````
</augment_code_snippet>

Sidecar ensures registration on boot:

<augment_code_snippet path="subsystems/sidecar/index.js" mode="EXCERPT">
````js
// ensure that we are registered as a link handler
registerUrlHandler(WAKEUP)
````
</augment_code_snippet>

### Parsing and normalization

- lib/parse-link.js uses pear-link with constants.ALIASES to accept aliases like pear://runtime.

<augment_code_snippet path="lib/parse-link.js" mode="EXCERPT">
````js
const pearLink = require('pear-link')
const parse = pearLink(constants.ALIASES, ERR_INVALID_LINK)
module.exports = parse
````
</augment_code_snippet>

### Wakeup and dispatch flow

- pear run delegates to run.js, which talks to Sidecar via IPC.
- Sidecar.wakeup broadcasts a pear/wakeup message to running GUIs to focus or route deep-links; otherwise spawns a runtime.

<augment_code_snippet path="subsystems/sidecar/index.js" mode="EXCERPT">
````js
wakeup (params = {}) {
  const [link, storage, appdev=null, selfwake=true, startId] = params.args
  const parsed = parseLink(link)
  const appLink = link.substring(0, link.length - parsed.pathname.length)
  // ... find matching GUI instances and send message
  app.message({ type: 'pear/wakeup', link, applink: app.state.applink, entrypoint: pathname, fragment, linkData: segment })
}
````
</augment_code_snippet>

### HTTP layer and module resolution

- Each GUI requests its app resources from the Sidecar HTTP server with a custom User-Agent (Pear <client@start>).
- Http.lookup multiplexes by UA and routes to ScriptLinker/DriveBundler to return transformed JS/HTML/CSS or resolve module paths.

<augment_code_snippet path="subsystems/sidecar/lib/http.js" mode="EXCERPT">
````js
const [url, protocol='app', type='app'] = req.url.split('+')
if (protocol === 'platform-resolve' || protocol === 'holepunch') { /* ... */ }
await this.lookup(app, protocol, type, req, res, startId)
````
</augment_code_snippet>

### Data model and trust

- Sidecar.trusted allows running of known or whitelisted drives; otherwise prompts via GUI and ERR_PERMISSION_REQUIRED.
- Encryption keys can be configured and stored per bundle.

