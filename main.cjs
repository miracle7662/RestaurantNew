const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false,
            allowRunningInsecureContent: true,
        },
    });

    // Load React app
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();

    // CORS Handling for API requests
    mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['Origin'] = 'http://localhost:5173';
        callback({ requestHeaders: details.requestHeaders });
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', function () {
    createWindow();
    const template = [];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Ignore SSL certificate errors (development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
});

/* ----------------------------------------
   🔥 SILENT DIRECT PRINT (NO PREVIEW)
-----------------------------------------*/
ipcMain.handle("PRINT_BILL", async (event, htmlContent) => {
     console.log("PRINT_BILL called!");
    console.log("HTML length:", htmlContent?.length);
    const printWindow = new BrowserWindow({
        show: false,
        webPreferences: { offscreen: true }
    });

    await printWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
    );

    printWindow.webContents.print(
        {
            silent: true,
            printBackground: true,
            deviceName: "EPSON TM-T82X Receipt"   // Use default printer
        },
        () => {
            printWindow.close();
        }
    );
});
