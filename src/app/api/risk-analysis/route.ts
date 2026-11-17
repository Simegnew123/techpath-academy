import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRiskFlags, getAllRiskFlags, runRiskAnalysis, resolveRiskFlag, getAllUsers } from "@/lib/store";
import { getCourses } from "@/lib/courses";

// GET /api/risk-analysis — list at-risk students (admin/instructor only)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const includeResolved = searchParams.get("includeResolved") === "true";
  const courseId = searchParams.get("courseId") || undefined;

  const flags = includeResolved ? getAllRiskFlags(courseId) : getRiskFlags(courseId);

  // Enrich with user names and course titles
  const users = getAllUsers();
  const courses = getCourses();
  const enriched = flags.map((f) => ({
    ...f,
    userName: users.find((u) => u.id === f.userId)?.name || "Unknown",
    courseTitle: courses.find((c) => c.id === f.courseId)?.title || "Unknown Course",
  }));

  return NextResponse.json({ flags: enriched, count: enriched.length });
}

// POST /api/risk-analysis — run risk analysis scan
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const newFlags = runRiskAnalysis();
  return NextResponse.json({ newFlags, message: `${newFlags} new risk flag(s) detected` });
}

// PATCH /api/risk-analysis — resolve a risk flag
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const { flagId, note } = body;
  if (!flagId) return NextResponse.json({ error: "flagId required" }, { status: 400 });

  resolveRiskFlag(flagId, note || "Resolved");
  return NextResponse.json({ success: true });
}
