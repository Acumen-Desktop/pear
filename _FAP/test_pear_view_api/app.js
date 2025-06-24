/** @typedef {import('pear-interface')} */ /* global Pear */

console.log(`Line 3 - app.js - 'Pear object loaded: `, Pear);

// Simple debug logging function
function debugLog(message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// Update status display
function updateStatus(message, type = "pending") {
  const statusEl = document.getElementById("view-status");
  const resultEl = document.getElementById("test-result");

  statusEl.textContent = message;
  statusEl.className = `status ${type}`;

  if (resultEl) {
    resultEl.textContent = message;
  }
}

// Load window information
async function loadWindowInfo() {
  try {
    let windowId = "Unknown";

    // Try to get window ID
    if (Pear.Window && Pear.Window.self) {
      windowId = Pear.Window.self.id;
      debugLog("Found window ID via Pear.Window.self", windowId);
    }

    // Update UI
    document.getElementById("window-id").textContent = windowId;
    debugLog("Window info loaded", { windowId });
  } catch (error) {
    debugLog("Error loading window info", error);
    document.getElementById("window-id").textContent = "Error";
  }
}

// 🎯 PROPER MULTI-VIEW TEST - Understanding BrowserWindow + BrowserView architecture
async function createNewView() {
  debugLog("🎯 TESTING PROPER MULTI-VIEW ARCHITECTURE");
  updateStatus(
    "Understanding BrowserWindow + BrowserView architecture...",
    "pending"
  );

  try {
    const ipc = Pear[Symbol.for("pear.ipc")];
    const currentViewId = Pear.Window?.self?.id;

    if (!ipc || !currentViewId) {
      throw new Error("IPC or view ID not available");
    }

    // STEP 1: Understand the current architecture
    debugLog(
      "🎯 STEP 1: Analyzing BrowserWindow + BrowserView architecture..."
    );

    const currentDimensions = await ipc.dimensions({ id: currentViewId });
    debugLog("✅ Current BrowserView dimensions:", currentDimensions);

    // Try to get parent BrowserWindow dimensions (should be ID 0)
    let windowDimensions = null;
    try {
      windowDimensions = await ipc.dimensions({ id: 0 });
      debugLog("✅ Parent BrowserWindow dimensions:", windowDimensions);
    } catch (parentError) {
      debugLog(
        "❌ Could not get parent window dimensions:",
        parentError.message
      );
      // Assume current view fills the window
      windowDimensions = currentDimensions;
    }

    // STEP 2: Position current view in TOP HALF of window
    debugLog("🎯 STEP 2: Positioning current view in TOP HALF...");

    const windowWidth = windowDimensions.width;
    const windowHeight = windowDimensions.height;
    const topHalfHeight = Math.floor(windowHeight / 2);

    try {
      await ipc.dimensions({
        id: currentViewId,
        options: {
          x: 0,
          y: 0,
          width: windowWidth,
          height: topHalfHeight,
        },
      });
      debugLog("✅ Current view positioned in TOP HALF");
      updateStatus("✅ Current view positioned in top half!", "success");

      // STEP 3: Create a SIBLING view in BOTTOM HALF
      setTimeout(async () => {
        debugLog("🎯 STEP 3: Creating SIBLING view in BOTTOM HALF...");

        try {
          const siblingResult = await ipc.ctrl({
            parentId: 0, // Same BrowserWindow as parent
            type: "view",
            entry: "test-view.html", // Different content
            options: {
              // Position in bottom half of the BrowserWindow
              x: 0,
              y: topHalfHeight,
              width: windowWidth,
              height: windowHeight - topHalfHeight,
              backgroundColor: "#2d3748",
            },
            state: {
              platform: process.platform,
              sidecar: "pear://runtime",
              name: "bottom-sibling-view",
              ...Pear.config,
            },
            openOptions: {
              show: true,
              view: {
                config: {
                  name: "Bottom View",
                },
              },
            },
          });

          debugLog("✅ Sibling view created with ID:", siblingResult);
          updateStatus(
            "✅ TRUE SPLIT-SCREEN achieved! Two views in one window!",
            "success"
          );

          // STEP 4: Test manipulating both views
          setTimeout(async () => {
            debugLog("🎯 STEP 4: Testing individual view manipulation...");

            // Test resizing the sibling view
            try {
              await ipc.dimensions({
                id: siblingResult,
                options: {
                  x: 0,
                  y: Math.floor(windowHeight * 0.6), // Move down slightly
                  width: windowWidth,
                  height: Math.floor(windowHeight * 0.4), // Make it smaller
                },
              });
              debugLog("✅ Sibling view resized successfully");

              // Also adjust top view to fill the gap
              await ipc.dimensions({
                id: currentViewId,
                options: {
                  x: 0,
                  y: 0,
                  width: windowWidth,
                  height: Math.floor(windowHeight * 0.6),
                },
              });
              debugLog("✅ Both views adjusted for 60/40 split");
              updateStatus(
                "✅ Dynamic split-screen layout complete!",
                "success"
              );
            } catch (manipulationError) {
              debugLog(
                "❌ View manipulation failed:",
                manipulationError.message
              );
            }
          }, 3000);
        } catch (siblingError) {
          debugLog("❌ Sibling view creation failed:", siblingError.message);
          updateStatus(
            `❌ Sibling view failed: ${siblingError.message}`,
            "error"
          );
        }
      }, 2000);
    } catch (positionError) {
      debugLog("❌ View positioning failed:", positionError.message);
      updateStatus(`❌ Positioning failed: ${positionError.message}`, "error");
    }
  } catch (error) {
    debugLog("❌ Multi-view architecture test failed:", error);
    updateStatus(`❌ Failed: ${error.message}`, "error");
  }
}

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", async () => {
  debugLog("🍐 Pear Multi-View Test loaded!");
  debugLog("DOM loaded, initializing...");

  // Load window info
  await loadWindowInfo();

  // Set up button event listener
  document
    .getElementById("btn-create-view")
    .addEventListener("click", createNewView);

  debugLog("Initialization complete!");
});

// Hot reload support
Pear.updates(() => {
  debugLog("🔄 Hot reload triggered");
  Pear.reload();
});

debugLog("🍐 Pear Multi-View API Test loaded successfully!");
