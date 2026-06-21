const { contextBridge, ipcRenderer } = require("electron");

// Expose safe IPC channels to the GUI renderer process
contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    const validChannels = ["save-settings", "start-agent", "stop-agent", "get-settings"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  on: (channel, func) => {
    const validChannels = ["log", "status-update", "settings-loaded"];
    if (validChannels.includes(channel)) {
      // Wrap the callback to exclude the electron event object (for security)
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      
      // Return a cleanup function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
  }
});
