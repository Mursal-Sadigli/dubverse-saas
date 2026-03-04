import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["fluent-ffmpeg"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: (process.env.BACKEND_API_URL || "http://localhost:4000") + "/api/:path*",
      },
    ];
  },
};

export default nextConfig;

