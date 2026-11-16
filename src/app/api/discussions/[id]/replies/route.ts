import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createReply, getReplies, getDiscussionById, toggleReplyUpvote, toggleVerifiedAnswer, readDB } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const replies = getReplies(id);
  return NextResponse.json({ replies });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const discussion = getDiscussionById(id);
  if (!discussion) return NextResponse.json({ error: "Discussion not found" }, { status: 404 });

  const body = await req.json();
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const reply = createReply({
    discussionId: id,
    userId: user.id,
    content: body.content.trim(),
  });

  return NextResponse.json({ reply }, { status: 201 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, replyId } = body;

  if (action === "upvote") {
    toggleReplyUpvote(replyId, user.id);
    return NextResponse.json({ success: true });
  }

  if (action === "verify") {
    if (user.role !== "instructor" && user.role !== "admin" && user.role !== "teaching_assistant") {
      return NextResponse.json({ error: "Only instructors can verify answers" }, { status: 403 });
    }
    toggleVerifiedAnswer(replyId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
