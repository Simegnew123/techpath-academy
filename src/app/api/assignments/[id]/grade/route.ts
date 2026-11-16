import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { gradeSubmission, getSubmissions, createNotification } from "@/lib/store";

// POST /api/assignments/[id]/grade — instructor grades a submission
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "instructor" && user.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const { submissionId, grade, feedback } = await req.json();

  if (!submissionId || grade === undefined) {
    return NextResponse.json({ error: "submissionId and grade required" }, { status: 400 });
  }

  gradeSubmission(submissionId, grade, feedback || "", user.id);

  // Notify the student
  const submissions = getSubmissions(id);
  const sub = submissions.find((s) => s.id === submissionId);
  if (sub) {
    createNotification({
      userId: sub.userId,
      type: "admin",
      title: "Assignment Graded 📋",
      message: `Your submission received ${grade} points. ${feedback ? "Feedback: " + feedback : ""}`,
      link: "/dashboard",
    });
  }

  return NextResponse.json({ success: true });
}

// GET /api/assignments/[id]/grade — get all submissions for grading queue
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "instructor" && user.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const { id } = await params;
  const submissions = getSubmissions(id);
  return NextResponse.json({ submissions });
}
