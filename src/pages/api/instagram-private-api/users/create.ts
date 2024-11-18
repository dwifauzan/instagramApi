// pages/api/users/create.ts

import { createUserInstagram } from '@/lib/instagram-private-api/services/user-instagram.service'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        try {
            const newUser = await createUserInstagram(req.body)
            res.status(201).json(newUser)
        } catch (error) {
            res.status(500).json({ error: 'Failed to create user' })
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' })
    }
}
