// services/UsersFacebookService.ts
import { PrismaClient, UsersFacebook } from '@prisma/client'

const prisma = new PrismaClient()

export const userFacebookService = {
    create: async (data: Omit<UsersFacebook, 'id'>) => {
        return await prisma.usersFacebook.create({
            data,
        })
    },

    findById: async (id: number) => {
        return await prisma.usersFacebook.findFirst({
            where: { id },
        })
    },

    findAll: async () => {
        return await prisma.usersFacebook.findMany({
            include: {AccountFacebook: true}
        })
    },

    update: async (id: number, data: Partial<Omit<UsersFacebook, 'id'>>) => {
        return await prisma.usersFacebook.update({
            where: { id },
            data,
        })
    },

    delete: async (id: number) => {
        return await prisma.usersFacebook.delete({
            where: { id },
        })
    },
}