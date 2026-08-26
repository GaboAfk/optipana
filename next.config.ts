import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.html": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
