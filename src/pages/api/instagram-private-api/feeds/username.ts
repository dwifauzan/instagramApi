// pages/api/instagram/search.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { userInstagramService } from '@/lib/instagram-private-api/services/userInstagramService'
import { InstagramFeedService } from '@/lib/instagram-private-api/services/instagramFeedService'

const prisma = new PrismaClient()

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
        })
    }

    try {
        const { pk, nextMaxId, username } = req.body

        if (!pk || !username) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
            })
        }

        const user = await userInstagramService.findByName(username)

        // Use transaction with increased timeout
        const response = await prisma.$transaction(
            async (tx) => {
                const feedsService = new InstagramFeedService(tx)
                return await feedsService.getFeedsByUsername(pk, user!.id, nextMaxId)
            },
            {
                timeout: 30000, // 30 seconds timeout
            }
        )

        if (!response.success) {
            return res.status(400).json({
                success: false,
                error: response.error || 'Search failed',
            })
        }

        // await prisma.$disconnect()
        return res.status(200).json(response)
    } catch (error) {
        console.error('Search API error:', error)
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        })
    }
}
