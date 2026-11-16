import { NextRequest, NextResponse } from "next/server";
import { searchCourses } from "@/lib/store";
import { getAverageRating } from "@/lib/store";
import { getInstructor } from "@/lib/store";

// GET /api/search?q=xxx&category=xxx&level=xxx&maxPrice=xxx&freeOnly=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || undefined;
  const level = searchParams.get("level") || undefined;
  const maxPriceStr = searchParams.get("maxPrice");
  const freeOnly = searchParams.get("freeOnly") === "1";
  const maxPrice = maxPriceStr ? parseInt(maxPriceStr) : undefined;

  const results = searchCourses(q, { category, level, maxPrice, freeOnly });

  const enriched = results.map((c) => ({
    ...c,
    rating: getAverageRating(c.id),
    instructor: getInstructor(c.instructorId)?.name || "Unknown",
  }));

  return NextResponse.json({ results: enriched, count: enriched.length });
}
