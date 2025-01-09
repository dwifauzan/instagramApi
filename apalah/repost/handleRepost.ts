import puppeteer from "puppeteer";
import path from "path";
import fs from "fs-extra";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg"
import { app } from "electron";

interface dataRepostLangsung {
    access_token: string
    users: string
    caption: string
    mediaFiles: string
}

interface dataRepostSchedule {
    access_token: string
    users: string
    caption: string
    mediaFiles: string
    date: string
    time: string
}

const downloadMedia = async (mediaFiles: string) => {
    console.log(mediaFiles)
    try {
        const mediaUrl = Array.isArray(mediaFiles) ? mediaFiles[0] : mediaFiles;
        
        const mediaPath = path.join(app.getPath('userData'), 'media', 'repost')
        
        if (!fs.existsSync(mediaPath)) {
            fs.mkdirSync(mediaPath, { recursive: true });
        }

        const response = await axios.get(mediaUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000,
        });

        const contentType = response.headers['content-type'];
        const isVideo = contentType?.includes('video') || mediaUrl.includes('.mp4');
        const isImage = contentType?.includes('image') || /\.(jpg|jpeg|png)$/i.test(mediaUrl);

        if (isVideo) {
            const originalMediaFilePath = path.join(mediaPath, `media-original.mp4`);
            const resizedMediaFilePath = path.join(mediaPath, `media.mp4`);
            await fs.writeFile(originalMediaFilePath, response.data);

            return new Promise((resolve, reject) => {
                ffmpeg(originalMediaFilePath)
                    .size('1080x1350')
                    .autopad(true, 'black')
                    .output(resizedMediaFilePath)
                    .on('end', () => {
                        fs.unlink(originalMediaFilePath).catch(console.log);
                        resolve({
                            success: true,
                            mediaPaths: [resizedMediaFilePath]
                        });
                    })
                    .on('error', (err) => {
                        if (fs.existsSync(originalMediaFilePath)) {
                            fs.unlink(originalMediaFilePath).catch(console.log);
                        }
                        reject({
                            success: false,
                            error: `Failed to process video: ${err.message}`
                        });
                    })
                    .run();
            });
        } else if (isImage) {
            const mediaFilePath = path.join(mediaPath, 'media.jpg');
            await fs.writeFile(mediaFilePath, response.data);
            return {
                success: true,
                mediaPaths: [mediaFilePath]
            };
        } else {
            throw new Error('Unsupported media type');
        }

    } catch (error) {
        console.error('Error downloading media:', error);
        return {
            success: false,
        };
    }
};

