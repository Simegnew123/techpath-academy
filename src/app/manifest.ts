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
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "64x64",
        type: "image/svg+xml",
      },
    ],
    categories: ["education", "technology"],
  };
}
