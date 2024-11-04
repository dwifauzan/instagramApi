import type { NextApiRequest, NextApiResponse } from "next"
import fs from 'fs'
import path from 'path'
import axios from "axios"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        try{
            const {url, caption} = req.body
            console.log(url)
            console.log('=========================================')
            console.log(caption)

            if(!url){
                return res.status(404).json({message: 'media yang dikirim tidak ada'})
            }
            if(!caption){
                return res.status(404).json({message: 'caption yang dikirim tidak ada'})
            }

            const mediaDir = path.join(process.cwd(), './public/repost')
            if(!fs.existsSync(mediaDir)){
                fs.mkdirSync(mediaDir, {recursive: true})
            }

            const mediaPaths = await Promise.all(
                url.map(async (mediaUrl: string, index: number) => {
                    const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' })
            
                    // Determine the file extension based on the media type
                    let mediaExtension: string
                    if (mediaUrl.includes('.mp4')) {
                        mediaExtension = 'mp4' // Video file
                    } else if (mediaUrl.includes('.jpg') || mediaUrl.includes('.jpeg') || mediaUrl.includes('.png')) {
                        mediaExtension = 'jpg' // Image file
                    } else {
                        // Default to jpg for any other type you can customize this logic
                        mediaExtension = 'jpg'
                    }
            
                    // Construct the file path using the determined extension
                    const mediaFilePath = path.join(mediaDir, `media-${index}.${mediaExtension}`)
                    
                    // Write the media data to the file
                    fs.writeFileSync(mediaFilePath, response.data)
                    
                    // Return the path of the saved media file
                    return mediaFilePath
                })
            )

            const captionFilePath = path.join(mediaDir, 'caption.txt')
            fs.writeFileSync(captionFilePath, caption)

            return res.status(200).json({success: true})
        }catch(err: any){
            console.log(err)
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default handler