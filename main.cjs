const electron = require('electron');
const { app, BrowserWindow, Menu, ipcMain } = electron;
const path = require('path');

let mainWindow;

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

  // Load your frontend app
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

  // Handle get-installed-printers
  ipcMain.handle('get-installed-printers', async () => {
    if (!mainWindow) return [];
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map(p => p.name);
  });

  /* ------------------------------------------------------
     ⭐ Print Direct Handler (Silent KOT Printing)
  ------------------------------------------------------ */
  ipcMain.handle('print-direct', async (event, { htmlContent, printerName }) => {
    try {
      if (!mainWindow) throw new Error("Main window not initialized.");

      // Get all installed printers
      const printers = await mainWindow.webContents.getPrintersAsync();
      console.log("Available Printers:", printers.map(p => p.name));

      // Try to find exact printer
      let printerToUse = printers.find(p => p.name === printerName);
      let message = `Printing to '${printerName}'.`;

      // Fallback to default if printer not found
      if (!printerToUse) {
        const defaultPrinter = printers.find(p => p.isDefault);
        if (defaultPrinter) {
          console.warn(`⚠️ Printer '${printerName}' not found. Falling back to default printer '${defaultPrinter.name}'.`);
          printerToUse = defaultPrinter;
          message = `⚠️ Printer '${printerName}' not found. Used default printer '${defaultPrinter.name}'.`;
        } else {
          throw new Error(`❌ Printer '${printerName}' not found and no default printer available.`);
        }
      }

      // Create invisible window for printing
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

      // Silent print
      await new Promise((resolve, reject) => {
        printWindow.webContents.print(
          {
            silent: true,
            printBackground: true,
            deviceName: printerToUse.name,
          },
          (success, errorType) => {
            printWindow.close();
            if (!success) reject(new Error(errorType));
            else resolve(true);
          }
        );
      });

      console.log(`✅ Successfully printed to '${printerToUse.name}'`);
      return { success: true, message, printerUsed: printerToUse.name };
    } catch (err) {
      console.error("PrintDirect Error:", err);
      return { success: false, message: err.message };
    }
  });
}

/* --------------------------------------
   App Ready
----------------------------------------*/
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});
