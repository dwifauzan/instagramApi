const { app, BrowserWindow, ipcMain, protocol } = require('electron')
const path = require('path')
const fs = require('fs-extra')
const axios = require('axios')
const { createWriteStream } = require('fs')
const { join } = require('path')
const { handler } = require('./main/AccountFb/createAccount')
const { instagramHandle } = require('./main/AccountIg/manage')
const { getPrismaClient } = require('./main/prismaClient')
const { handleArsip } = require('./main/repost/handleArsip')
const { handlerRepost } = require('./main/repost/handleRepost')
const { MediaHandler } = require('./main/repost/mediaHandler');
const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const prisma = getPrismaClient()
const appPath = app.isPackaged ? app.getAppPath() : __dirname; // Sesuaikan jalur
const directTarget = 'out/server/pages/';

let mainWindow
const mediaHandler = new MediaHandler(); 

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    })
    const filePath = path.join(appPath, directTarget, 'index.html'); // Path lengkap
    const urlstring = `file://${filePath}`; // Gunakan file:// protocol
    console.log('Loading URL:', urlstring);
    mainWindow.loadURL(urlstring) // Ganti dengan URL dari Next.js
}

async function checkChocolatey() {
    try {
        await execPromise('choco -v');
        console.log('Chocolatey ditemukan.');
        return true;
    } catch (error) {
        console.error('Chocolatey tidak ditemukan:', error);
        return false;
    }
}

async function checkAndInstallFFmpeg() {
    try {
        await execPromise('ffmpeg -version');
        console.log('FFmpeg ditemukan.');
        return true;
    } catch (error) {
        console.error('FFmpeg tidak ditemukan:', error);

        console.log('Menginstal FFmpeg dengan Chocolatey...');
        spawn('powershell.exe', [
            '-Command',
            'Start-Process',
            'cmd.exe',
            '-ArgumentList',
            `'/c winget install ffmpeg'`,
            '-Verb', 'runAs',
        ], {
            stdio: 'inherit',
            shell: true,
        });
        app.quit();
        return false;
    }
}

handler.invoke.forEach((action) => {
    ipcMain.handle(action.name, async (event, data) => {
        const result = await action.togo(data);
        return result
    });
});

instagramHandle.invoke.forEach((action) => {
    ipcMain.handle(action.name, async (event, data) => {
        const result = await action.togo(data);
        return result
    });
});

handleArsip.invoke.forEach((action) => {
    ipcMain.handle(action.name, async (event, data) => {
        const result = await action.togo(data);
        return result
    });
});

handlerRepost.invoke.forEach((action) => {
    ipcMain.handle(action.name, async (event, data) => {
        const result = await action.togo(data);
        return result
    });
});

app.whenReady().then(async () => {
    if (!app.isPackaged) {
        const isAdmin = require('is-admin')();
        if (!isAdmin) {
            console.error('Aplikasi harus dijalankan sebagai administrator.');
            app.quit();
            return;
        }
    }
    if (!(await checkAndInstallFFmpeg())) {
        return;
    }

    if (app.isPackaged) {
        const dbPath = path.join(process.resourcesPath, 'prisma')
        await fs.ensureDir(dbPath)

        // Copy database file jika belum ada
        const dbSource = path.join(__dirname, 'prisma', 'dev.db')
        const dbDest = path.join(dbPath, 'dev.db')
        if (!fs.existsSync(dbDest)) {
            await fs.copy(dbSource, dbDest)
        }

        // Set environment variable untuk lokasi database
        process.env.DATABASE_URL = `file:${dbDest}`
    }

    protocol.interceptFileProtocol('file', (request, callback) => {
        const urlPath = decodeURI(request.url.substr(7));
        const normalizedPath = urlPath.includes('_next')
            ? path.join(appPath, 'out', urlPath.split('_next')[1])
            : path.join(appPath, directTarget, 'index.html');
        callback({ path: normalizedPath });
    });

    process.env.PORTABLE_CHROME_PATH = path.join(app.getAppPath(), '..', 'GoogleChromePortable', 'App', 'Chrome-bin', 'chrome.exe')

    createWindow();
});

// Tambahkan handler untuk graceful shutdown
app.on('before-quit', async (event) => {
    event.preventDefault()
    await disconnectPrisma()
    app.exit()
})
app.on('window-all-closed', async () => {
    await disconnectPrisma()
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.handle('startDownload', async (_, nameArsip, feed, signal) => {
    console.log('Received nameArsip:', nameArsip, feed, signal);
    if (!signal) {
        throw new Error('Download aborted');
    }
    if (!nameArsip) {
        throw new Error('nameArsip is empty');
    }

    try {
        // Cari atau buat Arsip
        console.log('ini masuk')
        const justInCase = await prisma.$transaction(async (prisma) => {
            console.log('ini masuk 2')
            let arsip = await prisma.arsip.upsert({
                where: { nama_arsip: nameArsip },
                update: {},
                create: { nama_arsip: nameArsip }
            })
            console.log('ini adalah arsip id ', arsip.id)
            // Cari atau buat FolderArsip
            // upsert = ketika selama prosess gagal maka semua yang telah di download tidak akan tersimpan di database maupun di local
            const folderArsip = await prisma.folderArsip.upsert({
                where: {
                    id: arsip.id,
                },
                update: {
                    arsipId: arsip.id,
                    like: feed.likeCount,
                    coment: feed.commentCount,
                    sumber: feed.sumber,
                    caption: feed.caption
                },
                create: {
                    caption: feed.caption,
                    like: feed.likeCount,
                    coment: feed.commentCount,
                    arsipId: arsip.id,
                    sumber: feed.sumber,
                },
            });

            // Download media menggunakan MediaHandler dengan nameArsip dan feedId
            const mediaUrls = feed.mediaItems.map(item => item.url);
            const result = await mediaHandler.saveMedia(
                mediaUrls,
                feed.caption,
                nameArsip,
                feed.id.toString(),
            );

            if (!result.success) {
                throw new Error(result.error || 'Failed to download media');
            }
            const TIMEOUT_MS = 80000
            // Simpan setiap media ke DetailContent
            for (let i = 0; i < result.mediaPaths.length; i++) {
                const mediaPath = result.mediaPaths[i];
                const mediaItem = feed.mediaItems[i];

                await Promise.race([prisma.detailContent.upsert({
                    where: {
                        folderArsipId: folderArsip.id,
                    },
                    update: {
                        file_path: mediaPath,
                    },
                    create: {
                        folderArsipId: folderArsip.id,
                        file_path: mediaPath,
                        media_type: mediaItem.mediaType === 'photo' ? 1 : 2,
                    }
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Transaction timed out')), TIMEOUT_MS)
                )
                ])
            }

            return { success: true };
        })
        return justInCase
    } catch (error) {
        console.error('Download or database error:', error);
        throw error;
    }
});

ipcMain.handle('getFeedData', async () => {
    const arsip = await prisma.arsip.findMany({
        include: {
            folder_arsip: {
                include: {
                    detail_content: true,
                },
            },
        },
    })
    return arsip
})