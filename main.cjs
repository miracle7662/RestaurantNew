const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const url = require('url');
const Menu = electron.Menu;

const ipcMain = electron.ipcMain;
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

   mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
        details.requestHeaders['Origin'] = 'http://localhost:5173';
        callback({ requestHeaders: details.requestHeaders });
    }
);

// ✅ Add printer log here
mainWindow.webContents.on("did-finish-load", async () => {
  const printers = await mainWindow.webContents.getPrintersAsync();
  console.log("Installed Printers:", printers);
});

   mainWindow.on('closed', () => {
        mainWindow = null;
    });

  // -------------------------
  // IPC Handlers
  // -------------------------

  // Handle get-installed-printers
  ipcMain.handle('get-installed-printers', async () => {
    if (!mainWindow) return [];
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map(p => p.name);
  });

  // Direct KOT Printing (silent)
ipcMain.handle("direct-print", (event, { html, printerName }) => {
  return new Promise((resolve, reject) => {
    try {
      const win = new BrowserWindow({
        width: 302,      // 80mm in px
        height: 600,
        show: false,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
        }
      });

      win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

      win.webContents.on("did-finish-load", () => {
        win.webContents.print({
          silent: true,
          printBackground: true,
          deviceName: printerName,
          margins: { marginType: "none" },

          pageSize: {
            width: 302000,   // 302px
            height: 1000000, // long slip
          }
        }, (success, error) => {
          if (!success) reject(error);
          else resolve(true);

          setTimeout(() => win.close(), 300);
        });
      });
    } catch (err) {
      reject(err);
    }
  });
});


/* ------------------------------------------------------ */

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
