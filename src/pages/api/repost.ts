import puppeteer from "puppeteer";

export const repostToInstagram = async (mediaFiles: any, caption: any)=> {
    const browser = await puppeteer.launch({headless: false})
    const page = await browser.newPage()

    await page.goto('https://business.facebook.com/latest/composer', { waitUntil: 'networkidle2'})

}