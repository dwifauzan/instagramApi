const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs-extra')
const axios = require('axios')
const { createWriteStream } = require('fs')
const { join } = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

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

ipcMain.handle('startDownload', async (_, nameArsip, feed, signal) => {
    console.log('Received nameArsip:', nameArsip)

    if (signal.aborted) {
        throw new Error('Download aborted')
    }

    if (!nameArsip) {
        console.error('nameArsip is empty')
        return
    }

    // Path folder tempat arsip disimpan
    const folderPath = join(
        `${__dirname}/public/${nameArsip}`,
        feed.id.toString()
    )
    console.log('Folder Path:', folderPath)
    await fs.mkdir(folderPath, { recursive: true }).catch((err) => {
        console.error('Error creating folder:', err)
    })

    try {
        // Cari atau buat Arsip
        let arsip = await prisma.arsip.findUnique({
            where: { nama_arsip: nameArsip },
        })
        if (!arsip) {
            arsip = await prisma.arsip.create({
                data: { nama_arsip: nameArsip },
            })
        }

        // Cari atau buat FolderArsip
        let folderArsip = await prisma.folderArsip.findFirst({
            where: {
                caption: feed.caption,
                arsipId: arsip.id,
            },
        })
        if (!folderArsip) {
            folderArsip = await prisma.folderArsip.create({
                data: {
                    caption: feed.caption,
                    like: feed.likeCount,
                    coment: feed.commentCount,
                    arsipId: arsip.id,
                },
            })
        }

        // Download setiap media item dalam feed dan simpan di DetailContent
        for (let index = 0; index < feed.mediaItems.length; index++) {
            const mediaItem = feed.mediaItems[index]

            await downloadFile(
                mediaItem.url,
                folderPath,
                mediaItem.mediaType,
                mediaItem.mediaType === 'photo' ? 1 : 2, // Sesuaikan media_type
                folderArsip.id,
                index,
                feed.mediaType === 8
            )
        }
    } catch (error) {
        console.error('Download or database error:', error)
    }
})

const downloadFile = async (
    url,
    folderPath,
    mediaType,
    type,
    arsipId,
    index = 0,
    isCarousel = false
) => {
    const response = await axios.get(url, { responseType: 'stream' })
    const fileExtension =
        mediaType === 'photo' ? '.jpg' : mediaType === 'video' ? '.mp4' : ''
    const fileName = `untitled${
        isCarousel ? `-${index + 1}` : ''
    }${fileExtension}`
    const filePath = join(folderPath, fileName)

    const writer = createWriteStream(filePath)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', async () => {
            try {
                // Cek apakah sudah ada DetailContent untuk arsip ini
                const existingDetail = await prisma.detailContent.findUnique({
                    where: { folderArsipId: arsipId },
                })

                // Buat hanya jika tidak ada entry sebelumnya
                if (!existingDetail) {
                    await prisma.detailContent.create({
                        data: {
                            file_path: filePath,
                            media_type: type,
                            folderArsipId: arsipId,
                        },
                    })
                }
                resolve()
            } catch (error) {
                reject(error)
            }
        })
        writer.on('error', reject)
    })
}

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