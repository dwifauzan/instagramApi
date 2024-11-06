import * as puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { NextApiRequest, NextApiResponse } from 'next'

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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        try {
            const { folderArsip, access_token, date, time, users } = req.body

            // Lakukan sesuatu dengan data
            console.log('Data diterima:', {
                folderArsip,
                access_token,
                date,
                time,
                users,
            })

            const browser = await puppeteer.launch({ headless: false })
            const page = await browser.newPage()
            await page.setViewport({ width: 1366, height: 768 })

            for (const item of folderArsip) {
                await new Promise((resolve) => setTimeout(resolve, 3000))
                const cookiesReady = JSON.parse(access_token)
                await page.setCookie(...cookiesReady)
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
                    if (text && !users.includes(text)) await option.click()
                }
                await page.click('[role="combobox"]')
                await new Promise((resolve) => setTimeout(resolve, 3000))

                const mediaFilePath = path.join(item.detail_content.file_path)

                if (fs.existsSync(mediaFilePath)) {
                    const [fileChooser] = await Promise.all([
                        page.waitForFileChooser(),
                        page.click('[role="button"]'), // Tombol untuk memilih file
                    ])
                    await fileChooser.accept([mediaFilePath])
                    console.log(
                        `File ${item.detail_content.file_path} berhasil diunggah`
                    )
                    await new Promise((resolve) => setTimeout(resolve, 2000))

                    // Masukkan caption ke dalam textarea
                    const textareaSelector = '[data-text="true"]'
                    const textareaElement = await page.$(textareaSelector)
                    if (textareaElement) {
                        await page.evaluate(
                            (element) => (element as HTMLElement).click(),
                            textareaElement
                        )
                        await page.type(textareaSelector, item.caption)
                    }

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
                            await dateInput.type(date)
                            console.log('Date successfully filled.')
                        }
                        await new Promise((resolve) => setTimeout(resolve, 2000))

                        let [hours, minutes] = time.split(':')
                        const hoursInput = await page.$(planning.hours)
                        if (hoursInput) {
                            await hoursInput.click({ clickCount: 3 })
                            await hoursInput.type(String(hours).padStart(2, '0'))
                            console.log('Hours successfully filled.')
                        }

                        const minutesInput = await page.$(planning.minutes)
                        if (minutesInput) {
                            await minutesInput.click({ clickCount: 3 })
                            await minutesInput.type(String(minutes).padStart(2, '0'))
                            console.log('Minutes successfully filled.')
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

                    // Tunggu sebentar sebelum melanjutkan ke post berikutnya
                    await new Promise((resolve) => setTimeout(resolve, 5000))

                    await page.goto(
                        'https://business.facebook.com/latest/composer',
                        {
                            waitUntil: 'networkidle2',
                        }
                    )
                } else {
                    console.error(`File tidak ditemukan: ${mediaFilePath}`)
                    return res
                        .status(500)
                        .json({ message: 'File tidak ditemukan' })
                }
            }

            await browser.close()
            return res.status(200).json({ message: 'Scheduled successfully' })
        } catch (error: any) {
            console.error('Error in scheduling:', error)
            return res.status(500).json({
                message: 'Internal Server Error',
                error: error.message,
            })
        }
    } else {
        res.setHeader('Allow', ['POST'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}

export default handler
