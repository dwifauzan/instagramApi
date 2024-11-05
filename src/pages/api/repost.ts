// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { IgApiClient } from 'instagram-private-api'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

const ig = new IgApiClient()

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        try {
            const { id, caption } = req.body
            const userResponse = await axios.get(
                `http://192.168.18.45:5000/api/v1/users/${id}`
            )
            const user = userResponse.data.data

            const result = await repostToInstagram(
                user.username,
                user.session,
                caption
            )

            if (result.success) {
                res.status(200).json({ success: true, media: result.media })
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to repost to Instagram',
                })
            }
        } catch (error) {
            console.error('Handler error:', error)
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
            })
        }
    } else {
        res.setHeader('Allow', ['POST'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}

export const repostToInstagram = async (
    username: string,
    sessionData: any,
    caption: string
): Promise<any> => {
    try {
        ig.state.generateDevice(username)
        await ig.simulate.preLoginFlow()
        await ig.state.deserialize(sessionData.session)

        // Deserialize cookies if available
        if (sessionData.cookieJar) {
            await ig.state.deserializeCookieJar(sessionData.cookieJar)
        }

        const directoryPath = path.join(process.cwd(), 'public', 'repost');
        const files = fs.readdirSync(directoryPath)

        if(files.includes('media-0.mp4')) {
            const coverImage = fs.readFileSync(path.join(directoryPath, 'cover-0.jpg'))
            const video = fs.readFileSync(path.join(directoryPath, 'media-0.mp4'))
            const publish = await ig.publish.video({coverImage , video, caption })
            return { success: true, media: publish }
        } else if (files.includes('media-0.jpg')) {
            const mediaPath = path.join(directoryPath, 'media-0.jpg')
            const photo = fs.readFileSync(mediaPath)
            const publish = await ig.publish.photo({ file: photo, caption })
            return { success: true, media: publish }
        }
    } catch (error: any) {
        console.error('Repost to Instagram error:', error)
        return { success: false, error: error.message }
    }
}
