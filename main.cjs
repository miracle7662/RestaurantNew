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

  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    console.log("Raw printers from Electron:", printers);

    let mappedPrinters = printers.map(p => ({
      name: p.name,
      displayName: p.displayName || p.name
    }));

    // If no printers found, provide mock printers for testing
    if (mappedPrinters.length === 0) {
      console.log("No printers found, using mock printers for testing");
      mappedPrinters = [
        { name: "Thermal_Printer_1", displayName: "Thermal Printer 1 (Mock)" },
        { name: "Thermal_Printer_2", displayName: "Thermal Printer 2 (Mock)" },
        { name: "Default_Printer", displayName: "Default Printer (Mock)" }
      ];
    }

    console.log("Mapped printers:", mappedPrinters);
    return mappedPrinters;
  } catch (error) {
    console.error("Error getting printers:", error);
    // Return mock printers on error for testing
    return [
      { name: "Thermal_Printer_1", displayName: "Thermal Printer 1 (Mock)" },
      { name: "Thermal_Printer_2", displayName: "Thermal Printer 2 (Mock)" },
      { name: "Default_Printer", displayName: "Default Printer (Mock)" }
    ];
  }
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

   // Pass userData path to backend for uploads
  const env = { ...process.env };
  if (!isDev) {
    env.ELECTRON_USER_DATA_PATH = app.getPath("userData");
  }

  backendProcess = spawn('node', [backendPath], {
    cwd: path.dirname(backendPath),
    stdio: "inherit",
    windowsHide: true,
    env: env,
  });

  backendProcess.on("close", (code) => {
    console.log(`Backend exited with code ${code}`);
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
    console.log("Installed Printers on load:", printers);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/* =========================
   App Events
   ========================= */
app.whenReady().then(() => {
  startBackend();   // ✅ backend auto-start
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
