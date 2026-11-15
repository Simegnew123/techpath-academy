import { NextRequest, NextResponse } from "next/server";
import { getCourseById, enroll } from "@/lib/courses";
import { readDB, mutate } from "@/lib/store";

// Called by Flutterwave after payment (redirect)
export async function GET(req: NextRequest) {
  const txRef = req.nextUrl.searchParams.get("tx_ref") || "";
  const status = req.nextUrl.searchParams.get("status") || "successful";
  const transactionId = req.nextUrl.searchParams.get("transaction_id") || "";

  const db = readDB();
  const payment = db.payments.find((p) => p.ref === txRef);

  if (!payment) {
    return NextResponse.redirect(new URL("/dashboard?purchase=failed", req.url));
  }

  if (status === "successful" && transactionId) {
    // Optionally verify with Flutterwave API here (recommended in production)
    mutate((d) => {
      const p = d.payments.find((x) => x.ref === txRef);
      if (p) p.status = "paid";
    });
    const course = getCourseById(payment.courseId);
    enroll(payment.userId, payment.courseId, txRef);
    return NextResponse.redirect(
      new URL(`/dashboard?purchased=1&course=${course?.slug || ""}`, req.url)
    );
  }

  mutate((d) => {
    const p = d.payments.find((x) => x.ref === txRef);
    if (p) p.status = "failed";
  });
  return NextResponse.redirect(new URL("/dashboard?purchase=failed", req.url));
}
