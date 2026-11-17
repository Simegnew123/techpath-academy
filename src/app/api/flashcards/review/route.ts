import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { processSRSReview } from "@/lib/store";

// POST /api/flashcards/review — submit SRS review for a card
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { flashcardId, quality } = body;

  if (!flashcardId || quality === undefined) {
    return NextResponse.json({ error: "flashcardId and quality required" }, { status: 400 });
  }

  processSRSReview(user.id, flashcardId, quality as 0 | 1 | 2 | 3 | 4 | 5);
  return NextResponse.json({ success: true });
}
