import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the project root: without it, Next.js finds the stray package-lock.json in the home
    // folder while looking for the root, and warns.
    root: path.join(__dirname),
  },
};

export default nextConfig;
