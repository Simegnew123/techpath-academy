import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getNotes, getNotesForLesson, createNote, updateNote, deleteNote, buildStudyGuide } from "@/lib/store";

// GET /api/notes?courseId=xxx&lessonId=xxx&studyGuide=1
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");
  const studyGuide = searchParams.get("studyGuide");

  if (studyGuide && courseId) {
    const guide = buildStudyGuide(user.id, courseId);
    return NextResponse.json({ guide });
  }

  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  const notes = lessonId ? getNotesForLesson(user.id, lessonId) : getNotes(user.id, courseId);
  return NextResponse.json({ notes });
}

// POST /api/notes — create/update/delete a note
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId, lessonId, timestamp, content, noteId, action } = await req.json();

  if (action === "update" && noteId) {
    updateNote(noteId, content);
    return NextResponse.json({ success: true });
  }
  if (action === "delete" && noteId) {
    deleteNote(noteId);
    return NextResponse.json({ success: true });
  }
  if (!courseId || !lessonId || !content) {
    return NextResponse.json({ error: "courseId, lessonId, content required" }, { status: 400 });
  }

  const note = createNote({ userId: user.id, courseId, lessonId, timestamp: timestamp ?? null, content });
  return NextResponse.json({ note });
}
