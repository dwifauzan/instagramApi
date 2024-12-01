// pages/api/users/create.ts

import { userInstagramService } from '@/pages/api/instagram-private-api copy/services/userInstagramService'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        try {
            const newUser = await userInstagramService.create(req.body)
            res.status(201).json(newUser)
        } catch (error) {
            res.status(500).json({ error: 'Failed to create user' })
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' })
    }
}
