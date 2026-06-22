import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output produces a minimal .next/standalone directory
  // perfect for clean server deploys (no full node_modules bloat).
  output: 'standalone',

  // Good defaults for a production SaaS
  poweredByHeader: false,
  reactStrictMode: true,

  // If you add images from remote sources later, configure here
  // images: { remotePatterns: [...] },
};

export default nextConfig;
