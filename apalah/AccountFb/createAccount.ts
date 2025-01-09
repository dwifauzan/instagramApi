import { userFacebookService } from "./userFacebookService";
import { cookiesFacebook } from "./accountFacebook";
import path from 'path'
import puppeteer from "puppeteer";
import { app } from "electron";
import { PrismaClient } from "@prisma/client";

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
const prisma = new PrismaClient()
//ini buat nambah data baru 
const handleCokies = async (cokies: cokiesUser) => {
  const responseCokies = await cookiesFacebook.create(cokies) 
  return responseCokies
}
//fitur login account 
const handleakun = async (accountForm: accountForm) => {
  console.log(accountForm)
  const account = {
    ...accountForm,
    created_at: new Date()
  }
  //buat data baru di table userFacebook
  const addAccount = await userFacebookService.create(account) 
  const userFacebookId = addAccount.id

  //jalankan fungsi puppeteer
  const browserPath = process.env.PORTABLE_CHROME_PATH || path.join(app.getAppPath(), '..', 'GoogleChromePortable','App','Chrome-bin', 'chrome.exe')

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: false,
    timeout: 60000,
    //fungsi args adalah disable nontifkasi seperti meminta izin lokasi block atau allow
    args: [
        '--disable-notifications',
        '--disable-infobars',
        '--disable-popup-blocking',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080'
    ],
    defaultViewport: null,
    ignoreDefaultArgs: ['--disable-extensions'],
    protocolTimeout: 60000
})
const page = await browser.newPage()
await page.setViewport({ width: 1366, height: 768 })
let message = ''

try {
    await page.goto('https://www.facebook.com/', {
        waitUntil: 'networkidle2',
    })
    //dibawah ini adalah xpath pada form login facebook page
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
    //fungsi ini untuk mengambil profile picture
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
  return {status: 200, message: 'account facebook berhasil di hapus'}
}
//ini fitur sinkron digunakan apabila terdapat data account yang berubah 
const sinkronUsers = async (id: number) => {
  const sinkronUsers = await userFacebookService.findById(id)
  if(!sinkronUsers) {
    throw new Error('user not found')
  }
  // return sinkronUsers
  const browserPath = process.env.PORTABLE_CHROME_PATH || path.join(app.getAppPath(), '..', 'GoogleChromePortable','App','Chrome-bin', 'chrome.exe')
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: false,
    timeout: 60000,
    //fungsi args adalah untuk disable notif seperti meminta izin lokasi block atau allow
    args: [
        '--disable-notifications',
        '--disable-infobars',
        '--disable-popup-blocking',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080'
    ],
    defaultViewport: null, // Agar tidak terbatas resolusi default Puppeteer
    ignoreDefaultArgs: ['--disable-extensions'],
    protocolTimeout: 60000
})
const page = await browser.newPage()
await page.setViewport({ width: 1366, height: 768 })
let message = ''

try {
    await page.goto('https://www.facebook.com/', {
        waitUntil: 'networkidle2',
    })
    //dibawah ini adalah xpath pada form login facebook page
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
    //fungsi ini untuk mengambil profile picture
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
    message = 'berhasil di sinkronkan'
    return {status: 200, message}
} catch (error: any) {
    console.error('Puppeteer login failed:', error)
    message = error.message
    throw new Error(message)
} finally {
    await browser.close()
}
}
//fitur buat hapus account meta yang di daftarkan pada aplikasi
const deleteFolderArsip = async (id: number) => {
  let message;
  console.log(`Masuk id nih ${id}`);
  try {
      // Hapus semua DetailContent yang merujuk ke FolderArsip
      await prisma.detailContent.deleteMany({
          where: {
              folderArsipId: {
                  in: await prisma.folderArsip.findMany({
                      where: { arsipId: Number(id) },
                      select: { id: true },
                  }).then(folderArsip => folderArsip.map(folder => folder.id)),
              },
          },
      });

      // Hapus semua FolderArsip yang merujuk ke arsipId
      await prisma.folderArsip.deleteMany({
          where: {
              arsipId: Number(id), // Hapus semua FolderArsip yang memiliki arsipId ini
          },
      });

      // Hapus Arsip
      await prisma.arsip.delete({
          where: {
              id: Number(id), // Hapus Arsip berdasarkan ID
          },
      });

      message = 'folder arsip berhasil dihapus';
      console.log(message);
      return {status: 200, message};
  } catch (error: any) {
      message = error.message;
      console.log(message);
      return {status: 500, message};
  }
};

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
    },
    {
      name: "deleteFolderArsip",
      togo: deleteFolderArsip
    }
  ],
};

export { handler };
