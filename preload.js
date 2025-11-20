const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getInstalledPrinters: () => ipcRenderer.invoke('get-installed-printers'),
});
