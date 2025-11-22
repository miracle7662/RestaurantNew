// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getInstalledPrinters: () => ipcRenderer.invoke('get-installed-printers'),
  

  // directPrint(html, printerName) -> returns Promise<boolean>
  directPrint: (html, printerName) =>
    ipcRenderer.invoke('direct-print', { html, printerName }),
});
