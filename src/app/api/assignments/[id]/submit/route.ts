import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAssignmentById, createSubmission, getSubmissionsByUser } from "@/lib/store";

// POST /api/assignments/[id]/submit — student submits assignment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const assignment = getAssignmentById(id);
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const body = await req.json();
  const { fileName, fileData, fileType, notes } = body;

  if (!fileName || !fileData) {
    return NextResponse.json({ error: "fileName and fileData required" }, { status: 400 });
  }

  // Validate file type
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (assignment.allowedFileTypes.length > 0 && ext && !assignment.allowedFileTypes.includes(ext)) {
    return NextResponse.json({ error: `File type .${ext} not allowed. Allowed: ${assignment.allowedFileTypes.join(", ")}` }, { status: 400 });
  }

  // Validate file size (fileData is base64, so size ≈ base64 length * 0.75)
  const sizeMB = (fileData.length * 0.75) / (1024 * 1024);
  if (sizeMB > assignment.maxFileSizeMB) {
    return NextResponse.json({ error: `File too large. Max ${assignment.maxFileSizeMB}MB` }, { status: 400 });
  }

  const submission = createSubmission({
    assignmentId: id,
    userId: user.id,
    fileName,
    fileData,
    fileType: fileType || ext || "",
    notes: notes || "",
  });

  return NextResponse.json({ submission });
}

// GET /api/assignments/[id]/submit — get user's submissions for this assignment
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const submissions = getSubmissionsByUser(user.id).filter((s) => s.assignmentId === id);
  return NextResponse.json({ submissions });
}
