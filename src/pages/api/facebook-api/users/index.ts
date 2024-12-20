// pages/api/users/index.ts

import { userFacebookService } from '@/pages/api/facebook-scrapper/userFacebookService'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            const users = await userFacebookService.findAll()
            res.status(200).json(users)
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch users' })
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' })
    }
}
