import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getPlacementResult,
  createPlacementResult,
  applyPlacementTestOut,
  getModulesForCourse,
  getLessonsForModule,
} from "@/lib/store";
import { getCourseById } from "@/lib/courses";

// GET /api/placement?courseId=xxx — get existing placement result
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const result = getPlacementResult(user.id, courseId);
  return NextResponse.json({ result });
}

// POST /api/placement — save placement result and auto-test-out lessons
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { courseId, quizId, score } = body;

  if (!courseId || score === undefined) {
    return NextResponse.json({ error: "courseId and score required" }, { status: 400 });
  }

  const course = getCourseById(courseId);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // Determine which lessons to test out based on score
  const modules = getModulesForCourse(courseId);
  const allLessons = modules.flatMap((m) => getLessonsForModule(m.id));

  let testedOutLessons: string[] = [];
  let recommendedLessons: string[] = [];

  if (score >= 80) {
    // Test out of first 60% of lessons
    const cutoff = Math.floor(allLessons.length * 0.6);
    testedOutLessons = allLessons.slice(0, cutoff).map((l) => l.id);
    recommendedLessons = allLessons.slice(cutoff).map((l) => l.id);
  } else if (score >= 50) {
    // Test out of first 30% of lessons
    const cutoff = Math.floor(allLessons.length * 0.3);
    testedOutLessons = allLessons.slice(0, cutoff).map((l) => l.id);
    recommendedLessons = allLessons.slice(cutoff).map((l) => l.id);
  } else {
    // No test out — need all lessons
    recommendedLessons = allLessons.map((l) => l.id);
  }

  const result = createPlacementResult({
    userId: user.id,
    courseId,
    quizId: quizId || "",
    score,
    testedOutLessons,
    recommendedLessons,
  });

  // Auto-mark tested out lessons as completed
  if (testedOutLessons.length > 0) {
    applyPlacementTestOut(user.id, courseId, testedOutLessons);
  }

  return NextResponse.json({ result });
}
