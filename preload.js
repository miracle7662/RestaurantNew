const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getInstalledPrinters: () => ipcRenderer.invoke('get-installed-printers'),

    // ⭐ Direct print support
    printDirect: (htmlContent, printerName) =>
        ipcRenderer.invoke('print-direct', { htmlContent, printerName }),
});
