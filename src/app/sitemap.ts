// sitemap.ts — Next.js auto-generates /sitemap.xml from this file
import type { MetadataRoute } from "next";
import { getCourses } from "@/lib/courses";
import { CATEGORIES } from "@/lib/categories";

const BASE_URL = "https://techpath-academy.onrender.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ── Static pages ──
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/courses`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/books`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/teams`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/jobs`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/hall-of-fame`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${BASE_URL}/forgot-password`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // ── Category pages ──
  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${BASE_URL}/courses?category=${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── Dynamic course pages ──
  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const courses = getCourses().filter((c) => c.published);
    coursePages = courses.map((c) => ({
      url: `${BASE_URL}/courses/${c.slug}`,
      lastModified: new Date(c.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB not available at build time — skip dynamic courses
  }

  return [...staticPages, ...categoryPages, ...coursePages];
}
