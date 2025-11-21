const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

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
      allowRunningInsecureContent: true,
    },
  });

  // Load frontend
  mainWindow.loadURL('http://localhost:5173');
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // CORS fix for frontend
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      details.requestHeaders['Origin'] = 'http://localhost:5173';
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  // Remove default menu
  Menu.setApplicationMenu(Menu.buildFromTemplate([]));

  // -------------------------
  // IPC Handlers
  // -------------------------

  // Get list of installed printers
  ipcMain.handle('get-installed-printers', async () => {
    if (!mainWindow) return [];
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map(p => p.name);
  });

  // Direct KOT Printing (silent)
  ipcMain.handle('print-direct', async (event, { htmlContent, printerName }) => {
  try {
    if (!mainWindow) throw new Error('Main window not initialized.');

    const printers = await mainWindow.webContents.getPrintersAsync();
    console.log('Available Printers:', printers.map(p => p.name));

    let printer = printers.find(p => p.name === printerName);

    // If printer not found, fallback to PDF
    if (!printer || printer.name.toLowerCase().includes('pdf')) {
      console.warn(`Printer '${printerName}' not found or is a virtual PDF printer. Saving as PDF instead.`);

      const printWindow = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } });
      await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

      // Wait for content to fully load
      await printWindow.webContents.executeJavaScript(`
        new Promise(resolve => {
          if (document.readyState === 'complete') resolve();
          else window.onload = resolve;
        });
      `);

      // Generate PDF
      const pdfData = await printWindow.webContents.printToPDF({ printBackground: true });
      const fs = require('fs');
      const pdfPath = path.join(app.getPath('desktop'), 'kot.pdf');
      fs.writeFileSync(pdfPath, pdfData);
      printWindow.close();

      console.log('✅ KOT saved as PDF:', pdfPath);
      return { success: true, message: `KOT saved as PDF: ${pdfPath}` };
    }

    // Real printer flow
    const printWindow = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } });
    await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

    await printWindow.webContents.executeJavaScript(`
      new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.onload = resolve;
      });
    `);

    await new Promise((resolve, reject) => {
      printWindow.webContents.print(
        { silent: true, printBackground: true, deviceName: printer.name },
        (success, errorType) => {
          printWindow.close();
          if (!success) reject(new Error(errorType));
          else resolve(true);
        }
      );
    });

    console.log(`✅ KOT printed to: ${printer.name}`);
    return { success: true, printerUsed: printer.name };
  } catch (err) {
    console.error('PrintDirect Error:', err);
    return { success: false, message: err.message };
  }
});

}

// -------------------------
// App Events
// -------------------------
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on(
  'certificate-error',
  (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
  }
);
