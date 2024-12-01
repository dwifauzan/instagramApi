import type { NextApiRequest, NextApiResponse } from 'next'
import { userFacebookService } from '@/pages/api/facebook-scrapper/userFacebookService'

export default async function handlerSinkron(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id } = req.query;

    if (req.method === 'GET') {
        try {
            const userId = Number(id);
            if (isNaN(userId)) {
                return res.status(400).json({ error: 'Invalid ID' });
            }

            const user = await userFacebookService.findById(userId);
            // console.log(user); // Cek hasil query di terminal

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.status(200).json(user); // Kirim hasil ke client
        } catch (error) {
            console.error(error); // Log error jika ada
            res.status(500).json({ error: 'Failed to find user' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

