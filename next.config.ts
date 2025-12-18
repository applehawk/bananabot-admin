import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Standalone output for optimized Docker builds (reduces image size by ~75%)
  output: 'standalone',

  // basePath для работы admin панели под /admin
  basePath: '/admin',
  assetPrefix: '/admin',

  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: false,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
