import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ['sharp'],
  turbopack: {
    root: __dirname,
  },
  poweredByHeader: false,
};

export default nextConfig;
