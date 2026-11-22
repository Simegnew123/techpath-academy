// manifest.ts — PWA manifest for mobile/desktop install ("Add to Home Screen")
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TechPath Academy — Lab-Based IT Training",
    short_name: "TechPath",
    description:
      "Master real-world IT skills through hands-on, lab-based training. Courses in IT Support, Networking, Cyber Security, Database Administration, and AI.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#0f172a",
    theme_color: "#4f46e5",
    categories: ["education", "technology", "business"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    shortcuts: [
      {
        name: "Browse Courses",
        short_name: "Courses",
        description: "View all available courses",
        url: "/courses",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Book Library",
        short_name: "Library",
        description: "Browse the book catalog",
        url: "/books",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Your learning dashboard",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
