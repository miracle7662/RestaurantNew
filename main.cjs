const electron = require("electron");
const { app, BrowserWindow, Menu, ipcMain } = electron;
const path = require("path");

const isDev = !app.isPackaged;
const { spawn } = require("child_process");
const fs = require('fs');

let mainWindow;
let backendProcess;

/* =========================
   HELPERS
   ========================= */

function getSystemIPv4() {
  try {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  } catch (error) {
    console.error('Get system IPv4 failed:', error);
    return '127.0.0.1';
  }
}

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
const mysql = require('mysql2/promise');

ipcMain.handle('load-config', async () => {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    let config;
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(data);
    } else {
      // Default config
      config = {
        serverIP: 'localhost',
        port: 3001,
        dbHost: 'localhost',
        dbPort: 3306,
        dbName: 'restaurant_db',
        dbUser: 'root',
        dbPass: ''
      };
    }
    // Auto-inject real IPv4 if saved IP is localhost/127.0.0.1 OR network changed
    const systemIP = getSystemIPv4();
    const savedIP = (config.serverIP || '').trim().toLowerCase();
    if (savedIP === 'localhost' || savedIP === '127.0.0.1' || !config.serverIP) {
      config.serverIP = systemIP;
      console.log('🔄 load-config: Auto-injected serverIP (localhost):', systemIP);
    } else if (savedIP !== systemIP) {
      config.serverIP = systemIP;
      console.log('🔄 load-config: Auto-updated serverIP (network changed):', systemIP, '(was', config.serverIP, ')');
    }
    const dbHost = (config.dbHost || '').trim().toLowerCase();
    if (dbHost === 'localhost' || dbHost === '127.0.0.1' || !config.dbHost) {
      config.dbHost = systemIP;
      console.log('🔄 load-config: Auto-injected dbHost (localhost):', systemIP);
    } else if (dbHost !== systemIP) {
      config.dbHost = systemIP;
      console.log('🔄 load-config: Auto-updated dbHost (network changed):', systemIP, '(was', config.dbHost, ')');
    }
    return config;
  } catch (error) {
    console.error('Load config error:', error);
    return null;
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    if (!config.port) {
      throw new Error('Server port required');
    }
    // Auto-detect IP if serverIP is blank
    if (!config.serverIP) {
      config.serverIP = getSystemIPv4();
      console.log('🔄 save-config: Auto-filled serverIP:', config.serverIP);
    }
    // Auto-fill dbHost with serverIP if blank
    if (!config.dbHost) {
      config.dbHost = config.serverIP;
    }
    const configPath = path.join(app.getPath('userData'), 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // Restart backend with new config (for immediate DB env vars)
    if (backendProcess) {
      backendProcess.kill();
    }
    startBackendWithConfig(config);
    
    return { success: true };
  } catch (error) {
    console.error('Save config error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('has-config-file', async () => {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    return fs.existsSync(configPath);
  } catch (error) {
    console.error('Has config file check failed:', error);
    return false;
  }
});

ipcMain.handle('get-system-ipv4', async () => {
  return getSystemIPv4();
});

ipcMain.handle('test-config', async (event, config) => {
  try {
    console.log('=== TEST CONFIG START ===', JSON.stringify(config, null, 2));
    
    const apiUrl = `http://${config.serverIP}:${config.port}`;
    
    // 1. Test backend API health
    console.log('🌐 Testing API:', apiUrl);
    const apiResponse = await axios.get(`${apiUrl}/api/health`, { timeout: 5000 });
    if (apiResponse.status !== 200) {
      throw new Error(`Backend API failed: ${apiResponse.status}`);
    }
    
    // 2. Test MySQL connection
    console.log('🗄️ Testing MySQL...');
    const dbTestConfig = {
      host: config.dbHost || 'localhost',
      port: config.dbPort || 3306,
      user: config.dbUser || 'root',
      password: config.dbPass || '',
      database: config.dbName || 'restaurant_db',
      connectTimeout: 5000,
      acquireTimeout: 5000
    };
    
    const testConnection = await mysql.createConnection(dbTestConfig);
    await testConnection.execute('SELECT 1');
    await testConnection.end();
    
    console.log('✅ MySQL test OK');
    console.log('=== TEST CONFIG COMPLETE ===');
    return { 
      success: true, 
      apiUrl,
      dbConnected: true,
      message: `Connected to ${apiUrl} + MySQL ${dbTestConfig.host}:${dbTestConfig.port}`
    };
  } catch (error) {
    console.error('❌ Test config failed:', error.message);
    return { 
      success: false, 
      error: error.message,
      dbConnected: false
    };
  }
});

// Helper: Start backend with config env vars
function startBackendWithConfig(config) {
  const backendPath = isDev
    ? path.join(__dirname, "backend", "server.js")
    : path.join(process.resourcesPath, "app.asar.unpacked", "backend", "server.js");

  // Set DB env vars for backend
  process.env.DB_HOST = config.dbHost || 'localhost';
  process.env.DB_PORT = config.dbPort?.toString() || '3306';
  process.env.DB_USER = config.dbUser || 'root';
  process.env.DB_PASSWORD = config.dbPass || '';
  process.env.DB_NAME = config.dbName || 'restaurant_db';
  
  process.env.ELECTRON_USER_DATA_PATH = app.getPath('userData');
  
  try {
    const backend = require(backendPath);
    backend.startServer();
    console.log('🔄 Backend restarted with new DB config');
  } catch (err) {
    console.error('❌ Backend restart failed:', err);
  }
}

/* =========================
   Backend start
   ========================= */
function startBackend() {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  let config = null;
  
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('✅ Found existing config, setting DB env vars');
    } catch (err) {
      console.error('Config parse failed:', err);
    }
  }
  
  // Set DB env vars from config (if exists) for backend
  if (config) {
    process.env.DB_HOST = config.dbHost || 'localhost';
    process.env.DB_PORT = config.dbPort?.toString() || '3306';
    process.env.DB_USER = config.dbUser || 'root';
    process.env.DB_PASSWORD = config.dbPass || '';
    process.env.DB_NAME = config.dbName || 'restaurant_db';
  }
  
  process.env.ELECTRON_USER_DATA_PATH = app.getPath('userData');

  const backendPath = isDev
    ? path.join(__dirname, "backend", "server.js")
    : path.join(process.resourcesPath, "app.asar.unpacked", "backend", "server.js");

  try {
    console.log("🚀 Starting backend with DB config...");
    console.log("Backend Path:", backendPath);
    
    const backend = require(backendPath);
    backend.startServer();
  } catch (err) {
    console.error("❌ Backend start failed:", err);
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

