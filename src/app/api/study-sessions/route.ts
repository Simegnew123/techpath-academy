import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createStudySession, getStudyStats } from "@/lib/store";

// GET /api/study-sessions — get study stats
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stats = getStudyStats(user.id);
  return NextResponse.json({ stats });
}

// POST /api/study-sessions — log a completed study session
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.courseId || !body.durationMinutes) {
    return NextResponse.json({ error: "courseId and durationMinutes required" }, { status: 400 });
  }

  const session = createStudySession({
    userId: user.id,
    courseId: body.courseId,
    lessonId: body.lessonId || null,
    durationMinutes: body.durationMinutes,
    sessionType: body.sessionType || "pomodoro",
    completed: body.completed ?? true,
  });

  return NextResponse.json({ session }, { status: 201 });
}
