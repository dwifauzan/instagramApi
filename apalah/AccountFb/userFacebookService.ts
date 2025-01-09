// services/UsersFacebookService.ts
import { PrismaClient, UsersFacebook } from '@prisma/client'

const prisma = new PrismaClient()

export const userFacebookService = {
    //buat data baru
    create: async (data: Omit<UsersFacebook, 'id'>) => {
        return await prisma.usersFacebook.create({
            data,
        })
    },
    //cari berdasarkan id
    findById: async (id: number) => {
        return await prisma.usersFacebook.findFirst({
            where: { id },
        })
    },
    //buat nampilkan semua data beserta relasinya 
    findAll: async () => {
        return await prisma.usersFacebook.findMany({
            include: {AccountFacebook: true}
        })
    },
    //buat update table userFacebook
    update: async (id: number, data: Partial<Omit<UsersFacebook, 'id'>>) => {
        return await prisma.usersFacebook.update({
            where: { id },
            data,
        })
    },
    //buat delete table utama userFacebook sama relasi yang nyambung ke table ini
    delete: async (id: number) => {
        await prisma.cookiesFacebook.deleteMany({
            where: {userFacebookId: id}
        })
        return await prisma.usersFacebook.delete({
            where: { id },
        })
    },
}