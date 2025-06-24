/** @typedef {import('pear-interface')} */ /* global Pear */

/**
 * Creates a child view using Pear's direct IPC approach
 * @param {string} entry - The HTML file for the child view
 * @param {Object} options - View options (width, height, x, y, etc.)
 * @returns {Promise<number>} The child view ID
 */
export async function createChildView(
  entry = "/child-view.html",
  options = {}
) {
  console.log("=== CREATE CHILD VIEW TEST ===");

  try {
    // Get current context
    const currentViewId = window[Symbol.for("pear.ipcRenderer")].sendSync("id");
    console.log("Current view ID:", currentViewId);

    // Get the config - this is required for the state
    const config = window[Symbol.for("pear.config")];
    console.log("Config available:", !!config);
    console.log("Config keys:", config ? Object.keys(config) : "none");

    // Get sidecar URL - this is critical for the state
    const currentUrl = window.location.href;
    const sidecarUrl = currentUrl.split("/").slice(0, 3).join("/");
    console.log("Current URL:", currentUrl);
    console.log("Sidecar URL:", sidecarUrl);

    // Get IPC interface
    const ipc = Pear[Symbol.for("pear.ipc")];
    console.log("IPC available:", !!ipc);

    // Construct the state object properly
    // Based on GUI code analysis, the state needs:
    // - sidecar (for building entry URL)
    // - config (for additionalArguments)
    // - key or dir (for session partition)
    const state = {
      sidecar: sidecarUrl,
      config: config,
      key: config.key,
      dir: config.dir,
      // Add other properties that might be needed
      options: config.options || {},
    };

    console.log("State object:", state);
    console.log("State.sidecar:", state.sidecar);
    console.log("State.config:", !!state.config);
    console.log("State.key:", state.key);
    console.log("State.dir:", state.dir);

    // Log the final entry URL that will be constructed
    console.log("Entry parameter:", entry);

    // Based on GUI code analysis:
    // - if entry[0] !== '/', entry becomes `/~${entry}`
    // - final URL = `${sidecar}${processedEntry}`
    let processedEntry = entry;
    if (entry[0] !== "/") {
      processedEntry = `/~${entry}`;
    }
    console.log("Processed entry:", processedEntry);
    console.log("Final URL will be:", `${sidecarUrl}${processedEntry}`);

    // Prepare parameters for ipc.ctrl
    const params = {
      parentId: currentViewId,
      type: "view",
      entry: entry,
      state: state,
      options: {
        width: 400,
        height: 300,
        x: 50,
        y: 50,
        ...options,
      },
      openOptions: {},
    };

    console.log("Calling ipc.ctrl with params:", params);

    const childViewId = await ipc.ctrl(params);

    console.log("SUCCESS! Child view ID:", childViewId);

    // Add a small delay to let the view load, then check if it's actually working
    setTimeout(async () => {
      try {
        const isVisible = await ipc.isVisible({ id: childViewId });
        const isClosed = await ipc.isClosed({ id: childViewId });
        console.log(
          `Child view ${childViewId} status - visible: ${isVisible}, closed: ${isClosed}`
        );
      } catch (error) {
        console.error("Error checking child view status:", error);
      }
    }, 1000);

    return childViewId;
  } catch (error) {
    console.error("=== ERROR CREATING CHILD VIEW ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", error);
    throw error;
  }
}

/**
 * Manages a child view (show, hide, close)
 */
export class ChildViewManager {
  constructor(viewId) {
    this.viewId = viewId;
    this.ipc = Pear[Symbol.for("pear.ipc")];
    console.log(`ChildViewManager created for view ID: ${viewId}`);
  }

  async show() {
    console.log(`Showing view ${this.viewId}`);
    return await this.ipc.show({ id: this.viewId });
  }

  async hide() {
    console.log(`Hiding view ${this.viewId}`);
    return await this.ipc.hide({ id: this.viewId });
  }

  async close() {
    console.log(`Closing view ${this.viewId}`);
    return await this.ipc.close({ id: this.viewId });
  }

  async isVisible() {
    const visible = await this.ipc.isVisible({ id: this.viewId });
    console.log(`View ${this.viewId} is visible:`, visible);
    return visible;
  }

  async isClosed() {
    const closed = await this.ipc.isClosed({ id: this.viewId });
    console.log(`View ${this.viewId} is closed:`, closed);
    return closed;
  }

  async toggle() {
    const visible = await this.isVisible();
    console.log(`Toggling view ${this.viewId} from visible=${visible}`);
    return visible ? await this.hide() : await this.show();
  }
}
