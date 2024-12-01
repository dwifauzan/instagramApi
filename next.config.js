/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    basePath: '', // Kosongkan basePath untuk Electron
    distDir: "out",
    assetPrefix: './', // Relative path untuk Electron
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
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'https',
                hostname: 'instagram.fcgk6-3.fna.fbcdn.net',
            },
            {
                protocol: 'https',
                hostname: 'instagram.fcgk6-2.fna.fbcdn.net',
            },
        ],
    },
};

module.exports = nextConfig;