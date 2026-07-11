import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Pin the workspace root to this project. Without it, Next infers the root
  // from the nearest ancestor lockfile, which is wrong when this checkout is
  // nested under another repo (e.g. a git worktree) that also has one.
  turbopack: {
    root: __dirname,
  },
  // Allow HMR/dev requests when testing from other devices on the LAN
  // (e.g. a phone hitting http://192.168.18.210:3000). The subnet wildcard
  // keeps working even if the machine's DHCP-assigned IP changes.
  allowedDevOrigins: ["192.168.18.210", "192.168.18.*"],
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
