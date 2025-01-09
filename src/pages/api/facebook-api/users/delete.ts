// pages/api/users/[id]/delete.ts

import { userFacebookService } from '@/pages/api/facebook-scrapper/userFacebookService'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id } = req.query

    if (req.method === 'DELETE') {
        try {
      
            await userFacebookService.delete(Number(id))
            res.status(204).json({ message: 'User deleted successfully' })
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete user' })
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' })
    }
}
