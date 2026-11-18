// manifest.ts — PWA manifest for mobile install / "Add to Home Screen"
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TechPath Academy — Lab-Based IT Training",
    short_name: "TechPath",
    description:
      "Master real-world IT skills through hands-on, lab-based training. Courses in IT Support, Networking, Cyber Security, Database Administration, and AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    categories: ["education", "technology"],
  };
}
