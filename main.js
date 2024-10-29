const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadURL('http://localhost:3000'); // Ini adalah URL dari Next.js
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const https = require('https');

function generateRandomFolderName() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.loadURL('http://localhost:3000');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('selectDownloadDirectory', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
    });
    return result;
});

ipcMain.handle('downloadFile', async (event, url, downloadPath, mediaType, caption) => {
    const folderName = generateRandomFolderName();
    const targetPath = path.join(downloadPath, folderName);
    await fs.ensureDir(targetPath);
    const fileExtension = mediaType === 'video' ? '.mp4' : '.jpg';
    const fileName = `${caption || 'media'}${fileExtension}`.replace(/[^a-zA-Z0-9]/g, '_');
    const fullFilePath = path.join(targetPath, fileName);

    const file = fs.createWriteStream(fullFilePath);

    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(fullFilePath);
            });
        }).on('error', (err) => {
            fs.unlink(fullFilePath);
            reject(err);
        });
    });
})})
