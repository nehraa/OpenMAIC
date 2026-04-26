import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/student',
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
