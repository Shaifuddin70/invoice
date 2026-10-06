import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite loads its WASM/data files relative to its own module path, so it must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite", "@react-pdf/renderer"],
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
