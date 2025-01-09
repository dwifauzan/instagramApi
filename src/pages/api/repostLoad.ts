import type { NextApiRequest, NextApiResponse } from "next";
import fs from 'fs';
import path from 'path';
import axios from "axios";
import ffmpeg from 'fluent-ffmpeg';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        try {
            const { url, caption } = req.body;
            console.log(url);
            console.log('=========================================');
            console.log(caption);

            if (!url) {
                return res.status(404).json({ message: 'Media yang dikirim tidak ada' });
            }
            if (!caption) {
                return res.status(404).json({ message: 'Caption yang dikirim tidak ada' });
            }

            const mediaDir = path.join(process.cwd(), './public/repost');
            if (!fs.existsSync(mediaDir)) {
                fs.mkdirSync(mediaDir, { recursive: true });
            }
            let mediaExtension: string;
            const mediaPaths = await Promise.all(
                url.map(async (mediaUrl: string, index: number) => {
                    try {
                        const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });

                        // Tentukan ekstensi file berdasarkan tipe media
                        if (mediaUrl.includes('.mp4')) {
                            const originalMediaFilePath = path.join(mediaDir, `media-${index}-original.mp4`);
                            const resizedMediaFilePath = path.join(mediaDir, `media-${index}.mp4`);

                            fs.writeFileSync(originalMediaFilePath, response.data);

                            // Resize video ke rasio 1080x1350
                            await new Promise<void>((resolve, reject) => {
                                ffmpeg(originalMediaFilePath)
                                    .outputOptions([
                                        '-vf', 'scale=1080:1350:force_original_aspect_ratio=increase,crop=1080:1350',
                                        '-c:v', 'libx264',
                                        '-crf', '23',
                                        '-preset', 'fast'
                                    ])
                                    .on('end', () => {
                                        console.log(`Video resized to 1080x1350: ${resizedMediaFilePath}`);
                                        resolve();
                                    })
                                    .on('error', (err: any) => {
                                        console.error(`Error resizing video: ${err.message}`);
                                        reject(err);
                                    })
                                    .save(resizedMediaFilePath);
                            });

                            fs.unlinkSync(originalMediaFilePath);
                            return resizedMediaFilePath;

                        }  else if (mediaUrl.includes('.jpg') || mediaUrl.includes('.jpeg') || mediaUrl.includes('.png')) {
                            mediaExtension = 'jpg'; // Image file
                        } else {
                            // Default to jpg for any other type
                            mediaExtension = 'jpg';
                        }
                        const mediaFilePath = path.join(mediaDir, `media-${index}.${mediaExtension}`);
                        // Tulis data media ke file
                    fs.writeFileSync(mediaFilePath, response.data);

                    // Kembalikan path file media yang disimpan
                    return mediaFilePath;
                    } catch (err) {
                        console.error(`Failed to process media: ${mediaUrl}`, err);
                        return null; // Media gagal diproses, kembali null
                    }
                })
            );

            // Filter hasil null (media yang gagal diproses)
            const validMediaPaths = mediaPaths.filter((path) => path !== null);

            return res.status(200).json({ success: true, mediaPaths: validMediaPaths });

        } catch (err: any) {
            console.error(err);
            return res.status(500).json({ message: 'Error saving media and caption' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default handler;
