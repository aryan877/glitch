/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['cloud.appwrite.io'],
  },
  experimental: {
    scrollRestoration: true,
  },
}


module.exports = nextConfig
