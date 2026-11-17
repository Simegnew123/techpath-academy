import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCourseVersions, createCourseVersion, checkStaleCourses } from "@/lib/store";

// GET /api/course-versions?courseId=xxx — list versions, or stale courses
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const stale = searchParams.get("stale") === "true";

  if (stale) {
    const staleCourses = checkStaleCourses();
    return NextResponse.json({ staleCourses, count: staleCourses.length });
  }

  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  const versions = getCourseVersions(courseId);
  return NextResponse.json({ versions });
}

// POST /api/course-versions — create a new version snapshot
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const { courseId, notes } = body;
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const version = createCourseVersion(courseId, user.id, notes || "");
  return NextResponse.json({ version }, { status: 201 });
}
