// pages/api/users/[id].ts

import { userInstagramService } from '@/pages/api/instagram-private-api copy/services/userInstagramService'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id } = req.query

    if (req.method === 'GET') {
        try {
            const user = await userInstagramService.findById(Number(id))
            if (user) {
                res.status(200).json(user)
            } else {
                res.status(404).json({ error: 'User not found' })
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch user' })
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' })
    }
}
