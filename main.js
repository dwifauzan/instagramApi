// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs-extra')
const axios = require('axios')
const { createWriteStream } = require('fs')
const { join } = require('path')

let mainWindow


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

    mainWindow.loadURL('http://localhost:3000') // Ganti dengan URL dari Next.js

    mainWindow.webContents.on('did-finish-load', async () => {
        try {
            const response = await axios.get(
                'http://localhost:3000/hexadash-nextjs/feedsDataDummy.json'
            )
            feedsData = response.data.data // Simpan data feeds ke variabel
        } catch (error) {
            console.error('Failed to fetch feeds data:', error)
        }
    })
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.handle('selectDownloadDirectory', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
    })
    return result.filePaths[0]
})

const downloadFile = async (
    url,
    folderPath,
    mediaType,
    caption,
    mainWindow,
    index = 0,
    isCarousel = false
) => {
    const response = await axios.get(url, { responseType: 'stream' })

    const fileExtension =
        mediaType === 'photo' ? '.jpg' : mediaType === 'video' ? '.mp4' : ''
    const fileName = isCarousel
        ? `untitled-${index + 1}${fileExtension}`
        : `untitled${fileExtension}`
    const filePath = join(folderPath, fileName)
    const captionPath = join(folderPath, 'caption.txt')

    const total = parseInt(response.headers['content-length'], 10)
    let downloaded = 0

    response.data.on('data', (chunk) => {
        downloaded += chunk.length
        const progress = Math.round((downloaded / total) * 100)
        mainWindow.webContents.send('download-progress', { url, progress })
    })

    const writer = createWriteStream(filePath)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', async () => {
            await fs.writeFile(captionPath, caption, 'utf-8')
            resolve()
        })
        writer.on('error', reject)
    })
}

// Ganti fungsi ini untuk menggunakan feedsData
ipcMain.handle('startDownload', async (_, directory, feed) => {
    const mediaItems = feed.mediaItems
    const folderName = feed.id // Gunakan ID sebagai nama folder
    const folderPath = join(directory, folderName)
    await fs.mkdir(folderPath, { recursive: true })

    if (feed.mediaType === 8) {
        for (let index = 0; index < mediaItems.length; index++) {
            const mediaItem = mediaItems[index]
            await downloadFile(
                mediaItem.url,
                folderPath,
                mediaItem.mediaType,
                feed.caption,
                mainWindow,
                index,
                true
            )
        }
    } else {
        await downloadFile(
            mediaItems[0].url,
            folderPath,
            mediaItems[0].mediaType,
            feed.caption,
            mainWindow
        )
    }
})
