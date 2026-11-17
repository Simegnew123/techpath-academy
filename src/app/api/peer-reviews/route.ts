import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPendingPeerReviews, createPeerReview, getPeerReviewsForSubmission } from "@/lib/store";

// GET /api/peer-reviews — get pending submissions for peer review
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get("submissionId");

  if (submissionId) {
    const reviews = getPeerReviewsForSubmission(submissionId);
    return NextResponse.json({ reviews });
  }

  const pending = getPendingPeerReviews(user.id);
  return NextResponse.json({ pending, count: pending.length });
}

// POST /api/peer-reviews — submit a peer review
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { submissionId, rubricScores, overallComment, rating } = body;

  if (!submissionId || !rubricScores || rating === undefined) {
    return NextResponse.json({ error: "submissionId, rubricScores, and rating required" }, { status: 400 });
  }

  const review = createPeerReview({
    submissionId,
    reviewerId: user.id,
    rubricScores,
    overallComment: overallComment || "",
    rating,
    isAnonymous: body.isAnonymous ?? true,
  });

  return NextResponse.json({ review }, { status: 201 });
}
