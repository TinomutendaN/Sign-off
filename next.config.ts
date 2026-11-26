import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Stop `next dev` from writing its own block into our AGENTS.md.
  agentRules: false,
  // The nightly demo reset reads the sample files' real sizes.
  outputFileTracingIncludes: { "/api/cron/reset-demo": ["./public/demo-files/**"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
