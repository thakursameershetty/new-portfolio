import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: let the dev server answer through an ngrok tunnel (testing on other devices).
  allowedDevOrigins: ["*.ngrok-free.dev"],
  // The Figma practice page became the playground; old links still find it.
  async redirects() {
    return [
      { source: "/practice", destination: "/playground", permanent: true },
    ];
  },
  turbopack: {
    // Pin the project root: without it, Next.js finds the stray package-lock.json in the home
    // folder while looking for the root, and warns.
    root: path.join(__dirname),
  },
};

export default nextConfig;
