// pages/api/instagram/check-session.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { InstagramAuthService } from '@/pages/api/instagram-private-api copy/services/instagramAuthService'
import { ApiResponse } from './types'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        })
    }

    try {
        const { userId } = req.body

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            })
        }

        const authService = new InstagramAuthService()
        const isValid = await authService.checkSession(Number(userId))

        return res.status(200).json({
            success: true,
            data: { isValid }
        })
    } catch (error) {
        console.error('Session check API error:', error)
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        })
    }
}