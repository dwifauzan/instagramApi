import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { NextApiRequest, NextApiResponse } from 'next'
import { Public } from '@prisma/client/runtime/library'

interface DetailContent {
    id: number
    file_path: string
    media_type: number // 1 for images, 2 for videos
    folderArsipId: number
}

interface FolderArsip {
    id: number
    detail_content: DetailContent
    caption: string
    like: number
    coment: number
    created_at: string
    isExecuted: boolean
}

const PostLangsung = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        try {
            const { mediaFiles, access_token, users, caption } = req.body
            const browser = await puppeteer.launch({
                headless: false,
                args: [
                    '--disable-notifications', // Nonaktifkan semua notifikasi
                    '--disable-infobars', // Nonaktifkan infobar "Chrome is being controlled by automated test software"
                    '--disable-popup-blocking', // Nonaktifkan pemblokiran pop-up
                ],
                defaultViewport: null,
            })
            const page = await browser.newPage()
            const cookies = JSON.parse(access_token)
            await page.setCookie(...cookies)
            await page.goto('https://business.facebook.com/latest/composer', {
                waitUntil: 'networkidle2',
            })
            await new Promise((resolve) => setTimeout(resolve, 2000))

            // Buka dropdown pertama kali
            await page.click('[role="combobox"]')

            // Ambil semua opsi yang tersedia
            let options = await page.$$('[role="option"]')

            // Iterasi melalui setiap opsi
            for (let i = 0; i < options.length; i++) {
                // Pastikan elemen masih valid
                options = await page.$$('[role="option"]') // Ambil ulang elemen setiap iterasi
                const option = options[i]

                if (option) {
                    // Ambil teks dari opsi
                    const text = await option.evaluate((el) =>
                        el.textContent?.trim()
                    )
                    // Skip jika elemen adalah "Save Preference"
                    if (text === 'Save preference') {
                        console.log('Mengabaikan opsi Save Preference')
                        continue
                    }
                    // Periksa apakah teks tidak ada dalam daftar pengguna
                    if (text && !users.includes(text)) {
                        await option.click() // Klik elemen
                        console.log(`Opsi "${text}" dipilih.`)

                        // Tunggu sedikit agar interaksi selesai
                        await new Promise((resolve) => setTimeout(resolve, 500))
                    }
                }
            }

            // Tutup dropdown setelah semua opsi selesai
            await page.click('[role="combobox"]')
            await new Promise((resolve) => setTimeout(resolve, 2000))

            const filename = path.basename(mediaFiles)
            // console.log(filename)
            const mediaPath = path.join(
                process.cwd(),
                'public',
                'repost',
                filename
            )
            // console.log(mediaPath)

            const facebookPathPhotos = '[aria-label="Select adding photos."]'
            const facebookPathVideo = '[aria-label="Select adding a video."]'
            const isPhotosPresent = (await page.$(facebookPathPhotos)) !== null
            const isVideoPresent = (await page.$(facebookPathVideo)) !== null

            const extensiFile = path.extname(mediaPath).toLowerCase()
            const mediaFilePath = path.join(mediaPath)
            if (fs.existsSync(mediaFilePath)) {
                const mediaDirectoryPath = fs.statSync(mediaPath).isDirectory()
                    ? mediaPath
                    : path.dirname(mediaPath)
                const files = fs.readdirSync(mediaDirectoryPath)
                const splitPath = mediaFilePath.split('/')
                splitPath.pop()
                const resultPath = splitPath.join('/')
                if (isPhotosPresent || isVideoPresent) {
                    console.log('Elemen untuk foto atau video ditemukan.')

                    if (extensiFile === '.jpg') {
                        if (isPhotosPresent) {
                            console.log('Tombol untuk foto ditemukan.')
                            const validFiles = files.filter(
                                (file) =>
                                    !file.endsWith('.txt') &&
                                    !file.endsWith('.mp4')
                            )
                            await page.waitForSelector(facebookPathPhotos, {
                                visible: true,
                            })
                            const photoElement =
                                await page.$(facebookPathPhotos)
                            if (photoElement) {
                                await page.evaluate(
                                    (el) =>
                                        el.scrollIntoView({
                                            behavior: 'smooth',
                                            block: 'center',
                                        }),
                                    photoElement
                                )
                                await photoElement.click()
                                console.log(
                                    'Tombol diklik setelah di-scroll ke viewport'
                                )
                            }
                            console.log('1')
                            await new Promise((resolve) =>
                                setTimeout(resolve, 2000)
                            )
                            for (const file of validFiles) {
                                const finalPath = path.join(resultPath, file)
                                const [fileChooser] = await Promise.all([
                                    page.waitForFileChooser(),
                                    page.click('[role="menuitem"]'), // Tombol untuk memilih file
                                ])
                                await fileChooser.accept([finalPath])
                                console.log(`File ${file} berhasil diunggah`)
                            }
                            console.log('2')
                        }
                    } else if (extensiFile === '.mp4') {
                        if (isVideoPresent) {
                            console.log('Tombol untuk video ditemukan.')
                            const validFiles = files.filter(
                                (file) =>
                                    !file.endsWith('.txt') &&
                                    !file.endsWith('.jpg')
                            )
                            await page.waitForSelector(facebookPathVideo, {
                                visible: true,
                            })
                            const videoElement = await page.$(facebookPathVideo)
                            if (videoElement) {
                                await page.evaluate(
                                    (el) =>
                                        el.scrollIntoView({
                                            behavior: 'smooth',
                                            block: 'center',
                                        }),
                                    videoElement
                                )
                                await videoElement.click()
                                console.log(
                                    'Tombol diklik setelah di-scroll ke viewport'
                                )
                            }
                            console.log('1')
                            await new Promise((resolve) =>
                                setTimeout(resolve, 2000)
                            )
                            for (const file of validFiles) {
                                const finalPath = path.join(resultPath, file)
                                const [fileChooser] = await Promise.all([
                                    page.waitForFileChooser(),
                                    page.click('[role="menuitem"]'), // Tombol untuk memilih file
                                ])
                                await fileChooser.accept([finalPath])
                                console.log(`File ${file} berhasil diunggah`)
                            }
                            console.log('2')
                        }
                    }
                } else {
                    console.log(
                        'Elemen untuk foto atau video tidak ditemukan, menjalankan fileChooser.'
                    )
                    for (const file of files) {
                        const finalPath = path.join(resultPath, file)
                        const [fileChooser] = await Promise.all([
                            page.waitForFileChooser(),
                            page.click('[role="button"]'), // Sesuaikan selektor dengan kebutuhan
                        ])
                        await fileChooser.accept([finalPath])
                        console.log(`File ${file} berhasil diunggah`)
                    }
                }
            }

            const textareaSelector = '[data-text="true"]'
            const textareaElement = await page.$(textareaSelector)
            if (textareaElement) {
                await page.evaluate(
                    (element) => (element as HTMLElement).click(),
                    textareaElement
                )
                await page.type(textareaSelector, caption)
            }
            await new Promise((resolve) => setTimeout(resolve, 5000))
            const publish = '[role="button"][aria-busy="false"][tabindex="0"]'
            const execPublish = await page.$$(publish)
            let found = false
            for (const button of execPublish) {
                const buttonText = await page.evaluate((el) => {
                    if (el instanceof HTMLElement) {
                        return el.textContent ? el.textContent.trim() : ''
                    }
                    return ''
                }, button)
                if (buttonText === 'Publish') {
                    await button.click()
                    found = true
                    break
                }
            }
            await page.waitForNetworkIdle()
            await new Promise((resolve) => setTimeout(resolve, 5000))
            browser.close()
            const mediaDirectoryPath = fs.statSync(mediaPath).isDirectory()
                ? mediaPath
                : path.dirname(mediaPath)
            const files = fs.readdirSync(mediaDirectoryPath)
            const splitPath = mediaFilePath.split('/')
            splitPath.pop()
            const resultPath = splitPath.join('/')
            for (const file of files) {
                const finalPath = path.join(resultPath, file)
                fs.unlink(finalPath, (err) => {
                    if (err) {
                        console.error(`Gagal menghapus file ${file}:`, err)
                    } else {
                        console.log(`File ${file} berhasil dihapus.`)
                    }
                })
            }
            return res.status(201).json({ success: 'berhasil' })
        } catch (err) {
            console.log(err)
            // return res.status(500).json({ failed: 'silahkan coba lagi nanti' })
        }
    }
}

export default PostLangsung
