// robots.ts — Next.js auto-generates /robots.txt from this file
import type { MetadataRoute } from "next";

const BASE_URL = "https://techpath-academy.onrender.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/:path*",
          "/api",
          "/api/:path*",
          "/dashboard",
          "/dashboard/:path*",
          "/settings",
          "/checkout",
          "/checkout/:path*",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
