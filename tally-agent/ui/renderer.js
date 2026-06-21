// Elements Reference
const erpWsUrlInput = document.getElementById("erp-ws-url");
const tallyTokenInput = document.getElementById("tally-token");
const tallyHttpUrlInput = document.getElementById("tally-http-url");
const autoStartCheckbox = document.getElementById("auto-start");
const btnSave = document.getElementById("btn-save");

const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");
const toggleTokenBtn = document.getElementById("toggle-token");

const wsIndicator = document.getElementById("ws-indicator");
const wsStatusText = document.getElementById("ws-status-text");
const wsStatusCard = document.getElementById("ws-status-card");

const tallyIndicator = document.getElementById("tally-indicator");
const tallyStatusText = document.getElementById("tally-status-text");
const tallyStatusCard = document.getElementById("tally-status-card");

const consoleLogs = document.getElementById("console-logs");
const btnClearLogs = document.getElementById("btn-clear-logs");
const btnCopyLogs = document.getElementById("btn-copy-logs");

let currentSettings = null;

// Initialize on Load: Ask main process for current settings
window.api.send("get-settings");

// Handle settings received from main process
window.api.on("settings-loaded", (settings) => {
  currentSettings = settings;
  erpWsUrlInput.value = settings.ERP_WS_URL || "";
  tallyTokenInput.value = settings.TALLY_SYNC_TOKEN || "";
  tallyHttpUrlInput.value = settings.TALLY_HTTP_URL || "";
  autoStartCheckbox.checked = settings.autoStart ?? true;
  
  updateControlsState(settings.agentActive);
});

// Update button disable/enable status
function updateControlsState(agentActive) {
  if (agentActive) {
    btnStart.disabled = true;
    btnStop.disabled = false;
  } else {
    btnStart.disabled = false;
    btnStop.disabled = true;
  }
}

// Toggle token field visibility
toggleTokenBtn.addEventListener("click", () => {
  if (tallyTokenInput.type === "password") {
    tallyTokenInput.type = "text";
    toggleTokenBtn.innerHTML = '<i data-lucide="eye-off" class="toggle-eye-icon"></i>';
  } else {
    tallyTokenInput.type = "password";
    toggleTokenBtn.innerHTML = '<i data-lucide="eye" class="toggle-eye-icon"></i>';
  }
  lucide.createIcons();
});

// Handle Settings Form Submit
document.getElementById("settings-form").addEventListener("submit", (e) => {
  e.preventDefault();
  
  const updatedSettings = {
    ERP_WS_URL: erpWsUrlInput.value.trim(),
    TALLY_SYNC_TOKEN: tallyTokenInput.value.trim(),
    TALLY_HTTP_URL: tallyHttpUrlInput.value.trim(),
    autoStart: autoStartCheckbox.checked
  };
  
  // If agent is not started, we assume the user might want to save and run
  // But we let the main process determine if it restarts or not.
  window.api.send("save-settings", updatedSettings);
  
  // Visual feedback
  const originalText = btnSave.textContent;
  btnSave.textContent = "Saved ✓";
  btnSave.classList.add("btn-success");
  setTimeout(() => {
    btnSave.textContent = originalText;
    btnSave.classList.remove("btn-success");
  }, 1500);
});

// Start Sync Trigger
btnStart.addEventListener("click", () => {
  window.api.send("start-agent");
  updateControlsState(true);
});

// Stop Sync Trigger
btnStop.addEventListener("click", () => {
  window.api.send("stop-agent");
  updateControlsState(false);
});

// Handle connection status updates from main process
window.api.on("status-update", (status) => {
  const { wsStatus, tallyStatus } = status;
  
  // 1. Cloud ERP WebSocket status styling
  wsStatusCard.className = "status-item"; // clear
  if (wsStatus === "connected") {
    wsStatusCard.classList.add("connected");
    wsStatusText.textContent = "Connected";
    updateControlsState(true);
  } else if (wsStatus === "connecting") {
    wsStatusCard.classList.add("connecting");
    wsStatusText.textContent = "Connecting...";
    updateControlsState(true);
  } else {
    wsStatusCard.classList.add("disconnected");
    wsStatusText.textContent = "Disconnected";
  }
  
  // 2. Local Tally status styling
  tallyStatusCard.className = "status-item"; // clear
  if (tallyStatus === "active") {
    tallyStatusCard.classList.add("connected");
    tallyStatusText.textContent = "Active (Port 9000)";
  } else {
    tallyStatusCard.classList.add("disconnected");
    tallyStatusText.textContent = "Offline";
  }
});

// Handle real-time logs streamed from main process
window.api.on("log", (logObj) => {
  const { timestamp, level, message } = logObj;
  
  const logLine = document.createElement("div");
  logLine.className = `log-line ${level}`;
  
  const timeSpan = document.createElement("span");
  timeSpan.className = "time";
  timeSpan.textContent = `[${timestamp}]`;
  
  const msgSpan = document.createElement("span");
  msgSpan.textContent = message;
  
  logLine.appendChild(timeSpan);
  logLine.appendChild(msgSpan);
  
  consoleLogs.appendChild(logLine);
  
  // Auto scroll to bottom
  consoleLogs.scrollTop = consoleLogs.scrollHeight;
});

// Clear Logs Terminal
btnClearLogs.addEventListener("click", () => {
  consoleLogs.innerHTML = "";
  appendSystemLog("Console logs cleared.");
});

// Copy Logs to Clipboard
btnCopyLogs.addEventListener("click", () => {
  const textToCopy = consoleLogs.innerText;
  navigator.clipboard.writeText(textToCopy).then(() => {
    const originalText = btnCopyLogs.textContent;
    btnCopyLogs.textContent = "Copied ✓";
    setTimeout(() => {
      btnCopyLogs.textContent = originalText;
    }, 1500);
  });
});

function appendSystemLog(msg) {
  const timestamp = new Date().toLocaleTimeString();
  const logLine = document.createElement("div");
  logLine.className = "log-line system";
  logLine.innerHTML = `<span class="time">[${timestamp}]</span><span>[SYSTEM] ${msg}</span>`;
  consoleLogs.appendChild(logLine);
  consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

// Initialize Lucide icons
lucide.createIcons();
