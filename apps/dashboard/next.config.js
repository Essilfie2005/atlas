/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' is for Docker/self-hosting only — Vercel handles its own output
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
  transpilePackages: ['@atlas/core'],
  experimental: {
    typedRoutes: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  },
};

module.exports = nextConfig;
