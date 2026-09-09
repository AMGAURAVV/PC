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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pcplatform.in',
      },
    ],
  },

  /**
   * Environment variables exposed to the browser
   * (prefix with NEXT_PUBLIC_)
   */
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? 'PC Platform',
  },
};

module.exports = nextConfig;
