import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp'],
  turbopack: {
    root: __dirname,
  },
  poweredByHeader: false,
};

export default nextConfig;
