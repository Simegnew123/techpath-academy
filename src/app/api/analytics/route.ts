import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCourseAnalytics } from "@/lib/store";

// GET /api/analytics?courseId=xxx
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "instructor" && user.role !== "admin" && user.role !== "teaching_assistant") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const analytics = getCourseAnalytics(courseId);
  return NextResponse.json({ analytics });
}
