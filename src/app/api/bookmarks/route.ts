import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBookmarks, createBookmark, deleteBookmark } from "@/lib/store";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  const bookmarks = getBookmarks(user.id, courseId);
  return NextResponse.json({ bookmarks });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { courseId, lessonId, timestamp, label, bookmarkId, action } = await req.json();

  if (action === "delete" && bookmarkId) {
    deleteBookmark(bookmarkId);
    return NextResponse.json({ success: true });
  }

  if (!courseId || !lessonId) {
    return NextResponse.json({ error: "courseId, lessonId required" }, { status: 400 });
  }

  const bookmark = createBookmark({
    userId: user.id,
    courseId,
    lessonId,
    timestamp: timestamp ?? null,
    label: label || "Bookmark",
  });
  return NextResponse.json({ bookmark });
}
