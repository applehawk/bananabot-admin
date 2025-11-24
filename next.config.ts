import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // basePath для работы admin панели под /admin
  basePath: '/admin',
  assetPrefix: '/admin',
};

export default nextConfig;
