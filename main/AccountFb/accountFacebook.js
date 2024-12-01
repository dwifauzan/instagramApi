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
exports.cookiesFacebook = void 0;
// services/AccountFacebookService.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.cookiesFacebook = {
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        return yield prisma.cookiesFacebook.create({
            data,
            include: { userFacebook: true },
        });
    }),
    findByUserId: (userFacebookId) => __awaiter(void 0, void 0, void 0, function* () {
        return yield prisma.cookiesFacebook.findUnique({
            where: { userFacebookId },
            include: { userFacebook: true },
        });
    }),
    update: (userFacebookId, data) => __awaiter(void 0, void 0, void 0, function* () {
        return yield prisma.cookiesFacebook.update({
            where: { userFacebookId },
            data: Object.assign(Object.assign({}, data), { updated_at: new Date() }),
            include: { userFacebook: true },
        });
    }),
    delete: (userFacebookId) => __awaiter(void 0, void 0, void 0, function* () {
        return yield prisma.cookiesFacebook.delete({
            where: { userFacebookId },
        });
    }),
};
