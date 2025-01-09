// services/instagramSessionService.ts
import { PrismaClient, InstagramSession } from '@prisma/client'

const prisma = new PrismaClient()

export const instagramSessionService = {
    //ini buat nambah data baru ke table InstagramSession
    create: async (
        data: Omit<InstagramSession, 'id' | 'createdAt' | 'updatedAt'>
    ) => {
        return await prisma.instagramSession.create({
            data,
            include: {user: true}
        })
    },
    //ini buat cari berdasarkan id 
    findByUserId: async (userId: number) => {
        return await prisma.instagramSession.findUnique({
            where: { userId },
        })
    },
    //ini buat update
    update: async (
        userId: number,
        data: Partial<Omit<InstagramSession, 'id' | 'createdAt' | 'updatedAt'>>
    ) => {
        return await prisma.instagramSession.update({
            where: { userId },
            data: {
                ...data,
                updatedAt: new Date(),
            },
            include: { user: true },
        })
    },
    //ini buat delete
    delete: async (userId: number) => {
        return await prisma.instagramSession.delete({
            where: { userId },
        })
    },
}
