import { NextRequest, NextResponse } from "next/server";
import { getCourseById, enroll } from "@/lib/courses";
import { getCurrentUser } from "@/lib/auth";
import { readDB, mutate, uid, nowISO } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const body = await req.json().catch(() => null);
  const method = String(body?.method || "demo");

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const course = getCourseById(courseId);
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  if (course.price <= 0) return NextResponse.json({ error: "This course is free." }, { status: 400 });

  // Already purchased?
  if (readDB().enrollments.some((e) => e.userId === user.id && e.courseId === courseId)) {
    return NextResponse.json({ redirect: `/courses/${course.slug}` });
  }

  const demoMode = (process.env.PAYMENT_MODE || "demo") !== "live";

  if (demoMode) {
    const ref = `demo_${uid()}`;
    mutate((db) => {
      db.payments.push({
        id: uid(),
        userId: user.id,
        courseId,
        amount: course.price,
        method,
        status: "paid",
        ref,
        createdAt: nowISO(),
      });
    });
    enroll(user.id, courseId, ref);
    return NextResponse.json({ redirect: `/dashboard?purchased=1&course=${course.slug}` });
  }

  // ---- LIVE mode: Flutterwave ----
  const secretKey = process.env.FLW_SECRET_KEY;
  const publicKey = process.env.FLW_PUBLIC_KEY;
  if (!secretKey || !publicKey) {
    return NextResponse.json(
      { error: "Payment is not configured yet. Please set FLW keys." },
      { status: 500 }
    );
  }

  const currency = process.env.CURRENCY || "KES";
  const siteUrl = process.env.SITE_URL || "http://localhost:3000";
  const txRef = `tx_${uid()}`;

  mutate((db) => {
    db.payments.push({
      id: uid(),
      userId: user.id,
      courseId,
      amount: course.price,
      method,
      status: "pending",
      ref: txRef,
      createdAt: nowISO(),
    });
  });

  try {
    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: course.price,
        currency,
        redirect_url: `${siteUrl}/api/payments/verify?tx_ref=${txRef}`,
        customer: { email: user.email, name: user.name },
        customizations: {
          title: "TechPath Academy",
          description: course.title,
        },
        payment_options: method === "mpesa" ? "mpesa" : "card",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.data?.link) {
      return NextResponse.json(
        { error: "Could not create payment. Please try again." },
        { status: 502 }
      );
    }
    return NextResponse.json({ redirect_url: data.data.link });
  } catch {
    return NextResponse.json({ error: "Payment service unavailable." }, { status: 502 });
  }
}
