import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This app uses a file-based data store, so we disable "cache components"
     mode and use classic client/server rendering with short revalidation. */
  cacheComponents: false,
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
