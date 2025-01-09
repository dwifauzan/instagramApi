import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const handlerRepostFile = (req: NextApiRequest, res: NextApiResponse) => {
    const fileText = path.join(process.cwd(), '/public/repost/caption.txt')
    try {
        const fileContent = fs.readFileSync(fileText, 'utf-8')
        res.status(201).json({ content: fileContent })
    } catch (err: any) {
        res.status(500).json({ failed: 'gagal menggunakan caption' })
    }
}

export default handlerRepostFile
