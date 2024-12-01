// services/userInstagramService.ts
import { PrismaClient, UserInstagram } from '@prisma/client'

const prisma = new PrismaClient()

export const userInstagramService = {
    create: async (data: Omit<UserInstagram, 'id'>) => {
        return await prisma.userInstagram.create({
            data,
            include: { session: true }
        })
    },

    findById: async (id: number) => {
        return await prisma.userInstagram.findUnique({
            where: { id },
            include: { session: true }
        })
    },

    findByName: async (name: string) => {
        return await prisma.userInstagram.findUnique({
            where: { name },
            include: { session: true }
        })
    },

    findAll: async () => {
        return await prisma.userInstagram.findMany({
            include: { session: true }
        })
    },

    update: async (id: number, data: Partial<Omit<UserInstagram, 'id'>>) => {
        return await prisma.userInstagram.update({
            where: { id },
            data,
            include: { session: true }
        })
    },

    delete: async (id: number) => {
        return await prisma.userInstagram.delete({
            where: { id },
            include: { session: true }
        })
    },

    updateStatus: async (id: number, status: string) => {
        return await prisma.userInstagram.update({
            where: { id },
            data: { status },
            include: { session: true }
        })
    }
}