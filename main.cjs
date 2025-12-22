const electron = require("electron");
const { app, BrowserWindow, Menu, ipcMain } = electron;
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let backendProcess;

// -------------------------
// Backend start
// -------------------------
function startBackend() {
  const isDev = !app.isPackaged;

  const backendPath = isDev
    ? path.join(__dirname, "backend", "server.js")
    : path.join(process.resourcesPath, "backend", "server.js");

  backendProcess = spawn('node', [backendPath], {
    cwd: path.dirname(backendPath),
    stdio: "inherit",
    windowsHide: true,
  });

  // -------------------------
  // IPC Handlers
  // -------------------------

  // Handle get-installed-printers
  ipcMain.handle('get-installed-printers', async () => {
    if (!mainWindow) return [];
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map(p => p.name); // Return only printer names
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

  backendProcess.on("close", (code) => {
    console.log(`Backend exited with code ${code}`);
  });
}

// -------------------------
// Create Main Window
// -------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const indexPath = path.join(__dirname, "dist", "index.html");
    mainWindow.loadFile(indexPath);
  }

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
}


// -------------------------
// App Events
// -------------------------
app.whenReady().then(() => {
  startBackend();   // yahan se backend hamesha auto-start hoga
  createWindow();
});

app.on("window-all-closed", () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on(
  "certificate-error",
  (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
  }
);
