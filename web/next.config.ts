import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Uploaded records can be up to 10 MB.
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;
