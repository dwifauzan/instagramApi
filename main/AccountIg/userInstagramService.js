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
exports.userInstagramService = void 0;
// services/userInstagramService.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.userInstagramService = {
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        return yield prisma.userInstagram.create({
            data,
        });
    }),
    findById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield prisma.userInstagram.findUnique({
            where: { id },
            include: { session: true }
        });
    }),
    findByName: (name) => __awaiter(void 0, void 0, void 0, function* () {
        return yield prisma.userInstagram.findUnique({
            where: { name },
            include: { session: true }
        });
    }),
    findAll: () => __awaiter(void 0, void 0, void 0, function* () {
        return yield prisma.userInstagram.findMany({
            include: { session: true }
        });
    }),
    update: (id, data) => __awaiter(void 0, void 0, void 0, function* () {
        return yield prisma.userInstagram.update({
            where: { id },
            data,
            include: { session: true }
        });
    }),
    delete: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield prisma.userInstagram.delete({
            where: { id },
            include: { session: true }
        });
    }),
    updateStatus: (id, status) => __awaiter(void 0, void 0, void 0, function* () {
        return yield prisma.userInstagram.update({
            where: { id },
            data: { status },
        });
    })
};
