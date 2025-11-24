import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Вся админка будет считаться находящейся под /admin
  basePath: '/admin',
  assetPrefix: '/admin',

  // Опционально: если используешь SSR и внешние хосты:
  // experimental: { outputStandalone: true },
};

export default nextConfig;
