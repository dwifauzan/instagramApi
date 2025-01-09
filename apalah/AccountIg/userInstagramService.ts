// services/userInstagramService.ts
import { PrismaClient, UserInstagram } from '@prisma/client'

const prisma = new PrismaClient()

export const userInstagramService = {
    //ini buat nambah data baru
    create: async (data: Omit<UserInstagram, 'id'>) => {
        return await prisma.userInstagram.create({
            data,
        })
    },
    //ini buat nyari berdasarkan id
    findById: async (id: number) => {
        return await prisma.userInstagram.findUnique({
            where: { id },
            include: { session: true }
        })
    },
    //cari berdasarkan nama
    findByName: async (name: string) => {
        return await prisma.userInstagram.findUnique({
            where: { name },
            include: { session: true }
        })
    },
    //buat nampilkan semua data yang ada di UserInstagram
    findAll: async () => {
        return await prisma.userInstagram.findMany({
            include: { session: true }
        })
    },
    //buat update data sam update relasi yang nyambung di table ini
    update: async (id: number, data: Partial<Omit<UserInstagram, 'id'>>) => {
        return await prisma.userInstagram.update({
            where: { id },
            data,
            include: { session: true }
        })
    },
    //hapus data pada table UserInstagram dan hapus data relasinya juga
    delete: async (id: number) => {
        return await prisma.userInstagram.delete({
            where: { id },
            include: { session: true }
        })
    },
    //ini hanya update status accountnya saja apakah login atau logout atau juga relogin
    updateStatus: async (id: number, status: string) => {
        return await prisma.userInstagram.update({
            where: { id },
            data: { status },
        })
    }
}