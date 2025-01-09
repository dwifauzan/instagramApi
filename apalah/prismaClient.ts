//fungsi file ini hanya untuk ngecek saja apakah prisma ada 
//pada aplikasi saat pertama kali dibuka file yang membutuhkan file ini hanya main.js

import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import path from 'path'

let prismaInstance: PrismaClient | null = null

class PrismaService {
    private static instance: PrismaClient | null = null

    private constructor() {
        // Private constructor to prevent direct construction calls
    }

    public static getInstance(): PrismaClient {
        if (!PrismaService.instance) {
            // Set DATABASE_URL berdasarkan environment
            if (app.isPackaged) {
                process.env.DATABASE_URL = `file:${path.join(process.resourcesPath, 'prisma', 'dev.db')}`
            } else {
                process.env.DATABASE_URL = `file:${path.join(__dirname, '..', '..', 'prisma', 'dev.db')}`
            }

            // Buat instance baru PrismaClient
            PrismaService.instance = new PrismaClient({
                datasources: {
                    db: {
                        url: process.env.DATABASE_URL
                    }
                },
                log: []  // Optional: untuk debugging
            })
        }
        return PrismaService.instance
    }

    public static async disconnect(): Promise<void> {
        if (PrismaService.instance) {
            await PrismaService.instance.$disconnect()
            PrismaService.instance = null
        }
    }
}

export const getPrismaClient = (): PrismaClient => {
    return PrismaService.getInstance()
}

export const disconnectPrisma = async (): Promise<void> => {
    await PrismaService.disconnect()
}
