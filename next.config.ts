/**
 * @file next.config.ts
 * @description Next.js 15 build and runtime configuration for OpenLearn.
 * Configures YouTube CDN remote image patterns and transpiles `lucide-react`
 * for optimal SSR & client bundle execution.
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
