/** @typedef {import('pear-interface')} */ /* global Pear */

import { createChildView, ChildViewManager } from "./create-child-view.js";

let childView = null;

// Status display helper
function showStatus(message, type = "info") {
  const statusEl = document.getElementById("status");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  console.log(message);
}

// Create child view
async function handleCreateView() {
  const createBtn = document.getElementById("create-btn");
  const toggleBtn = document.getElementById("toggle-btn");
  const closeBtn = document.getElementById("close-btn");

  try {
    createBtn.disabled = true;
    showStatus("Creating child view...", "info");

    const viewId = await createChildView();

    childView = new ChildViewManager(viewId);

    showStatus(`Child view created! ID: ${viewId}`, "success");

    // Enable other buttons
    toggleBtn.disabled = false;
    closeBtn.disabled = false;
  } catch (error) {
    showStatus(`Failed to create child view: ${error.message}`, "error");
    createBtn.disabled = false;
    console.error("Error creating child view:", error);
  }
}

// Toggle child view visibility
async function handleToggleView() {
  if (!childView) return;

  try {
    const isClosed = await childView.isClosed();
    if (isClosed) {
      showStatus("Child view is closed", "error");
      return;
    }

    await childView.toggle();
    const isVisible = await childView.isVisible();
    showStatus(`Child view ${isVisible ? "shown" : "hidden"}`, "success");
  } catch (error) {
    showStatus(`Error: ${error.message}`, "error");
    console.error("Failed to toggle child view:", error);
  }
}

// Close child view
async function handleCloseView() {
  if (!childView) return;

  try {
    await childView.close();
    showStatus("Child view closed", "success");

    // Reset UI state
    document.getElementById("create-btn").disabled = false;
    document.getElementById("toggle-btn").disabled = true;
    document.getElementById("close-btn").disabled = true;

    childView = null;
  } catch (error) {
    showStatus(`Error: ${error.message}`, "error");
    console.error("Failed to close child view:", error);
  }
}

// Setup event listeners
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("create-btn")
    .addEventListener("click", handleCreateView);
  document
    .getElementById("toggle-btn")
    .addEventListener("click", handleToggleView);
  document
    .getElementById("close-btn")
    .addEventListener("click", handleCloseView);

  showStatus("Ready to create child view", "info");
});

// Hot reload support
Pear.updates(() => Pear.reload());
