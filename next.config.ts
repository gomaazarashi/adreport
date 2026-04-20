import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: false,
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
