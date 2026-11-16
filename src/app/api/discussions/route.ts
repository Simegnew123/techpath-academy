import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDiscussions, createDiscussion, toggleDiscussionUpvote, togglePinDiscussion, getReplies, createReply, toggleReplyUpvote, toggleVerifiedAnswer, getDiscussionById } from "@/lib/store";
import { getCourseById } from "@/lib/courses";

// GET /api/discussions?courseId=xxx&lessonId=xxx
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");

  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const discussions = getDiscussions(courseId, lessonId || null);
  const result = discussions.map((d) => {
    const author = getDiscussionById(d.id);
    return {
      ...d,
      replyCount: getReplies(d.id).length,
      userUpvoted: d.upvotes.includes(user.id),
    };
  });

  return NextResponse.json({ discussions: result });
}

// POST /api/discussions — create discussion or reply, or toggle upvote/pin/verify
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, courseId, lessonId, title, content, discussionId, replyContent, replyId } = body;

  // Create new discussion thread
  if (!action || action === "create") {
    if (!courseId || !title || !content) {
      return NextResponse.json({ error: "courseId, title, content required" }, { status: 400 });
    }
    const disc = createDiscussion({
      courseId,
      lessonId: lessonId || null,
      userId: user.id,
      title,
      content,
    });
    return NextResponse.json({ discussion: disc });
  }

  // Create reply
  if (action === "reply" && discussionId && replyContent) {
    const reply = createReply({
      discussionId,
      userId: user.id,
      content: replyContent,
    });
    return NextResponse.json({ reply });
  }

  // Upvote discussion
  if (action === "upvote" && discussionId) {
    toggleDiscussionUpvote(discussionId, user.id);
    return NextResponse.json({ success: true });
  }

  // Pin/unpin discussion (instructor/admin only)
  if (action === "pin" && discussionId) {
    if (user.role !== "instructor" && user.role !== "admin" && user.role !== "teaching_assistant") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    togglePinDiscussion(discussionId);
    return NextResponse.json({ success: true });
  }

  // Upvote reply
  if (action === "upvote_reply" && replyId) {
    toggleReplyUpvote(replyId, user.id);
    return NextResponse.json({ success: true });
  }

  // Mark/unmark verified answer (instructor/admin only)
  if (action === "verify" && replyId) {
    if (user.role !== "instructor" && user.role !== "admin" && user.role !== "teaching_assistant") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    toggleVerifiedAnswer(replyId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// GET replies for a discussion
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { discussionId } = await req.json();
  if (!discussionId) return NextResponse.json({ error: "discussionId required" }, { status: 400 });
  const replies = getReplies(discussionId).map((r) => ({
    ...r,
    userUpvoted: r.upvotes.includes(user.id),
  }));
  return NextResponse.json({ replies });
}
