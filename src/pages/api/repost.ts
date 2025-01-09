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
            const { id, caption, location } = req.body

            const userResponse = await axios.get(
                `http://192.168.18.45:5000/api/v1/users/${id}`
            )
            const user = userResponse.data.data
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const result = await repostToInstagram(
                user.username,
                user.session,
                caption,
                location
            )

            if (result.success) {
                res.status(200).json({ success: true, media: result.media })
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error,
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
    caption: string,
    location: any
): Promise<any> => {
    try {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        ig.state.generateDevice(username)
        await ig.simulate.preLoginFlow()
        await ig.state.deserialize(sessionData.session)

        // Deserialize cookies if available
        if (sessionData.cookieJar) {
            await ig.state.deserializeCookieJar(sessionData.cookieJar)
        }

        await new Promise((resolve) => setTimeout(resolve, 3000))
        const directoryPath = path.join(process.cwd(), 'public', 'repost')
        const files = fs.readdirSync(directoryPath)

        const { latitude, longitude, searchQuery } = {
            latitude: 0.0,
            longitude: 0.0,
            // not required
            searchQuery: 'malang',
        }

        const locations = await ig.search.location(
            latitude,
            longitude,
            searchQuery
        )

        const mediaLocation = locations[0]
        console.log(mediaLocation)

        if (files.includes('media-0.mp4')) {
            const coverImage = fs.readFileSync(
                path.join(directoryPath, 'cover-0.jpg')
            )
            const video = fs.readFileSync(
                path.join(directoryPath, 'media-0.mp4')
            )
            const publish = await ig.publish.video({
                coverImage,
                video,
                caption,
                location: mediaLocation,
            })
            return { success: true, media: publish }
        } else if (files.includes('media-0.jpg')) {
            const mediaPath = path.join(directoryPath, 'media-0.jpg')
            const photo = fs.readFileSync(mediaPath)
            const publish = await ig.publish.photo({
                // read the file into a Buffer
                file: photo,
                // optional, default ''
                caption,
                // optional
                location: mediaLocation,
            })
            return { success: true, media: publish }
        } else {
            return {
                success: false,
                error: 'No media files found in the directory',
            }
        }
    } catch (err: any) {
        console.log(err)
        return {
            success: false,
            error: err.message || 'Internal Server Error',
        }
    }
}
