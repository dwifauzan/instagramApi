import { cookiesFacebook } from "@/pages/api/facebook-scrapper/accountFacebook";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
    try{
        const {userFacebookId, ...data} = req.body
        await cookiesFacebook.update(userFacebookId, data)
        return res.status(200).json(`berhasil di update`)
    }catch(error){
        return res.status(500).json(`${error}`)
    }
}