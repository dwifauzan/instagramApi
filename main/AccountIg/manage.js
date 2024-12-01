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
Object.defineProperty(exports, "__esModule", { value: true });
exports.instagramHandle = void 0;
const instagramSessionService_1 = require("./instagramSessionService");
const userInstagramService_1 = require("./userInstagramService");
const instagram_private_api_1 = require("instagram-private-api");
const handleLogin = (dataLogin) => __awaiter(void 0, void 0, void 0, function* () {
    const resLogin = yield userInstagramService_1.userInstagramService.create(dataLogin);
    return resLogin;
});
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const resAllUsers = yield userInstagramService_1.userInstagramService.findAll();
    return resAllUsers;
});
const loginPrivate = (userLogin) => __awaiter(void 0, void 0, void 0, function* () {
    const userIgId = userLogin.id;
    const ig = new instagram_private_api_1.IgApiClient();
    ig.state.generateDevice(userLogin.username);
    yield ig.account.login(userLogin.username, userLogin.password);
    const serialized = yield ig.state.serialize();
    const cookieJar = yield ig.state.serializeCookieJar();
    const serializedCookieJar = JSON.stringify(cookieJar);
    const data = {
        userId: userIgId,
        session: JSON.stringify(serialized),
        cookieJar: serializedCookieJar
    };
    const checkUsersSession = yield instagramSessionService_1.instagramSessionService.findByUserId(userIgId);
    if (checkUsersSession) {
        const resSessionIg = yield instagramSessionService_1.instagramSessionService.update(userIgId, data);
    }
    else {
        const createSession = yield instagramSessionService_1.instagramSessionService.create(data);
    }
    const statusUpdate = yield userInstagramService_1.userInstagramService.updateStatus(userIgId, 'login');
    console.log(statusUpdate);
    return ({ success: true });
});
const logoutUsers = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const logoutUsers = yield userInstagramService_1.userInstagramService.updateStatus(id, 'logout');
    console.log(logoutUsers);
    return ({ success: true });
});
const deleteUsers = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const resDeleteUsers = yield userInstagramService_1.userInstagramService.delete(id);
    return ({ success: true });
});
const search = (dataSearch) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const ig = new instagram_private_api_1.IgApiClient();
    const searchAll = yield userInstagramService_1.userInstagramService.findAll();
    const macthed = searchAll.find(users => users.name === dataSearch.defaultAccount);
    if (macthed && macthed.session) {
        try {
            yield ig.state.deserialize(JSON.parse((_a = macthed.session) === null || _a === void 0 ? void 0 : _a.session));
            yield ig.state.deserializeCookieJar(JSON.parse((_b = macthed.session) === null || _b === void 0 ? void 0 : _b.cookieJar));
            const query = dataSearch.query;
            // Lakukan pencarian paralel
            const [users, hashtags, locations] = yield Promise.all([
                ig.search.users(query),
                ig.search.tags(query),
                ig.search.location(0, 0, query),
            ]);
            return {
                success: true,
                data: {
                    locations,
                    hashtags,
                    users,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Search failed.',
            };
        }
    }
});
const instagramHandle = {
    invoke: [
        {
            name: "handleLogin",
            togo: handleLogin
        },
        {
            name: "getAllUsersInstagram",
            togo: getAllUsers
        },
        {
            name: "loginPrivate",
            togo: loginPrivate
        },
        {
            name: "logoutUsers",
            togo: logoutUsers
        },
        {
            name: "deleteUsersIg",
            togo: deleteUsers
        },
        {
            name: "search",
            togo: search
        }
    ]
};
exports.instagramHandle = instagramHandle;
