const electron = require("electron");
const { app, BrowserWindow, Menu, ipcMain } = electron;
const path = require("path");

const isDev = !app.isPackaged;
const { spawn } = require("child_process");
const fs = require('fs');

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
      const win = new BrowserWindow({width: 302, height: 600,  show: false,
          icon: path.resolve(__dirname, 'build/icon.ico'),
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

// Config IPC Handlers
const axios = require('axios');

ipcMain.handle('load-config', async () => {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
    // Default config
    return {
      serverIP: 'localhost',
      port: 3001,
      dbHost: 'localhost',
      dbPort: 3306,
      dbName: 'restaurant_db',
      dbUser: 'root',
      dbPass: ''
    };
  } catch (error) {
    console.error('Load config error:', error);
    return null;
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    if (!config.serverIP || !config.port) {
      throw new Error('Server IP and port required');
    }
    const configPath = path.join(app.getPath('userData'), 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Save config error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-config', async (event, config) => {
  
  try {
    console.log('=== TEST CONFIG START ===', JSON.stringify(config, null, 2));
    
    const apiUrl = `http://${config.serverIP}:${config.port}`;
    console.log('Testing API:', apiUrl);
    
    // Test backend API
    const apiResponse = await axios.get(`${apiUrl}/api/health`, { timeout: 5000 });
    console.log('API test OK:', apiResponse.status);
    if (apiResponse.status !== 200) {
      throw new Error('Backend not responding');
    }
    
    // Test frontend DB config with temp pool
    const dbTestConfig = {
      host: config.dbHost || 'localhost',
      port: config.dbPort || 3306,
      user: config.dbUser || 'root',
      password: config.dbPass || '',
      database: config.dbName || 'restaurant_db',
      connectTimeout: 5000
    };
    console.log('DB Test Config:', JSON.stringify(dbTestConfig, null, 2));
    
   
    
    console.log('=== TEST CONFIG COMPLETE ===');
    return { success: true, apiUrl };
  } catch (error) {
    console.error('Test config error:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
});

/* =========================
   Backend start
   ========================= */
function startBackend() {
  const isDev = !app.isPackaged;

  try {
    const backendPath = isDev
      ? path.join(__dirname, "backend", "server.js")
      : path.join(process.resourcesPath, "app.asar.unpacked", "backend", "server.js");

    console.log("🚀 Starting backend...");
    console.log("Backend Path:", backendPath);

    // ✅ Pass userData path
    if (!isDev) {
      process.env.ELECTRON_USER_DATA_PATH = app.getPath("userData");
    }

    // ✅ Use exported functions
      // ✅ FIXED
    const backend = require(backendPath);
    backend.startServer();


  } catch (err) {
     console.error("❌ Backend failed:", err);
  }
}

/* =========================
   Create Main Window
   ========================= */
function createWindow() {
mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    icon: path.resolve(__dirname, 'build/icon.ico'),
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  // Modify headers for development
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      if (isDev) {
        details.requestHeaders["Origin"] = "http://localhost:5173";
      }
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  // Get printers once the page finishes loading
  mainWindow.webContents.on("did-finish-load", async () => {
    const printers = await mainWindow.webContents.getPrintersAsync();
    // console.log("Installed Printers:", printers);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}



/* =========================
   App Events - FIXED
   ========================= */
app.whenReady().then(async () => {
  // console.log('🚀 App starting...');
  
  // Set Windows app user model ID for proper taskbar icon
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.miracle.restaurant.app');
  }
  
  // 1. Pehle backend start
  startBackend();
  
  // 2. 4 second wait backend ready hone tak
  // console.log('⏳ Waiting for backend (4 sec)...');
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  // 3. Ab window banao
  // console.log('✅ Creating window...');
  createWindow();
  // Menu.setApplicationMenu(null);
});

// Clear auth data on app close (before quit)
app.on("before-quit", () => {
  // Clear localStorage and sessionStorage to logout user
  const { session } = require("electron");
  session.defaultSession.clearStorageData({
    storages: ["localStorage", "sessionStorage"],
  });
});

app.on("window-all-closed", () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

