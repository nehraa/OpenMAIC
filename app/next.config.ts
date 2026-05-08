import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    resolveAlias: {
      '@': './app/app',
    },
  },
};

export default nextConfig;