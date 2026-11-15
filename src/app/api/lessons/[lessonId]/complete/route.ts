import { NextRequest, NextResponse } from "next/server";
import { getLesson, hasAccess, markLessonCompleted, getLessonsForCourse, getCompletionPercent } from "@/lib/courses";
import { readDB, writeDB, getCourseById } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const body = await req.json().catch(() => null);
  const completed = body?.completed !== false;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const lesson = getLesson(lessonId);
  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const course = getCourseById(lesson.courseId);
  if (!course || !hasAccess(user.id, course)) {
    return NextResponse.json({ error: "No access to this course." }, { status: 403 });
  }

  if (completed) {
    markLessonCompleted(user.id, lessonId);
  } else {
    const db = readDB();
    db.progress = db.progress.filter(
      (p) => !(p.userId === user.id && p.lessonId === lessonId)
    );
    // Also un-complete the enrollment
    const enr = db.enrollments.find(
      (e) => e.userId === user.id && e.courseId === lesson.courseId
    );
    if (enr) {
      enr.completed = false;
      enr.completedAt = null;
    }
    writeDB(db);
  }

  const totalLessons = getLessonsForCourse(lesson.courseId).length;
  const completion = getCompletionPercent(user.id, lesson.courseId);

  return NextResponse.json({
    ok: true,
    completed,
    completionPercent: completion,
    totalLessons,
    courseCompleted: completion === 100,
  });
}
