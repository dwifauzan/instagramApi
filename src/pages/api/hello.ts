// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'

type Data = {
    name: string
}

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    const arsip_name = req.query.arsip_name as string
    const directoryPath = path.join(
        process.cwd(),
        'public',
        'arsip',
        arsip_name
    )
    const entries = fs.readdirSync(directoryPath, { withFileTypes: true })

    const folders = entries
        .filter((entry) => entry.isDirectory())
        .map((folder) => folder.name)

    let files = []
    for (const folder of folders) {
        const folderPath = path.join(directoryPath, folder)
        files.push(fs.readdirSync(folderPath).map((file) => file))
    }

    res.status(200).json({ folders, files })
}