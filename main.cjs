const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');
const Menu = electron.Menu;

const ipcMain = electron.ipcMain;

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

    // Load the app
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();

    // Handle CORS
    mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
        (details, callback) => {
            details.requestHeaders['Origin'] = 'http://localhost:5173';
            callback({ requestHeaders: details.requestHeaders });
        }
    );

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Installed printers list
    ipcMain.handle('get-installed-printers', async () => {
        return await mainWindow.webContents.getPrintersAsync();
    });
}

/* ----------------------------------------------------------
   ⭐ NEW PRINT DIRECT HANDLER (THIS ENABLES KOT DIRECT PRINT)
-----------------------------------------------------------*/
ipcMain.handle("print-direct", async (event, { htmlContent, printerName }) => {
    try {
        let printWindow = new BrowserWindow({
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        // Load HTML into invisible window
        printWindow.loadURL(
            "data:text/html;charset=utf-8," +
            encodeURIComponent(htmlContent)
        );

        // Wait for HTML to load, then print silently
        printWindow.webContents.on("did-finish-load", () => {
            printWindow.webContents.print(
                {
                    silent: true,
                    printBackground: true,
                    deviceName: printerName, // ← IMPORTANT
                },
                (success, failureReason) => {
                    if (!success) {
                        console.error("Print failed:", failureReason);
                    }
                    printWindow.close();
                }
            );
        });

        return true;
    } catch (err) {
        console.error("Direct print error:", err);
        return false;
    }
});
/* ------------------------------------------------------ */


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

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
});
