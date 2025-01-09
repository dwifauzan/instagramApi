// pages/api/users/create.ts
import { cookiesFacebook } from '@/pages/api/facebook-scrapper/accountFacebook'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        try {
            const newUser = await cookiesFacebook.create(req.body)
            res.status(200).json(newUser)
        } catch (error) {
            res.status(500).json({ error: 'Failed to create user' })
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' })
    }
}
