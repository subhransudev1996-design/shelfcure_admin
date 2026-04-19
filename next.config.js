/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    basePath: '/admin',
    assetPrefix: '/admin/',
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
