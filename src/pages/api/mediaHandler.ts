import type { NextApiRequest, NextApiResponse } from "next";
import fs from 'fs';
import path from "path";

const mediaHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    const mediaDir = path.join(process.cwd(), 'public/repost'); // Pastikan path ini benar

    try {
        // Membaca semua file di direktori media
        const files = fs.readdirSync(mediaDir); // Mengambil daftar file dalam direktori

        // Memproses daftar file untuk mendapatkan path media yang bisa diakses
        const mediaFiles = files
            .map(file => {
                if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.mp4')) {
                    return `/repost/${file}`; // Path yang bisa diakses dari public
                }
                return null;
            })
            .filter((file): file is string => file !== null); // Menggunakan type guard untuk filter null

        // Mengembalikan hasil mediaFiles dalam response
        res.status(200).json({ success: true, mediaFiles });
    } catch (err) {
        console.error(err); // Menampilkan error di console untuk debugging
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export default mediaHandler;
