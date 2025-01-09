// services/AccountFacebookService.ts
import { PrismaClient, CookiesFacebook } from '@prisma/client'

const prisma = new PrismaClient()

export const cookiesFacebook = {
    //buat data baru di table CookiesFacebook
    create: async (
        data: Omit<CookiesFacebook, 'id' | 'created_at' | 'updated_at'>
    ) => {
        return await prisma.cookiesFacebook.create({
            data,
            include: { userFacebook: true },
        })
    },
    //cari berdasarkan id
    findByUserId: async (userFacebookId: number) => {
        return await prisma.cookiesFacebook.findUnique({
            where: { userFacebookId },
            include: { userFacebook: true },
        })
    },
    //buat update serta update relasi yang nyambung di table CookiesFacebook
    update: async (
        userFacebookId: number,
        data: Partial<Omit<CookiesFacebook, 'id' | 'created_at' | 'updated_at'>>
    ) => {
        return await prisma.cookiesFacebook.update({
            where: { userFacebookId },
            data: {
                ...data,
                updated_at: new Date(),
            },
            include: { userFacebook: true },
        })
    },
    //buat hapus data pada table CookiesFacebook
    delete: async (userFacebookId: number) => {
        return await prisma.cookiesFacebook.delete({
            where: { userFacebookId },
        })
    },
}
