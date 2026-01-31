import "./src/env";
import type { NextConfig } from "next";

const nextConfig = {
  output: "standalone",
  transpilePackages: ["@workspace/ui"],
} satisfies NextConfig;

export default nextConfig;
