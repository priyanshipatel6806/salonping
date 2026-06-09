import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/block-out',
        destination: '/blocked',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
