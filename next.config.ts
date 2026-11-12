import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      // Route moves per Agent.md §6.5 — config-level so prefetch never
      // renders a throwing page (the `instant` validation trips on
      // NEXT_REDIRECT raised during segment render).
      { source: "/buy", destination: "/create", permanent: false },
      { source: "/sim", destination: "/crash", permanent: false },
      { source: "/positions/:id", destination: "/vault/:id", permanent: false },
    ];
  },
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
