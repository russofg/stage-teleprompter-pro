const { contextBridge, ipcRenderer } = require("electron");

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Window management
  openStageWindow: () => ipcRenderer.invoke("open-stage-window"),
  closeStageWindow: () => ipcRenderer.invoke("close-stage-window"),
  quitApp: () => ipcRenderer.invoke("quit-app"),

  // System
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  getDisplays: () => ipcRenderer.invoke("get-displays"),

  // File operations
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  writeFile: (filePath, content) =>
    ipcRenderer.invoke("write-file", filePath, content),

  // App info
  getAppVersion: () => process.versions.app,
  getPlatform: () => process.platform,
});