const handleRepostLangsung = async (dataRepostL: dataRepostLangsung) => {
    console.log(dataRepostL)
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const mediaResult = await downloadMedia(dataRepostL.mediaFiles)
    console.log('mediaResult dari downloadMedia ', mediaResult)
    if (!mediaResult) {
        throw new Error('Failed to download media')
    }
    const browserPath = process.env.PORTABLE_CHROME_PATH || path.join(app.getAppPath(), '..', 'GoogleChromePortable','App','Chrome-bin', 'chrome.exe')

            const browser = await puppeteer.launch({
                executablePath: browserPath,
                headless: false,
                args: [
                    '--disable-notifications', // Nonaktifkan semua notifikasi
                    '--disable-infobars', // Nonaktifkan infobar "Chrome is being controlled by automated test software"
                    '--disable-popup-blocking', // Nonaktifkan pemblokiran pop-up
                ],
                defaultViewport: null,
            })
            const page = await browser.newPage()
            const cookies = JSON.parse(dataRepostL.access_token)
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
                    if (text && !dataRepostL.users.includes(text)) {
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
            // console.log(filename)
            const mediaPath = path.join(app.getPath('userData'), 'media', 'repost')

            const facebookPathPhotos = '[aria-label="Select adding photos."]'
            const facebookPathVideo = '[aria-label="Select adding a video."]'
            const isPhotosPresent = (await page.$(facebookPathPhotos)) !== null
            const isVideoPresent = (await page.$(facebookPathVideo)) !== null

            const mediaFilePath = path.join(mediaPath)
            console.log('eksekusi pertama', mediaFilePath)
            if (fs.existsSync(mediaFilePath)) {
                const mediaDirectoryPath = fs.statSync(mediaPath).isDirectory()
                    ? mediaPath
                    : path.dirname(mediaPath)
                const files = fs.readdirSync(mediaDirectoryPath)
                const validFiles = files.filter((file) => {
                    return !file.endsWith('.txt') // Menyaring file .txt
                })

                console.log('validFiles:', validFiles)
                let extensiFile = ''
                if (validFiles.length > 0) {
                    const firstFile = validFiles[0]
                    extensiFile = path.extname(firstFile).toLowerCase()
                }
                console.log(extensiFile)
                const resultPath = mediaFilePath
                console.log('eksekusi', resultPath)
                if (isPhotosPresent || isVideoPresent) {
                    console.log('Elemen untuk foto atau video ditemukan.')
                    await new Promise((resolve) => setTimeout(resolve, 2000))

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
                            const photoElement = await page.$(
                                facebookPathPhotos
                            )
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
                        await new Promise((resolve) =>
                            setTimeout(resolve, 2000)
                        )
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
                await page.type(textareaSelector, dataRepostL.caption)
            }
            await page.waitForFunction(
                () => {
                    const button = document.querySelector(
                        '[role="button"][aria-busy="false"][tabindex="0"]'
                    )
                    return (
                        button &&
                        button.getAttribute('aria-disabled') !== 'true'
                    )
                },
                { timeout: 30000 }
            )
            await new Promise((resolve) => setTimeout(resolve, 7000))
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
            for (const file of files) {
                const finalPath = path.join(mediaDirectoryPath, file)
                fs.unlink(finalPath, (err) => {
                    if (err) {
                        console.error(`Gagal menghapus file ${file}:`, err)
                    } else {
                        console.log(`File ${file} berhasil dihapus.`)
                    }
                })
            }
            return ({ success: 'berhasil' })
}

const handleRepostSchedule = async (dataRepostS: dataRepostSchedule) => {
    console.log(dataRepostS)
    await new Promise((resolve) => setTimeout(resolve, 5000))

    const mediaResult = await downloadMedia(dataRepostS.mediaFiles)
    console.log('mediaResult dari downloadMedia ', mediaResult)
    if (!mediaResult) {
        throw new Error('Failed to download media')
    }
    const browserPath = process.env.PORTABLE_CHROME_PATH || path.join(app.getAppPath(), '..', 'GoogleChromePortable','App','Chrome-bin', 'chrome.exe')

    const browser = await puppeteer.launch({
        executablePath: browserPath,
        headless: false,
        args: [
            '--disable-notifications', // Nonaktifkan semua notifikasi
            '--disable-infobars', // Nonaktifkan infobar "Chrome is being controlled by automated test software"
            '--disable-popup-blocking', // Nonaktifkan pemblokiran pop-up
        ],
        defaultViewport: null,
    })
    const page = await browser.newPage()
    const cookies = JSON.parse(dataRepostS.access_token)
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
            if (text && !dataRepostS.users.includes(text)) {
                await option.click() // Klik elemen
                console.log(`Opsi "${dataRepostS.users}" dipilih.`)

                // Tunggu sedikit agar interaksi selesai
                await new Promise((resolve) => setTimeout(resolve, 500))
            }
        }
    }

    // Tutup dropdown setelah semua opsi selesai
    await page.click('[role="combobox"]')
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const mediaPath = path.join(app.getPath('userData'), 'media', 'repost')

    const facebookPathPhotos = '[aria-label="Select adding photos."]'
    const facebookPathVideo = '[aria-label="Select adding a video."]'
    const isPhotosPresent = (await page.$(facebookPathPhotos)) !== null
    const isVideoPresent = (await page.$(facebookPathVideo)) !== null

    const mediaFilePath = path.join(mediaPath)
    console.log('eksekusi pertama', mediaFilePath)
    if (fs.existsSync(mediaFilePath)) {
        const mediaDirectoryPath = fs.statSync(mediaPath).isDirectory()
            ? mediaPath
            : path.dirname(mediaPath)
        const files = fs.readdirSync(mediaDirectoryPath)
        const validFiles = files.filter((file) => {
            return !file.endsWith('.txt') // Menyaring file .txt
        })

        console.log('validFiles:', validFiles)
        let extensiFile = ''
        if (validFiles.length > 0) {
            const firstFile = validFiles[0]
            extensiFile = path.extname(firstFile).toLowerCase()
        }
        console.log(extensiFile)
        const resultPath = mediaFilePath
        console.log('eksekusi', resultPath)
        if (isPhotosPresent || isVideoPresent) {
            console.log('Elemen untuk foto atau video ditemukan.')
            await new Promise((resolve) => setTimeout(resolve, 2000))

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
                    const photoElement = await page.$(
                        facebookPathPhotos
                    )
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
                await new Promise((resolve) =>
                    setTimeout(resolve, 2000)
                )
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
        await page.type(textareaSelector, dataRepostS.caption)
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
    const jadwal = await page.$(
        '[aria-label="Set date and time"][role="switch"]'
    )
    if (jadwal) {
        await page.evaluate(() => {
            const switchElement = document.querySelector(
                '[aria-label="Set date and time"][role="switch"]'
            )
            if (switchElement) {
                ;(switchElement as HTMLElement).click()
            }
        })
        console.log('Schedule element found and clicked.')

        const planning = {
            date: 'input[placeholder="dd/mm/yyyy"]',
            hours: 'input[role="spinbutton"][aria-label="hours"]',
            minutes: 'input[role="spinbutton"][aria-label="minutes"]',
        }
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Ambil semua elemen yang cocok
        const dateInputs = await page.$$(planning.date)
        const hoursInputs = await page.$$(planning.hours)
        const minutesInputs = await page.$$(planning.minutes)
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Isi elemen berdasarkan indeks (misalnya, isi dua elemen pertama)
        if (dateInputs.length >= 2) {
            console.log('Date inputs found.')
            await dateInputs[0].click({ clickCount: 3 })
            await dateInputs[0].type(dataRepostS.date)
            console.log(
                'First date input successfully filled with:',
                dataRepostS.date
            )
            await hoursInputs[0].click({ clickCount: 3 })
            await new Promise((resolve) => setTimeout(resolve, 2000))

            await dateInputs[1].click({ clickCount: 3 })
                await dateInputs[1].type(dataRepostS.date)
            console.log(
                'Second date input successfully filled with:',
                dataRepostS.date
            )
        } else {
            const dateInput = await page.$(planning.date)
            if (dateInput) {
                await dateInput.click({ clickCount: 3 })
                await dateInput.type(dataRepostS.date)
                console.log('date in xpath : ', dataRepostS.date)
            }
            console.log('Date inputs not found or insufficient.')
        }

        let [hours, minute] = dataRepostS.time.split(':')
        await new Promise((resolve) => setTimeout(resolve, 3000))

        if (hoursInputs.length >= 2) {
            console.log('Hours inputs found.')
            await hoursInputs[0].click({ clickCount: 3 })
            await hoursInputs[0].type(hours)
            console.log(
                'First hours input successfully filled with:',
                hours
            )

            await hoursInputs[1].click({ clickCount: 3 })
            await hoursInputs[1].type(hours)
            console.log(
                'Second hours input successfully filled with:',
                hours
            )
        } else {
            const hoursInput = await page.$(planning.hours)
            if (hoursInput) {
                await hoursInput.click({ clickCount: 3 })
                await hoursInput.type(hours)
                console.log('Hours successfully filled.')
            } else {
                console.log('Hours input not found')
            }
            console.log('Hours inputs not found or insufficient.')
        }
        await new Promise((resolve) => setTimeout(resolve, 2000))

        if (minutesInputs.length >= 2) {
            console.log('Minutes inputs found.')
            await minutesInputs[0].click({ clickCount: 3 })
            await minutesInputs[0].type(minute)
            console.log(
                'First minutes input successfully filled with:',
                minute
            )

            await minutesInputs[1].click({ clickCount: 3 })
            await minutesInputs[1].type(minute)
            console.log(
                'Second minutes input successfully filled with:',
                minute
            )
        } else {
            const minutesInput = await page.$(planning.minutes)
            if (minutesInput) {
                await minutesInput.click({ clickCount: 3 })
                await minutesInput.type(minute)
                console.log('Minutes successfully filled.')
            } else {
                console.log('Minutes input not found')
            }
            console.log('Minutes inputs not found or insufficient.')
        }
    } else {
        console.log('Schedule switch not found.')
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
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
        if (buttonText === 'Schedule') {
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
    for (const file of files) {
        const finalPath = path.join(mediaDirectoryPath, file)
        fs.unlink(finalPath, (err) => {
            if (err) {
                console.error(`Gagal menghapus file ${file}:`, err)
            } else {
                console.log(`File ${file} berhasil dihapus.`)
            }
        })
    }
    return ({ success: 'berhasil' })
}

const handlerRepost = {
    invoke: [
        {
            name: "handleRepostLangsung",
            togo: handleRepostLangsung
        },
        {
            name: "handleRepostSchedule",
            togo: handleRepostSchedule
        }
    ]
}

export {handlerRepost}
