const { app, BrowserWindow, ipcMain, screen } = require('electron');
const fs = require('fs');
const path = require('path');

const configPath = path.join(app.getPath('userData'), 'lol-timer-config.json');

let controlWindow;
let overlayWindow;
let saveTimeout;

function createWindows() {
    let savedX = undefined;
    let savedY = undefined;

    try {
        if (fs.existsSync(configPath)) {
            const savedData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            savedX = savedData.x;
            savedY = savedData.y;
        }
    } catch (e) {
        console.log("Error reading config", e);
    }

    const { width } = screen.getPrimaryDisplay().workAreaSize;
    const defaultX = (width / 2) - 300;
    const defaultY = 100;

    controlWindow = new BrowserWindow({
        width: 700,
        height: 970,
        title: "Settings",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    controlWindow.loadFile('index.html');

    overlayWindow = new BrowserWindow({
        width: 600,
        height: 200,
        x: savedX !== undefined ? savedX : defaultX,
        y: savedY !== undefined ? savedY : defaultY,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        hasShadow: false,
        resizable: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    overlayWindow.loadFile('overlay.html');
    controlWindow.on('closed', () => app.quit());

    overlayWindow.on('move', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveCurrentState();
        }, 500);
    });
}

function saveCurrentState(newData = {}) {
    try {
        let currentConfig = {};
        if (fs.existsSync(configPath)) {
            currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
        if (overlayWindow && !overlayWindow.isDestroyed()) {
            const bounds = overlayWindow.getBounds();
            currentConfig.x = bounds.x;
            currentConfig.y = bounds.y;
        }

        const finalConfig = { ...currentConfig, ...newData };
        fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2));
        console.log("Config saved (Position + Data)");

    } catch (e) {
        console.error("Error saving config:", e);
    }
}

ipcMain.on('load-config', (event) => {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            event.reply('config-loaded', JSON.parse(data));
        } else {
            event.reply('config-loaded', null);
        }
    } catch (e) { console.error(e); }
});

ipcMain.on('save-config', (event, data) => {
    saveCurrentState(data);
});

ipcMain.on('settings-changed', (event, data) => {
    if (overlayWindow) overlayWindow.webContents.send('update-visuals', data);
});

ipcMain.on('resize-overlay', (event, bounds) => {
    if (overlayWindow) {
        overlayWindow.setContentSize(Math.ceil(bounds.width + 25), Math.ceil(bounds.height + 25));
    }
});

ipcMain.on('report-scale-change', (event, newScale) => {
    if (controlWindow) {
        controlWindow.webContents.send('sync-scale', newScale);
    }
});

app.whenReady().then(createWindows);