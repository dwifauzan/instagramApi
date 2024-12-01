"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const userFacebookService_1 = require("./userFacebookService");
const accountFacebook_1 = require("./accountFacebook");
const puppeteer_1 = __importDefault(require("puppeteer"));
const handleCokies = (cokies) => __awaiter(void 0, void 0, void 0, function* () {
    const responseCokies = yield accountFacebook_1.cookiesFacebook.create(cokies);
    return responseCokies;
});
const handleakun = (accountForm) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(accountForm);
    const account = Object.assign(Object.assign({}, accountForm), { created_at: new Date() });
    const addAccount = yield userFacebookService_1.userFacebookService.create(account);
    const userFacebookId = addAccount.id;
    //jalankan fungsi puppeteer
    const browser = yield puppeteer_1.default.launch({
        headless: false,
        args: [
            '--disable-notifications',
            '--disable-infobars',
            '--disable-popup-blocking', // Nonaktifkan pemblokiran pop-up
        ],
        defaultViewport: null, // Agar tidak terbatas resolusi default Puppeteer
    });
    const page = yield browser.newPage();
    let message = '';
    try {
        yield page.goto('https://www.facebook.com/', {
            waitUntil: 'networkidle2',
        });
        const selectorLogin = {
            name: 'input[name="email"]',
            pass: 'input[name="pass"]',
            submit: 'button[type="submit"]',
        };
        yield page.waitForSelector(selectorLogin.name);
        yield page.type(selectorLogin.name, accountForm.username, { delay: 120 });
        yield new Promise((r) => setTimeout(r, 2000));
        yield page.type(selectorLogin.pass, accountForm.password, { delay: 120 });
        yield new Promise((r) => setTimeout(r, 2000));
        yield page.click(selectorLogin.submit);
        yield page.waitForNavigation({ waitUntil: 'networkidle2' });
        const currentUrl = page.url();
        if (currentUrl.includes('https://www.facebook.com/two_step_verification/authentication/')) {
            console.log('Two-step verification detected. Waiting for 50 seconds...');
            yield new Promise((r) => setTimeout(r, 50000)); // Tunggu 30 detik
        }
        else {
            console.log('No two-step verification detected. Continuing...');
        }
        const cookies = yield page.cookies();
        //setelah login mengambil url profile
        yield page.goto('https://www.facebook.com/profile', {
            waitUntil: 'networkidle2',
        });
        yield new Promise((r) => setTimeout(r, 2000));
        const imageUrl = yield page.evaluate(() => {
            const picProfile = document.querySelector('g image');
            return picProfile ? picProfile.getAttribute('xlink:href') : null;
        });
        let profilePic = '';
        if (imageUrl) {
            console.log('Profile picture URL:', imageUrl);
            // Buka tab baru
            const newTab = yield page.browser().newPage();
            // Navigasi ke URL gambar di tab baru
            yield newTab.goto(imageUrl, { waitUntil: 'networkidle2' });
            // Tunggu sebentar untuk memastikan gambar dimuat sepenuhnya
            yield new Promise((r) => setTimeout(r, 2000));
            // Ambil URL gambar dari tab baru (jika diperlukan)
            profilePic = yield newTab.url();
            yield new Promise((r) => setTimeout(r, 2000));
            yield newTab.close();
        }
        // Setelah login, mengakses halaman composer di Meta Business Suite
        yield page.goto('https://business.facebook.com/latest/composer', {
            waitUntil: 'networkidle2',
        });
        yield new Promise((r) => setTimeout(r, 2000));
        // Menunggu sampai elemen combobox dimuat
        const selectorComposer = {
            combobox: '[role="combobox"]',
            options: '[role="option"]',
        };
        // Klik untuk membuka combobox jika diperlukan
        const combobox = yield page.$(selectorComposer.combobox);
        if (combobox) {
            yield combobox.click();
            console.log('Combobox berhasil ditemukan dan dibuka.');
        }
        else {
            throw new Error('Combobox tidak ditemukan.');
        }
        // Mengambil textContent dari semua opsi dalam combobox
        const optionsText = yield page.$$eval(selectorComposer.options, (options) => options.map((option) => { var _a; return (_a = option.textContent) === null || _a === void 0 ? void 0 : _a.trim(); }));
        console.log('Opsi yang ditemukan:', optionsText);
        const prepareText = [optionsText].join(',');
        // Kirim data textContent ke endpoint API
        const beReady = {
            profilePic,
            access_token: JSON.stringify(cookies),
            userInstagram: prepareText,
            userFacebookId
        };
        const response = yield handleCokies(beReady);
        yield browser.close();
        message = 'berhasil';
        return message;
    }
    catch (error) {
        console.error('Puppeteer login failed:', error);
        message = error.message;
        throw new Error(message);
    }
    finally {
        yield browser.close();
    }
});
const getAllUser = () => __awaiter(void 0, void 0, void 0, function* () {
    const usersFacebook = yield userFacebookService_1.userFacebookService.findAll();
    return usersFacebook;
});
const deleteUsers = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const deleteUsers = yield userFacebookService_1.userFacebookService.delete(id);
});
const sinkronUsers = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const sinkronUsers = yield userFacebookService_1.userFacebookService.findById(id);
    if (!sinkronUsers) {
        throw new Error('user not found');
    }
    // return sinkronUsers
    const browser = yield puppeteer_1.default.launch({
        headless: false,
        args: [
            '--disable-notifications',
            '--disable-infobars',
            '--disable-popup-blocking', // Nonaktifkan pemblokiran pop-up
        ],
        defaultViewport: null, // Agar tidak terbatas resolusi default Puppeteer
    });
    const page = yield browser.newPage();
    let message = '';
    try {
        yield page.goto('https://www.facebook.com/', {
            waitUntil: 'networkidle2',
        });
        const selectorLogin = {
            name: 'input[name="email"]',
            pass: 'input[name="pass"]',
            submit: 'button[type="submit"]',
        };
        yield page.waitForSelector(selectorLogin.name);
        yield page.type(selectorLogin.name, sinkronUsers.username, { delay: 120 });
        yield new Promise((r) => setTimeout(r, 2000));
        yield page.type(selectorLogin.pass, sinkronUsers.password, { delay: 120 });
        yield new Promise((r) => setTimeout(r, 2000));
        yield page.click(selectorLogin.submit);
        yield page.waitForNavigation({ waitUntil: 'networkidle2' });
        const currentUrl = page.url();
        if (currentUrl.includes('https://www.facebook.com/two_step_verification/authentication/')) {
            console.log('Two-step verification detected. Waiting for 50 seconds...');
            yield new Promise((r) => setTimeout(r, 50000)); // Tunggu 30 detik
        }
        else {
            console.log('No two-step verification detected. Continuing...');
        }
        const cookies = yield page.cookies();
        //setelah login mengambil url profile
        yield page.goto('https://www.facebook.com/profile', {
            waitUntil: 'networkidle2',
        });
        yield new Promise((r) => setTimeout(r, 2000));
        const imageUrl = yield page.evaluate(() => {
            const picProfile = document.querySelector('g image');
            return picProfile ? picProfile.getAttribute('xlink:href') : null;
        });
        let profilePic = '';
        if (imageUrl) {
            console.log('Profile picture URL:', imageUrl);
            // Buka tab baru
            const newTab = yield page.browser().newPage();
            // Navigasi ke URL gambar di tab baru
            yield newTab.goto(imageUrl, { waitUntil: 'networkidle2' });
            // Tunggu sebentar untuk memastikan gambar dimuat sepenuhnya
            yield new Promise((r) => setTimeout(r, 2000));
            // Ambil URL gambar dari tab baru (jika diperlukan)
            profilePic = yield newTab.url();
            yield new Promise((r) => setTimeout(r, 2000));
            yield newTab.close();
        }
        // Setelah login, mengakses halaman composer di Meta Business Suite
        yield page.goto('https://business.facebook.com/latest/composer', {
            waitUntil: 'networkidle2',
        });
        // Menunggu sampai elemen combobox dimuat
        const selectorComposer = {
            combobox: '[role="combobox"]',
            options: '[role="option"]',
        };
        // Klik untuk membuka combobox jika diperlukan
        const combobox = yield page.$(selectorComposer.combobox);
        if (combobox) {
            yield combobox.click();
            console.log('Combobox berhasil ditemukan dan dibuka.');
        }
        else {
            throw new Error('Combobox tidak ditemukan.');
        }
        // Mengambil textContent dari semua opsi dalam combobox
        const optionsText = yield page.$$eval(selectorComposer.options, (options) => options.map((option) => { var _a; return (_a = option.textContent) === null || _a === void 0 ? void 0 : _a.trim(); }));
        console.log('Opsi yang ditemukan:', optionsText);
        const prepareText = [optionsText].join(',');
        // Kirim data textContent ke endpoint API
        const userFacebookId = sinkronUsers.id;
        const beReady = {
            profilePic,
            access_token: JSON.stringify(cookies),
            userInstagram: prepareText,
        };
        const response = yield accountFacebook_1.cookiesFacebook.update(userFacebookId, beReady);
        yield browser.close();
        message = 'berhasil';
        return message;
    }
    catch (error) {
        console.error('Puppeteer login failed:', error);
        message = error.message;
        throw new Error(message);
    }
    finally {
        yield browser.close();
    }
});
const handler = {
    invoke: [
        {
            name: "createAccount",
            togo: handleakun, // Mengacu langsung ke fungsi handlerAccount
        },
        {
            name: "cokiesUser",
            togo: accountFacebook_1.cookiesFacebook
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
exports.handler = handler;
