import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'
import { parse, format, addDays } from 'date-fns'  
import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
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
    sumber: string
    created_at: string
    isExecuted: boolean
}

interface dataArsip {
    folderArsip: FolderArsip[]
    date: string
    time: string
    access_token: string
    users: string[]
    perpostingan: number
    promotion: string
    source: string
    sumber: string
}
//fitur ini untuk shcedule massal
const handleArsipLocal = async (data: dataArsip) => {
    const browserPath = process.env.PORTABLE_CHROME_PATH || path.join(app.getAppPath(), '..', 'GoogleChromePortable','App','Chrome-bin', 'chrome.exe')
    const browser = await puppeteer.launch({
        executablePath: browserPath, //ini untuk menggunakan chrome portable yang sudah include di aplikasi
        headless: false, // Tampilkan browser secara visual (ubah ke true untuk headless mode)
        args: [
            '--disable-notifications', // Nonaktifkan semua notifikasi
            '--disable-infobars', // Nonaktifkan infobar "Chrome is being controlled by automated test software"
            '--disable-popup-blocking', // Nonaktifkan pemblokiran pop-up
        ],
        defaultViewport: null, // Agar tidak terbatas resolusi default Puppeteer
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1366, height: 768 })
    const cookiesReady = JSON.parse(data.access_token)
    await page.setCookie(...cookiesReady)

    //fungsi untuk update columns status folderArsip

    const prisma = new PrismaClient()
    const updateFolderArsip = async (
        folderArsipId: number,
        status: string
    ) => {
        try {
            await prisma.folderArsip.update({
                where: {
                    id: folderArsipId,
                },
                data: {
                    status: status,
                },
            })
            console.log(
                `Status updated to ${status} for folderArsipId: ${folderArsipId}`
            )
        } catch (err: any) {
            console.error('Error updating status:', err)
        }
    }

    let processInterupt = false
    page.on('dialog', async (dialog) => {
        if (dialog.type() === 'beforeunload') {
            await dialog.accept()
        } else {
            await dialog.dismiss()
        }
    })
    let writePostingan = 0
    let parseDate = parse(data.date, 'dd/mm/yyyy', new Date())
    const formatDate = format(parseDate, 'dd/mm/yyyy')
    let postsToday = 0
    for (const item of data.folderArsip) {
        try {
            if (postsToday >= data.perpostingan) {
                parseDate = addDays(parseDate, 1)
                postsToday = 0 //reset
            }

            let trueCaption = item.caption || '' // Pastikan caption tidak undefined
            try {
                try {
                    if(data.promotion) {
                        // Jika promotion adalah array, gunakan join
                        const promotionText = Array.isArray(data.promotion) 
                            ? data.promotion.join(', ') 
                            : String(data.promotion);
                            
                        trueCaption = trueCaption.replaceAll(/@(\w+)/g, `@${promotionText}`)
                        console.log('Promotion processed:', trueCaption)
                    }
                } catch (promotionError) {
                    console.error('Error processing promotion:', promotionError, 
                                  '\nPromotion value:', data.promotion)
                }

                try {
                    if(data.source && data.source.trim() !== ''){
                        const regexSource = data.source.replace(/{\[(.*?)\]}/g, `@${data.users.join(', ')}`)
                        trueCaption = `${regexSource}\n\n${trueCaption}`
                        console.log('Source processed:', trueCaption)
                    }
                } catch (sourceError) {
                    console.error('Error processing source:', sourceError)
                }

                try {
                    if(data.sumber && data.sumber.trim() !== ''){
                        const regexSumber = data.sumber.replace(/\[.*?\]/g, `@${item.sumber}`)
                        trueCaption = `${trueCaption}\n\n${regexSumber}`
                        console.log('Sumber processed:', trueCaption)
                    }
                } catch (sumberError) {
                    console.error('Error processing sumber:', sumberError)
                }
            } catch (captionError) {
                console.error('Error in caption processing:', captionError)
            }

            const formatDate = format(parseDate, 'dd/mm/yyyy')
            await new Promise((resolve) => setTimeout(resolve, 3000))
            await page.goto(
                'https://business.facebook.com/latest/composer',
                {
                    waitUntil: 'networkidle2',
                }
            )
            await new Promise((resolve) => setTimeout(resolve, 2000))
            await page.click('[role="combobox"]')
            const options = await page.$$('[role="option"]')

            for (const option of options) {
                const text = await option.evaluate((el) =>
                    el.textContent?.trim()
                )
                // Skip jika elemen adalah "Save Preference"
                if (text === 'Save preference') {
                    console.log('Mengabaikan opsi Save Preference')
                    continue
                }
                if (text && !data.users.includes(text)) await option.click()
            }
            console.log('telah melewati users click')
            await page.click('[role="combobox"]')
            await new Promise((resolve) => setTimeout(resolve, 3000))

            const mediaFilePath = path.join(
                item.detail_content.file_path
            )
            console.log(`mediaFilePath ori ${mediaFilePath}`)

            if (fs.existsSync(mediaFilePath)) {
                // membaca isi filepath
                // Pastikan mediaDirectoryPath mengarah ke folder
                const mediaDirectoryPath = fs
                    .statSync(item.detail_content.file_path)
                    .isDirectory()
                    ? item.detail_content.file_path
                    : path.dirname(item.detail_content.file_path)
                const files = fs.readdirSync(mediaDirectoryPath).filter(file => !file.toLowerCase().endsWith('.txt'))
                const splitPath = mediaFilePath.split('/')
                splitPath.pop()
                const resultPath = path.dirname(mediaFilePath)
                for (const file of files) {
                    const finalPath = path.join(resultPath, file)
                    const [fileChooser] = await Promise.all([
                        page.waitForFileChooser(),
                        page.click('[role="button"]'), // Tombol untuk memilih file
                    ])
                    await fileChooser.accept([finalPath])
                    console.log(`File ${file} berhasil diunggah`)
                }
            } else {
                console.error(`File tidak ditemukan: ${mediaFilePath}`)
                return ({ message: 'File tidak ditemukan' })
            }
            // Masukkan caption yang sudah diproses ke dalam textarea
            const textareaSelector = '[data-text="true"]'
            const textareaElement = await page.$(textareaSelector)
            if (textareaElement) {
                await page.evaluate(
                    (element) => (element as HTMLElement).click(),
                    textareaElement
                )
                await page.type(textareaSelector, trueCaption) // Menggunakan trueCaption yang sudah diproses
                console.log('berhasil caption')
            }
            await new Promise((resolve) => setTimeout(resolve, 2000))

            //ini fitur lokasi xpathnya sudah ada kalau mau 
            // const locationPath =
            //     '[aria-label="Location"][role="button"][aria-disabled="false"]'
            // const locationWait = await page.$(locationPath)
            // if (locationWait) {
            //     await locationWait.click()
            //     console.log('location di temukan')
            //     //eksekusi ini
            //     const inputXpath =
            //         '[contains(text(), "Enter a location")]'
            //     await new Promise((resolve) =>
            //         setTimeout(resolve, 2000)
            //     )
            //     const typeXpath = await page.$(inputXpath)
            //     if (typeXpath) {
            //         await typeXpath.click()
            //         await typeXpath.type(location)
            //     }
            // } else {
            //     console.log('location tidak ditemukan')
            // }

            // Klik tombol untuk menjadwalkan
            // Jadwal dan pengaturan lainnya
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const jadwal = await page.$('[role="switch"]')
            if (jadwal) {
                await page.evaluate(() => {
                    const switchElement =
                        document.querySelector('[role="switch"]')
                    if (switchElement) {
                        ;(switchElement as HTMLElement).click()
                    }
                })
                console.log('Schedule element found and clicked')

                const planning = {
                    date: 'input[placeholder="dd/mm/yyyy"]',
                    hours: 'input[role="spinbutton"][aria-label="hours"]',
                    minutes:
                        'input[role="spinbutton"][aria-label="minutes"]',
                }

                await page.waitForSelector(planning.date, {
                    visible: true,
                })
                await page.waitForSelector(planning.hours, {
                    visible: true,
                })
                await page.waitForSelector(planning.minutes, {
                    visible: true,
                })

                const dateInput = await page.$(planning.date)
                if (dateInput) {
                    await dateInput.click({ clickCount: 3 })
                    await dateInput.type(formatDate)
                    console.log('date in xpath : ', formatDate)
                }
                await new Promise((resolve) =>
                    setTimeout(resolve, 2000)
                )

                let [hours, minutes] = data.time.split(':').map(Number) // Konversi hours dan minutes ke angka

                // Total waktu dalam menit, lalu tambahkan 30 menit untuk penjadwalan berikutnya
                let totalMinutes =
                    hours * 60 + minutes + postsToday * 30

                // Konversi kembali ke jam dan menit
                hours = Math.floor(totalMinutes / 60) % 24 // Mod 24 untuk memastikan dalam format 24 jam
                minutes = totalMinutes % 60

                // Format `hours` dan `minutes` menjadi dua digit untuk pengisian
                const formattedHours = String(hours).padStart(2, '0')
                const formattedMinutes = String(minutes).padStart(
                    2,
                    '0'
                )

                console.log(
                    `Scheduling post for hours: ${formattedHours}, minutes: ${formattedMinutes}`
                )

                // Kemudian isi field input dengan `formattedHours` dan `formattedMinutes`
                const hoursInput = await page.$(planning.hours)
                if (hoursInput) {
                    await hoursInput.click({ clickCount: 3 })
                    await hoursInput.type(formattedHours)
                    console.log('Hours successfully filled.')
                } else {
                    console.log('Hours input not found')
                }

                const minutesInput = await page.$(planning.minutes)
                if (minutesInput) {
                    await minutesInput.click({ clickCount: 3 })
                    await minutesInput.type(formattedMinutes)
                    console.log('Minutes successfully filled.')
                } else {
                    console.log('Minutes input not found')
                }
            } else {
                console.log(
                    'Schedule element not found, attempting text-based method'
                )
            }

            await new Promise((resolve) => setTimeout(resolve, 7000))
            const publish =
                '[role="button"][aria-busy="false"][tabindex="0"]'
            const execPublish = await page.$$(publish)
            let found = false
            for (const button of execPublish) {
                const buttonText = await page.evaluate((el) => {
                    if (el instanceof HTMLElement) {
                        return el.textContent
                            ? el.textContent.trim()
                            : ''
                    }
                    return ''
                }, button)
                if (buttonText === 'Schedule') {
                    await button.click()
                    found = true
                    break
                }
            }
            await updateFolderArsip(
                item.detail_content.folderArsipId,
                'success'
            )
            processInterupt = false
            console.log('date out xpath : ', formatDate)
            postsToday++
            // Tunggu sebentar sebelum melanjutkan ke post berikutnya
            await new Promise((resolve) => setTimeout(resolve, 5000))

            await page.goto(
                'https://business.facebook.com/latest/composer',
                {
                    waitUntil: 'networkidle2',
                }
            )
        } catch (err: any) {
            processInterupt = true
            await updateFolderArsip(
                item.detail_content.folderArsipId,
                'failed'
            )
        }
    }

    await browser.close()
    return ({ message: 'Scheduled successfully' })
}

const handleArsip = {
    invoke: [
        {
            name: 'handleArsip',
            togo: handleArsipLocal
        }
    ]
}

export {handleArsip}