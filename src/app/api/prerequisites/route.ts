import { NextRequest, NextResponse } from "next/server";
import { readDB, mutate, uid, nowISO } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

// GET /api/prerequisites?courseId=xxx — check if user can enroll (prerequisites met)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required." }, { status: 400 });

  const db = readDB();
  const course = db.courses.find((c) => c.id === courseId);
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });

  const prereqIds = course.prerequisiteCourseIds || [];
  if (prereqIds.length === 0) {
    return NextResponse.json({ met: true, prerequisites: [], missing: [] });
  }

  // Get prerequisite course details
  const prereqs = prereqIds
    .map((id) => db.courses.find((c) => c.id === id))
    .filter(Boolean)
    .map((c) => ({ id: c!.id, title: c!.title, level: c!.level }));

  // Check if user has completed the prerequisites
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({
      met: false,
      prerequisites: prereqs,
      missing: prereqs,
      message: "You must be logged in and complete the prerequisite courses.",
    });
  }

  const missing: typeof prereqs = [];
  for (const p of prereqs) {
    const enrollment = db.enrollments.find(
      (e) => e.userId === user.id && e.courseId === p.id && e.completed
    );
    if (!enrollment) {
      missing.push(p);
    }
  }

  return NextResponse.json({
    met: missing.length === 0,
    prerequisites: prereqs,
    missing,
    message: missing.length === 0
      ? "All prerequisites met!"
      : `Complete ${missing.length} prerequisite course${missing.length > 1 ? "s" : ""} first.`,
  });
}

// POST /api/prerequisites — admin: set prerequisites for a course
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    return NextResponse.json({ error: "Admin or instructor access required." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { courseId, prerequisiteCourseIds } = body;
  if (!courseId) return NextResponse.json({ error: "courseId required." }, { status: 400 });

  mutate((db) => {
    const course = db.courses.find((c) => c.id === courseId);
    if (course) {
      course.prerequisiteCourseIds = Array.isArray(prerequisiteCourseIds) ? prerequisiteCourseIds : [];
    }
  });

  return NextResponse.json({ success: true, message: "Prerequisites updated." });
}
