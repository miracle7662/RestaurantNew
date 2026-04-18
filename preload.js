// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  getInstalledPrinters: () => ipcRenderer.invoke('get-installed-printers'),
  
  // directPrint(html, printerName) -> returns Promise<boolean>
  directPrint: (html, printerName) =>
    ipcRenderer.invoke('direct-print', { html, printerName }),

  // Config APIs
  loadConfig: () => ipcRenderer.invoke('load-config'),
  hasConfigFile: () => ipcRenderer.invoke('has-config-file'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  testConfig: (config) => ipcRenderer.invoke('test-config', config),
});
