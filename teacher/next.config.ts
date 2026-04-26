import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/teacher',
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
