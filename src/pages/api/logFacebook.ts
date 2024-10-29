import puppeteer from 'puppeteer';

export const triggerLoginWithPuppeteer = async (formData: any) => {
  const { name, accountName, password } = formData;
  console.log(name, accountName, password)

  const browser = await puppeteer.launch({
    headless: false, // Tampilkan browser secara visual (ubah ke true untuk headless mode)
    args: [
      '--disable-notifications',  // Nonaktifkan semua notifikasi
      '--disable-infobars',       // Nonaktifkan infobar "Chrome is being controlled by automated test software"
      '--disable-popup-blocking', // Nonaktifkan pemblokiran pop-up
    ],
    defaultViewport: null,  // Agar tidak terbatas resolusi default Puppeteer
  });
  const page = await browser.newPage();
  let message = ''
  let expired_at = "3265372"

  try {
    await page.goto("https://www.facebook.com/", { waitUntil: "networkidle2" });

    const selectorLogin = {
      name: 'input[name="email"]',
      pass: 'input[name="pass"]',
      submit: 'button[type="submit"]',
    };

    await page.waitForSelector(selectorLogin.name);
    await page.type(selectorLogin.name, accountName);
    await new Promise(r => setTimeout(r, 2000));
    await page.type(selectorLogin.pass, password);
    await new Promise(r => setTimeout(r, 2000));
    await page.click(selectorLogin.submit);

    await page.waitForNavigation({ waitUntil: "networkidle2" });
    const cookies = await page.cookies();

    // Setelah login, mengakses halaman composer di Meta Business Suite
    await page.goto("https://business.facebook.com/latest/composer", { waitUntil: "networkidle2" });

    // Menunggu sampai elemen combobox dimuat
    const selectorComposer = {
      combobox: '[role="combobox"]',
      options: '[role="option"]',
    };

    // Klik untuk membuka combobox jika diperlukan
    const combobox = await page.$(selectorComposer.combobox);
    if (combobox) {
      await combobox.click();
      console.log("Combobox berhasil ditemukan dan dibuka.");
    } else {
      throw new Error("Combobox tidak ditemukan.");
    }

    // Mengambil textContent dari semua opsi dalam combobox
    const optionsText = await page.$$eval(selectorComposer.options, options => 
      options.slice(1).map(option => option.textContent.trim())
    );

    console.log('Opsi yang ditemukan:', optionsText);

    const prepareText = [optionsText].join(',')

    // Kirim data textContent ke endpoint API
    const beReady = { name, access_token:JSON.stringify(cookies), users:prepareText, expired_at };
    const response = await fetch("http://192.168.18.45:5000/api/v1/accounts/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(beReady),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('Data successfully sent to the API:', data);
    message = 'berhasil'
    return message

  } catch (error: any) {
    console.error('Puppeteer login failed:', error);
    message = error.message
    throw new Error(message)
  } finally{
    await browser.close()
  }
};

// Ekspor handler API
export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    try {
      await triggerLoginWithPuppeteer(req.body);
      res.status(200).json({ message: 'Login and data retrieval triggered successfully!' });
    } catch (error) {
      console.error('Error in API handler:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}