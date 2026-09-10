/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
  reactStrictMode: true,
  transpilePackages: [
    '@pc-platform/ui',
    '@pc-platform/types',
    '@pc-platform/validation',
    '@pc-platform/api-client',
    '@pc-platform/config',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
