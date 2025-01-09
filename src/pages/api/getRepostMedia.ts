import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const folderPath = path.join(process.cwd(), 'public', 'repost');
        const files = fs.readdirSync(folderPath);

        // Filter file selain .txt
        const mediaFiles = files.filter(
            (file) => !file.endsWith('.txt') && (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.webp') || file.endsWith('.mp4'))
        );

        res.status(200).json({ mediaFiles });
    } catch (error) {
        console.error('Error reading repost folder:', error);
        res.status(500).json({ error: 'Failed to read repost folder' });
    }
}
