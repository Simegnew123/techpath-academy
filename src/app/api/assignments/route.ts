import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAssignments, createAssignment, deleteAssignment } from "@/lib/store";

// GET /api/assignments?courseId=xxx
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  const assignments = getAssignments(courseId);
  return NextResponse.json({ assignments });
}

// POST /api/assignments — create or delete (instructor/admin only)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "instructor" && user.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const { action, courseId, lessonId, title, description, instructions, maxPoints, dueDate, allowedFileTypes, maxFileSizeMB, assignmentId } = body;

  if (action === "delete" && assignmentId) {
    deleteAssignment(assignmentId);
    return NextResponse.json({ success: true });
  }

  if (!courseId || !title) {
    return NextResponse.json({ error: "courseId, title required" }, { status: 400 });
  }

  const assignment = createAssignment({
    courseId,
    lessonId: lessonId || null,
    title,
    description: description || "",
    instructions: instructions || "",
    maxPoints: maxPoints || 100,
    dueDate: dueDate || null,
    allowedFileTypes: allowedFileTypes || ["pdf", "doc", "docx", "zip", "txt"],
    maxFileSizeMB: maxFileSizeMB || 10,
  });

  return NextResponse.json({ assignment });
}
