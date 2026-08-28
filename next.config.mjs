/** @type {import('next').NextConfig} */
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const nextConfig = {
  reactStrictMode: true,
  // Demo 静态导出模式 vs 生产 Docker standalone 模式
  output: isDemoMode ? 'export' : 'standalone',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Leaflet fixes for server-side build
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

export default nextConfig;
