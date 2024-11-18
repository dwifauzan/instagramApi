import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id } = req.body
    if (req.method === 'DELETE') {
        try {
            await prisma.arsip.delete({ where: { id: Number(id) } })
            res.status(200).json({ success: 'berhasil di hapus' })
        } catch (err: any) {
            res.status(500).json({ err: 'gagal untuk menghapus' })
        }
    } else {
        res.setHeader('Allow', ['DELETE'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}
