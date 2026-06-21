const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const agentService = require("./agent-service");

let mainWindow = null;
let tray = null;
let isQuitting = false;
const logBuffer = [];
const MAX_LOGS = 200;

// Path to settings file in UserData directory
const settingsPath = path.join(app.getPath("userData"), "settings.json");

// Ensure UserData directory exists
if (!fs.existsSync(app.getPath("userData"))) {
  fs.mkdirSync(app.getPath("userData"), { recursive: true });
}

function loadSettings() {
  const defaultSettings = {
    ERP_WS_URL: "ws://localhost:5000/tally-sync",
    TALLY_SYNC_TOKEN: "tally_secret_token_123",
    TALLY_HTTP_URL: "http://localhost:9000",
    autoStart: true,
    agentActive: true
  };
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf8");
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("Failed to load settings:", err);
  }
  return defaultSettings;
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
    
    // Set auto-launch settings (Only applies to packaged app)
    app.setLoginItemSettings({
      openAtLogin: settings.autoStart,
      path: process.execPath,
      args: ["--hidden"]
    });
  } catch (err) {
    console.error("Failed to save settings:", err);
  }
}

// Redirect console logs to the UI and log buffer
function logToUi(level, ...args) {
  const timestamp = new Date().toLocaleTimeString();
  const message = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : arg).join(" ");
  const formattedLog = { timestamp, level, message };
  
  logBuffer.push(formattedLog);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift();
  }
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("log", formattedLog);
  }
}

// Patch console methods to stream to UI
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  originalLog.apply(console, args);
  logToUi("info", ...args);
};
console.error = (...args) => {
  originalError.apply(console, args);
  logToUi("error", ...args);
};
console.warn = (...args) => {
  originalWarn.apply(console, args);
  logToUi("warn", ...args);
};

// Create the Settings & Monitoring Window
function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 850,
    height: 700,
    minWidth: 700,
    minHeight: 600,
    icon: path.join(__dirname, "ui", "icon.png"), // Optional fallback
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "Continental Tally Sync Agent",
    show: false // Show when ready to prevent flicker
  });

  mainWindow.setMenu(null);

  mainWindow.loadFile(path.join(__dirname, "ui", "index.html"));

  mainWindow.once("ready-to-show", () => {
    // Check if launched via startup --hidden flag
    const shouldHide = process.argv.includes("--hidden");
    if (!shouldHide) {
      mainWindow.show();
    }
  });

  // Intercept close to hide to tray instead of quitting
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Setup System Tray Icon
function setupTray() {
  // Use a default icon or a dummy one if file doesn't exist yet
  const iconPath = path.join(__dirname, "ui", "icon.png");
  
  try {
    tray = new Tray(fs.existsSync(iconPath) ? iconPath : path.join(__dirname, "preload.js")); // Fallback if no icon
  } catch (e) {
    // If it fails on some Windows setups without icon, log and return
    console.error("Failed to create tray icon:", e.message);
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Dashboard",
      click: () => {
        createWindow();
      }
    },
    { type: "separator" },
    {
      label: "Start Agent",
      click: () => {
        const settings = loadSettings();
        settings.agentActive = true;
        saveSettings(settings);
        agentService.start(settings, handleStatusUpdate);
      }
    },
    {
      label: "Stop Agent",
      click: () => {
        const settings = loadSettings();
        settings.agentActive = false;
        saveSettings(settings);
        agentService.stop();
      }
    },
    { type: "separator" },
    {
      label: "Exit",
      click: () => {
        isQuitting = true;
        agentService.stop();
        app.quit();
      }
    }
  ]);

  tray.setToolTip("Continental Tally Sync Agent");
  tray.setContextMenu(contextMenu);

  // Double click tray icon opens settings window
  tray.on("double-click", () => {
    createWindow();
  });
}

// Send WS and Tally status updates to UI
function handleStatusUpdate(wsStatus, tallyStatus) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("status-update", { wsStatus, tallyStatus });
  }
}

// IPC Channels from UI
ipcMain.on("get-settings", (event) => {
  const settings = loadSettings();
  event.reply("settings-loaded", settings);
  
  // Send status immediately on load
  const status = agentService.getStatus();
  event.reply("status-update", status);
  
  // Flush log buffer to new window
  logBuffer.forEach(log => {
    event.reply("log", log);
  });
});

ipcMain.on("save-settings", (event, newSettings) => {
  const currentSettings = loadSettings();
  const mergedSettings = { ...currentSettings, ...newSettings };
  saveSettings(mergedSettings);
  
  console.log("✓ Settings updated and saved.");
  
  // If agent is active, restart it with new configurations
  if (mergedSettings.agentActive) {
    agentService.restart(mergedSettings, handleStatusUpdate);
  } else {
    agentService.stop();
  }
});

ipcMain.on("start-agent", () => {
  const settings = loadSettings();
  settings.agentActive = true;
  saveSettings(settings);
  agentService.start(settings, handleStatusUpdate);
});

ipcMain.on("stop-agent", () => {
  const settings = loadSettings();
  settings.agentActive = false;
  saveSettings(settings);
  agentService.stop();
});

// Single instance lock (prevent running multiple agents)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });

  app.on("ready", () => {
    const settings = loadSettings();
    setupTray();
    
    // Auto-start agent if configured active
    if (settings.agentActive) {
      agentService.start(settings, handleStatusUpdate);
    }
    
    createWindow();
  });
}

app.on("window-all-closed", () => {
  // Overridden to keep running in tray on Windows
  if (process.platform !== "darwin") {
    // Keep running
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
