import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getQuestionDifficultyStats } from "@/lib/store";

// GET /api/question-stats?courseId=xxx — question difficulty heatmap
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId") || undefined;

  const stats = getQuestionDifficultyStats(courseId);
  return NextResponse.json({
    totalQuestions: stats.length,
    highFailRate: stats.filter((s) => s.failRate >= 70),
    mediumFailRate: stats.filter((s) => s.failRate >= 40 && s.failRate < 70),
    lowFailRate: stats.filter((s) => s.failRate < 40),
    all: stats,
  });
}
