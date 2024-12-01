import { userFacebookService } from "./userFacebookService";
import { cookiesFacebook } from "./accountFacebook";
import puppeteer from "puppeteer";

interface accountForm {
  name: string
  username: string
  password: string
}

interface cokiesUser {
  profilePic: string
  access_token: string
  userInstagram: string
  userFacebookId: number
}

const handleCokies = async (cokies: cokiesUser) => {
  const responseCokies = await cookiesFacebook.create(cokies) 
  return responseCokies
}

const handleakun = async (accountForm: accountForm) => {
  console.log(accountForm)
  const account = {
    ...accountForm,
    created_at: new Date()
  }
  const addAccount = await userFacebookService.create(account) 
  const userFacebookId = addAccount.id

  //jalankan fungsi puppeteer
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
    await page.type(selectorLogin.name, accountForm.username, {delay: 120})
    await new Promise((r) => setTimeout(r, 2000))
    await page.type(selectorLogin.pass, accountForm.password, {delay: 120})
    await new Promise((r) => setTimeout(r, 2000))
    await page.click(selectorLogin.submit)

    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    const currentUrl = page.url();
    if (currentUrl.includes('https://www.facebook.com/two_step_verification/authentication/')) {
      console.log('Two-step verification detected. Waiting for 50 seconds...');
      await new Promise((r) => setTimeout(r, 50000)) // Tunggu 30 detik
    } else {
      console.log('No two-step verification detected. Continuing...');
    }
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
    await new Promise((r) => setTimeout(r, 2000))
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

    const response = await handleCokies(beReady)
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
}

const getAllUser = async () => {
  const usersFacebook = await userFacebookService.findAll()
  return usersFacebook
}

const deleteUsers = async (id: number) => {
  const deleteUsers = await userFacebookService.delete(id)
}

const sinkronUsers = async (id: number) => {
  const sinkronUsers = await userFacebookService.findById(id)
  if(!sinkronUsers) {
    throw new Error('user not found')
  }
  // return sinkronUsers
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
    await page.type(selectorLogin.name, sinkronUsers.username, {delay: 120})
    await new Promise((r) => setTimeout(r, 2000))
    await page.type(selectorLogin.pass, sinkronUsers.password, {delay: 120})
    await new Promise((r) => setTimeout(r, 2000))
    await page.click(selectorLogin.submit)

    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    const currentUrl = page.url();
    if (currentUrl.includes('https://www.facebook.com/two_step_verification/authentication/')) {
      console.log('Two-step verification detected. Waiting for 50 seconds...');
      await new Promise((r) => setTimeout(r, 50000)) // Tunggu 30 detik
    } else {
      console.log('No two-step verification detected. Continuing...');
    }
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
    const userFacebookId = sinkronUsers.id
    const beReady = {
        profilePic,
        access_token: JSON.stringify(cookies),
        userInstagram: prepareText,
    }

    const response = await cookiesFacebook.update(userFacebookId, beReady)
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
}

const handler = {
  invoke: [
    {
      name: "createAccount",
      togo: handleakun, // Mengacu langsung ke fungsi handlerAccount
    },
    {
      name: "cokiesUser",
      togo: cookiesFacebook
    },
    {
      name: "getAllUsers",
      togo: getAllUser
    },
    {
      name: "deleteUsers",
      togo: deleteUsers
    },
    {
      name: "sinkronUsers",
      togo: sinkronUsers
    }
  ],
};

export { handler };
