import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath ? basePath : undefined,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uat.hodleague.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "back.hodleague.com",
        pathname: "/**",
      },
    ],
  },
  trailingSlash: true,
};

export default nextConfig;
