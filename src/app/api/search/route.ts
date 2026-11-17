import { NextRequest, NextResponse } from "next/server";
import { searchCourses } from "@/lib/store";
import { getAverageRating } from "@/lib/store";
import { getInstructor } from "@/lib/store";
import { checkRateLimit, RATE_LIMITS, getClientIP } from "@/lib/rateLimit";

// GET /api/search?q=xxx&category=xxx&level=xxx&maxPrice=xxx&freeOnly=1
export async function GET(req: NextRequest) {
  // Rate limit: 30 searches per minute per IP
  const ip = getClientIP(req);
  const rl = checkRateLimit(`search:${ip}`, RATE_LIMITS.search);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many search requests. Slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || undefined;
  const level = searchParams.get("level") || undefined;
  const maxPriceStr = searchParams.get("maxPrice");
  const freeOnly = searchParams.get("freeOnly") === "1";
  const maxPrice = maxPriceStr ? parseInt(maxPriceStr) : undefined;

  // Sanitize search query — limit length, strip control chars
  const cleanQ = q.slice(0, 200).replace(/[\x00-\x1F\x7F]/g, "").trim();

  const results = searchCourses(cleanQ, { category, level, maxPrice, freeOnly });

  const enriched = results.map((c) => ({
    ...c,
    rating: getAverageRating(c.id),
    instructor: getInstructor(c.instructorId)?.name || "Unknown",
  }));

  return NextResponse.json({ results: enriched, count: enriched.length });
}
