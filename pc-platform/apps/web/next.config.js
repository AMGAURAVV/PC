/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Enable React strict mode for better development-time warnings
   */
  reactStrictMode: true,

  /**
   * Transpile workspace packages so Next.js can process their TypeScript
   */
  transpilePackages: [
    '@pc-platform/ui',
    '@pc-platform/types',
    '@pc-platform/validation',
    '@pc-platform/api-client',
    '@pc-platform/config',
  ],

  /**
   * Image optimization configuration
   */
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pcplatform.in',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@pc-platform/ui'],
  },

  /**
   * Environment variables exposed to the browser
   * (prefix with NEXT_PUBLIC_)
   */
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? 'PC Platform',
  },
  async rewrites() {
    return [
      {
        source: '/pc-builder',
        destination: '/builder',
      },
      {
        source: '/builds',
        destination: '/community',
      },
      {
        source: '/blog',
        destination: '/blogs',
      },
      {
        source: '/blog/:slug',
        destination: '/blogs/:slug',
      },
    ];
  },
};

module.exports = nextConfig;
