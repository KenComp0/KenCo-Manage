import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jose", "jwks-rsa"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
