import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com' },
    ],
  },
  // turbopack: {
  //   root: path.resolve(__dirname),
  // },
};

export default nextConfig;
