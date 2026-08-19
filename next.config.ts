import type { NextConfig } from 'next';
import { nextSecurityHeaderSources } from './lib/security-headers';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],
  outputFileTracingIncludes: {
    '*': ['./public/client-packs/**/*'],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async headers() {
    return [
      ...nextSecurityHeaderSources(),
      {
        source: '/logos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
