/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: '/hexadash-nextjs',
    async redirects() {
        return [
            {
                source: '/',
                destination: '/hexadash-nextjs',
                basePath: false,
                permanent: false,
            },
        ];
    },
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'https',
                hostname: 'instagram.fcgk6-3.fna.fbcdn.net', // Tambahkan hostname ini
            },
            {
                protocol: 'https',
                hostname: 'instagram.fcgk6-2.fna.fbcdn.net', // Tambahkan hostname ini
            },
        ],
    },
    api: {
        bodyParser: {
            sizeLimit: '25mb', // Adjust this limit as needed
        },
    },
}

module.exports = nextConfig;
