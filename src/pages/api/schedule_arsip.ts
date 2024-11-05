import * as puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        try {
            const {
                arsip_name,
                captions,
                access_token,
                users,
                schedule_date,
                schedule_time,
            } = req.body

            const browser = await puppeteer.launch({ headless: false })
            const page = await browser.newPage()
            await page.setViewport({ width: 1366, height: 768 })

            const cookiesReady = JSON.parse(access_token)
            await page.setCookie(...cookiesReady)

            const directoryPath = path.join(
                process.cwd(),
                'public',
                'arsip',
                arsip_name
            )
            const entries = fs.readdirSync(directoryPath, {
                withFileTypes: true,
            })

            const folders = entries
                .filter((entry) => entry.isDirectory())
                .map((folder) => folder.name)

            const i = 0

            for (const folder of folders) {
                const folderPath = path.join(directoryPath, folder)
                const files = fs.readdirSync(folderPath).map((file) => file)
                await page.goto(
                    'https://business.facebook.com/latest/composer',
                    {
                        waitUntil: 'networkidle2',
                    }
                )

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

                for (const file of files) {
                    const [fileChooser] = await Promise.all([
                        page.waitForFileChooser(),
                        page.click(`[role="button"]`),
                    ])
                    await fileChooser.accept([file])
                }

                await new Promise((r) => setTimeout(r, 9000))

                const textareaSelector = '[data-text="true"]'
                const textareaElement = await page.$(textareaSelector)
                if (textareaElement) {
                    await page.evaluate(
                        (element) => (element as HTMLElement).click(),
                        textareaElement
                    )
                    await page.type(textareaSelector, captions[i])
                } else {
                    console.log('Textarea gagal di klik')
                }
            }

            // Jadwal dan pengaturan lainnya
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
                    minutes: 'input[role="spinbutton"][aria-label="minutes"]',
                }

                await page.waitForSelector(planning.date, { visible: true })
                await page.waitForSelector(planning.hours, { visible: true })
                await page.waitForSelector(planning.minutes, { visible: true })

                const dateInput = await page.$(planning.date)
                if (dateInput) {
                    await dateInput.click({ clickCount: 3 })
                    await dateInput.type(schedule_date)
                    console.log('Date successfully filled.')
                }

                const [hours, minutes] = schedule_time.split(':')
                const hoursInput = await page.$(planning.hours)
                if (hoursInput) {
                    await hoursInput.click({ clickCount: 3 })
                    await hoursInput.type(hours)
                    console.log('Hours successfully filled.')
                }

                const minutesInput = await page.$(planning.minutes)
                if (minutesInput) {
                    await minutesInput.click({ clickCount: 3 })
                    await minutesInput.type(minutes)
                    console.log('Minutes successfully filled.')
                }
            } else {
                console.log(
                    'Schedule element not found, attempting text-based method'
                )
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
                if (buttonText === 'Schedule') {
                    await button.click()
                    found = true
                    break
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 7000))
            await browser.close()

            // await browser.close()

            return res.status(200).json({ message: 'Scheduled successfully' })
        } catch (error: any) {
            console.error(error)
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
