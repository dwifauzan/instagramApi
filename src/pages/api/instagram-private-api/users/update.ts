// pages/api/users/[id]/update.ts

import { userInstagramService } from '@/pages/api/instagram-private-api copy/services/userInstagramService'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id } = req.query

    if (req.method === 'PUT') {
        try {
            const updatedUser = await userInstagramService.update(Number(id), req.body)
            res.status(200).json(updatedUser)
        } catch (error) {
            res.status(500).json({ error: 'Failed to update user' })
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' })
    }
}
