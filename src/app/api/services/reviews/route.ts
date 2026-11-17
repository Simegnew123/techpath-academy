import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getServiceReviews, createServiceReview } from "@/lib/store";

// GET /api/services/reviews?serviceId=xxx — list reviews for a service
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  if (!serviceId) return NextResponse.json({ error: "serviceId required" }, { status: 400 });
  return NextResponse.json({ reviews: getServiceReviews(serviceId) });
}

// POST /api/services/reviews — submit a review
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.serviceId || !body.rating) {
    return NextResponse.json({ error: "serviceId and rating required" }, { status: 400 });
  }

  const review = createServiceReview({
    serviceId: body.serviceId,
    userId: user.id,
    rating: Math.min(5, Math.max(1, body.rating)),
    comment: body.comment || "",
  });
  return NextResponse.json({ review }, { status: 201 });
}
