import axios from 'axios'
import puppeteer from 'puppeteer'

const BASE_URL = 'http://localhost:3000/hexadash-nextjs/api/facebook-api'

// Ekspor handler API
export default async function handler(req: any, res: any) {
    if (req.method === 'POST') {
        try {
            const { newAccount, userFacebookId } = req.body
            // console.log(newAccount.username,newAccount.password, userFacebookId)
        
            const browser = await puppeteer.launch({
                headless: false, // Tampilkan browser secara visual (ubah ke true untuk headless mode)
                args: [
                    '--disable-notifications', // Nonaktifkan semua notifikasi
                    '--disable-infobars', // Nonaktifkan infobar "Chrome is being controlled by automated test software"
                    '--disable-popup-blocking', // Nonaktifkan pemblokiran pop-up
                ],
                defaultViewport: null, // Agar tidak terbatas resolusi default Puppeteer
            })
            const page = await browser.newPage()
            let message = ''
        
            try {
                await page.goto('https://www.facebook.com/', {
                    waitUntil: 'networkidle2',
                })
        
                const selectorLogin = {
                    name: 'input[name="email"]',
                    pass: 'input[name="pass"]',
                    submit: 'button[type="submit"]',
                }
        
                await page.waitForSelector(selectorLogin.name)
                await page.type(selectorLogin.name, newAccount.username, {delay: 120})
                await new Promise((r) => setTimeout(r, 2000))
                await page.type(selectorLogin.pass, newAccount.password, {delay: 120})
                await new Promise((r) => setTimeout(r, 2000))
                await page.click(selectorLogin.submit)
        
                await page.waitForNavigation({ waitUntil: 'networkidle2' })
                const cookies = await page.cookies()
        
                //setelah login mengambil url profile
                await page.goto('https://www.facebook.com/profile', {
                    waitUntil: 'networkidle2',
                })
                await new Promise((r) => setTimeout(r, 2000))
                const imageUrl = await page.evaluate(() => {
                    const picProfile = document.querySelector(
                        'g image'
                    ) as HTMLImageElement
                    return picProfile ? picProfile.getAttribute('xlink:href') : null
                })
                let profilePic = ''
        
                if (imageUrl) {
                    console.log('Profile picture URL:', imageUrl)
        
                    // Buka tab baru
                    const newTab = await page.browser().newPage()
        
                    // Navigasi ke URL gambar di tab baru
                    await newTab.goto(imageUrl, { waitUntil: 'networkidle2' })
        
                    // Tunggu sebentar untuk memastikan gambar dimuat sepenuhnya
                    await new Promise((r) => setTimeout(r, 2000))
        
                    // Ambil URL gambar dari tab baru (jika diperlukan)
                    profilePic = await newTab.url()
                    await new Promise((r) => setTimeout(r, 2000))
                    await newTab.close()
                }
        
                // Setelah login, mengakses halaman composer di Meta Business Suite
                await page.goto('https://business.facebook.com/latest/composer', {
                    waitUntil: 'networkidle2',
                })
        
                // Menunggu sampai elemen combobox dimuat
                const selectorComposer = {
                    combobox: '[role="combobox"]',
                    options: '[role="option"]',
                }
        
                // Klik untuk membuka combobox jika diperlukan
                const combobox = await page.$(selectorComposer.combobox)
                if (combobox) {
                    await combobox.click()
                    console.log('Combobox berhasil ditemukan dan dibuka.')
                } else {
                    throw new Error('Combobox tidak ditemukan.')
                }
        
                // Mengambil textContent dari semua opsi dalam combobox
                const optionsText = await page.$$eval(
                    selectorComposer.options,
                    (options) => options.map((option) => option.textContent?.trim())
                )
        
                console.log('Opsi yang ditemukan:', optionsText)
        
                const prepareText = [optionsText].join(',')
        
                // Kirim data textContent ke endpoint API
                const beReady = {
                    profilePic,
                    access_token: JSON.stringify(cookies),
                    userInstagram: prepareText,
                    userFacebookId
                }

                const response = await axios.post(`${BASE_URL}/create`, beReady)
                const getMessage = await response.data
                if (!response) {
                    throw new Error(getMessage.msg)
                }
                await browser.close()
                message = 'berhasil'
                return message
            } catch (error: any) {
                console.error('Puppeteer login failed:', error)
                message = error.message
                throw new Error(message)
            } finally {
                await browser.close()
            }
        } catch (error) {
            console.error('Error in API handler:', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    } else {
        res.setHeader('Allow', ['POST'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}
