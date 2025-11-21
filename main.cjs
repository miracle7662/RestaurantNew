const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

// -------------------------
// IPC Handlers
// -------------------------

// Installed printers
ipcMain.handle('get-installed-printers', async () => {
  if (!mainWindow) return [];
  const printers = await mainWindow.webContents.getPrintersAsync();
  return printers.map(p => p.name);
});

// Direct KOT printing
ipcMain.handle('print-direct', async (event, { htmlContent, printerName }) => {
  try {
    if (!mainWindow) throw new Error("Main window not initialized");

    const printers = await mainWindow.webContents.getPrintersAsync();
    console.log("Installed Printers:", printers.map(p => p.name));

    const printer = printers.find(p => p.name === printerName);
    if (!printer) throw new Error(`Printer '${printerName}' not found.`);

    const printWindow = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } });
    await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

    // Wait until content is fully loaded
    await printWindow.webContents.executeJavaScript('new Promise(resolve => { if (document.readyState === "complete") resolve(); else window.onload = resolve; })');

    // Silent print
    await new Promise((resolve, reject) => {
      printWindow.webContents.print({ silent: true, printBackground: true, deviceName: printer.name }, (success, failureReason) => {
        printWindow.close();
        if (!success) reject(new Error(failureReason));
        else resolve(true);
      });
    });

    console.log("✅ KOT Printed to:", printer.name);
    return { success: true, printerUsed: printer.name };
  } catch (err) {
    console.error("PrintDirect Error:", err);
    return { success: false, error: err.message };
  }
});

// -------------------------
// Create Main Window
// -------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  mainWindow.loadURL('http://localhost:5173');
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([]));
}

// -------------------------
// App Events
// -------------------------
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});
