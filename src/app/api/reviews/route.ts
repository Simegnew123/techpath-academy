import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addReview, hasReviewed, getEnrollment } from "@/lib/courses";
import { getReviewsForCourse, getCourseById, readDB } from "@/lib/store";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const courseId = url.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const reviews = getReviewsForCourse(courseId);
  const db = readDB();
  const enriched = reviews.map((r) => {
    const reviewer = db.users.find((u) => u.id === r.userId);
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      userName: reviewer?.name || "Anonymous",
      userAvatar: reviewer?.avatar || "",
    };
  });

  return NextResponse.json({ reviews: enriched });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const courseId = String(body?.courseId || "");
  const rating = Number(body?.rating) || 0;
  const comment = String(body?.comment || "").trim();

  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  if (rating < 1 || rating > 5) return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });

  const course = getCourseById(courseId);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const enr = getEnrollment(user.id, courseId);
  if (!enr && course.price > 0)
    return NextResponse.json({ error: "You must be enrolled to review this course." }, { status: 403 });

  if (hasReviewed(user.id, courseId))
    return NextResponse.json({ error: "You have already reviewed this course." }, { status: 409 });

  const review = addReview({ courseId, userId: user.id, rating, comment });
  return NextResponse.json({ review: { id: review.id, rating: review.rating } });
}
