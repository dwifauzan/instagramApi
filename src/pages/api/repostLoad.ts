import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import ffmpeg from 'fluent-ffmpeg'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        try {
            const { url, caption } = req.body

            if (!url) {
                return res
                    .status(404)
                    .json({ message: 'Media yang dikirim tidak ada' })
            }
            if (!caption) {
                return res
                    .status(404)
                    .json({ message: 'Caption yang dikirim tidak ada' })
            }

            const mediaDir = path.join(process.cwd(), './public/repost')
            if (!fs.existsSync(mediaDir)) {
                fs.mkdirSync(mediaDir, { recursive: true })
            }

            const mediaPaths = await Promise.all(
                url.map(async (mediaUrl: string, index: number) => {
                    const response = await axios.get(mediaUrl, {
                        responseType: 'arraybuffer',
                    })

                    if (mediaUrl.includes('.mp4')) {
                        const mediaFilePath = path.join(
                            mediaDir,
                            `wait-media-${index}.mp4`
                        )
                        const resizedFilePath = path.join(
                            mediaDir,
                            `media-${index}.mp4`
                        )

                        // Tulis data video ke file sementara
                        fs.writeFileSync(mediaFilePath, response.data)

                        try {
                            // Resize video ke 1080x1350
                            await new Promise<void>((resolve, reject) => {
                                ffmpeg(mediaFilePath)
                                    .outputOptions([
                                        '-vf',
                                        'scale=1080:1350',
                                        '-c:v',
                                        'libx264',
                                        '-preset',
                                        'fast',
                                        '-crf',
                                        '23',
                                        '-c:a',
                                        'aac',
                                        '-b:a',
                                        '128k',
                                    ])
                                    .on('start', (commandLine) => {
                                        console.log(
                                            'FFmpeg command:',
                                            commandLine
                                        )
                                    })
                                    .on('end', () => {
                                        console.log(
                                            `Video resized successfully: ${resizedFilePath}`
                                        )
                                        resolve()
                                    })
                                    .on('error', (err: any) => {
                                        console.error(
                                            `Error resizing video: ${err.message}`
                                        )
                                        reject(err)
                                    })
                                    .save(resizedFilePath)
                            })

                            // Hapus file asli setelah resize berhasil
                            fs.unlinkSync(mediaFilePath)
                            return resizedFilePath // Kembalikan path video hasil resize
                        } catch (resizeError) {
                            console.error(
                                `Resize failed for video: ${mediaFilePath}`
                            )
                            fs.unlinkSync(mediaFilePath) // Hapus file asli jika resize gagal
                            return null // Abaikan video ini
                        }
                    }

                    return null // Abaikan media selain video
                })
            )

            // Filter hanya video yang berhasil di-resize
            const validMediaPaths = mediaPaths.filter((path) => path !== null)

            if (validMediaPaths.length === 0) {
                return res.status(400).json({
                    message:
                        'Tidak ada video yang berhasil diproses ke resolusi 1080x1350',
                })
            }

            const captionFilePath = path.join(mediaDir, 'caption.txt')
            fs.writeFileSync(captionFilePath, caption)

            return res
                .status(200)
                .json({ success: true, mediaPaths: validMediaPaths })
        } catch (err: any) {
            console.error(err)
            return res
                .status(500)
                .json({ message: 'Error saving media and caption' })
        }
    } else {
        res.setHeader('Allow', ['POST'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}

export default handler
