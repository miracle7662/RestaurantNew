const electron = require("electron");
const { app, BrowserWindow, Menu, ipcMain } = electron;
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let backendProcess;

/* =========================
   IPC HANDLERS (GLOBAL)
   ========================= */

// Handle get-installed-printers
ipcMain.handle("get-installed-printers", async () => {
  if (!mainWindow) return [];
  const printers = await mainWindow.webContents.getPrintersAsync();
  return printers.map(p => ({
    name: p.name,
    displayName: p.displayName || p.name
  }));
});

// Direct KOT Printing (silent)
ipcMain.handle("direct-print", (event, { html, printerName }) => {
  return new Promise((resolve, reject) => {
    try {
      const win = new BrowserWindow({
        width: 302,
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
            width: 302000,
            height: 1000000,
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

/* =========================
   Backend start
   ========================= */
function startBackend() {
  const isDev = !app.isPackaged;
  const backendPath = isDev
    ? path.join(__dirname, "backend", "server.js")
    : path.join(process.resourcesPath, "backend", "server.js");

  // 🔥 DEBUG LOGS - Yeh console mein dikhega
  console.log('🔍 isPackaged:', app.isPackaged);
  console.log('🔍 Backend Path:', backendPath);
  console.log('🔍 Path exists:', require('fs').existsSync(backendPath));
  console.log('🔍 ResourcesPath:', process.resourcesPath);

  const env = { ...process.env };
  if (!isDev) {
    env.ELECTRON_USER_DATA_PATH = app.getPath("userData");
  }

  backendProcess = spawn('node', [backendPath], {
    cwd: path.dirname(backendPath),
    stdio: "inherit",
    windowsHide: false,  // 🔥 SHOW console for debug
    env: env,
  });

  backendProcess.on("close", (code) => {
    console.log(`Backend exited with code ${code}`);
  });

  backendProcess.on("error", (err) => {
    console.error(`Backend spawn ERROR:`, err.message);
  });
}

/* =========================
   Create Main Window
   ========================= */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // ✅ Use outer scope isDev (move it up or pass as param)
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      details.requestHeaders["Origin"] = "http://localhost:5173";
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  mainWindow.webContents.on("did-finish-load", async () => {
    const printers = await mainWindow.webContents.getPrintersAsync();
    console.log("Installed Printers:", printers);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/* =========================
   App Events - FIXED
   ========================= */
app.whenReady().then(async () => {
  console.log('🚀 App starting...');
  
  // 1. Pehle backend start
  startBackend();
  
  // 2. 4 second wait backend ready hone tak
  console.log('⏳ Waiting for backend (4 sec)...');
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  // 3. Ab window banao
  console.log('✅ Creating window...');
  createWindow();
});
