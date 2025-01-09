import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { InstagramAuthService } from '@/pages/api/instagram-private-api copy/services/instagramAuthService'
import { ApiResponse } from './types'

const prisma = new PrismaClient()

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
        })
    }

    try {
        const { name, username, password } = req.body

        if (!name || !username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
            })
        }

        // Use transaction with increased timeout
        const response = await prisma.$transaction(
            async (tx) => {
                const authService = new InstagramAuthService(tx)
                return await authService.login(name, username, password)
            },
            {
                timeout: 30000, // 30 seconds timeout
            }
        )

        if (!response.success) {
            return res.status(401).json({
                success: false,
                error: response.error || 'Authentication failed',
            })
        }

        return res.status(200).json(response)
    } catch (error) {
        console.error('Login API error:', error)
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        })
    } finally {
        await prisma.$disconnect()
    }
}