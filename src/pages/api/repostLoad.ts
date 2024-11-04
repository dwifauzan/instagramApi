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

            const mediaPaths = await Promise.all(
                url.map(async (mediaUrl: string, index: number) => {
                    const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });

                    // Tentukan ekstensi file berdasarkan tipe media
                    let mediaExtension: string;
                    if (mediaUrl.includes('.mp4')) {
                        mediaExtension = 'mp4'; // Video file

                        // Buat path file untuk video yang diunduh
                        const mediaFilePath = path.join(mediaDir, `media-${index}.${mediaExtension}`);

                        // Tulis data media ke file
                        fs.writeFileSync(mediaFilePath, response.data);

                        // Ambil screenshot dari video yang telah disimpan menggunakan fluent-ffmpeg
                        const coverImagePath = path.join(mediaDir, `cover-${index}.jpg`);
                        await new Promise<void>((resolve, reject) => {
                            ffmpeg(mediaFilePath)
                                .on('end', () => {
                                    console.log(`Screenshot taken for video: ${mediaFilePath}`);
                                    resolve();
                                })
                                .on('error', (err: any) => {
                                    console.error(`Error taking screenshot: ${err.message}`);
                                    reject(err);
                                })
                                .screenshots({
                                    count: 1,
                                    timemarks: ['1'], // Ambil snapshot pada detik ke-1
                                    folder: mediaDir,
                                    filename: `cover-${index}.jpg`
                                });
                        });

                        return mediaFilePath; // Kembalikan path video yang disimpan
                    } else if (mediaUrl.includes('.jpg') || mediaUrl.includes('.jpeg') || mediaUrl.includes('.png')) {
                        mediaExtension = 'jpg'; // Image file
                    } else {
                        // Default to jpg for any other type
                        mediaExtension = 'jpg';
                    }

                    // Buat path file media menggunakan ekstensi yang ditentukan
                    const mediaFilePath = path.join(mediaDir, `media-${index}.${mediaExtension}`);

                    // Tulis data media ke file
                    fs.writeFileSync(mediaFilePath, response.data);

                    // Kembalikan path file media yang disimpan
                    return mediaFilePath;
                })
            );

            const captionFilePath = path.join(mediaDir, 'caption.txt');
            fs.writeFileSync(captionFilePath, caption);

            return res.status(200).json({ success: true });
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
