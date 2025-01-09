// pages/api/instagram/search.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { InstagramSearchService } from '@/pages/api/instagram-private-api copy/services/instagramSearchService'
import { userInstagramService } from '@/pages/api/instagram-private-api copy/services/userInstagramService'

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
        const { keyword, username } = req.body

        if (!keyword || !username) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
            })
        }

        const user = await userInstagramService.findByName(username)

        // Use transaction with increased timeout
        const response = await prisma.$transaction(
            async (tx) => {
                const searchService = new InstagramSearchService(tx)
                return await searchService.searchKeyword(keyword, user!.id)
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


        return res.status(200).json(response)
    } catch (error) {
        console.error('Search API error:', error)
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        })
    } finally {
        await prisma.$disconnect()
    }
}
