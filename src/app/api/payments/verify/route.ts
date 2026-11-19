import { NextRequest, NextResponse } from "next/server";
import { getCourseById, enroll, formatPrice } from "@/lib/courses";
import { readDB, mutate, createNotification, notifyAdmins } from "@/lib/store";
import {
  verifyFlutterwavePayment,
  capturePayPalPayment,
} from "@/lib/payments";

/**
 * GET /api/payments/verify
 *
 * Called by payment providers after the user completes payment:
 * - Flutterwave: ?tx_ref=xxx&status=successful&transaction_id=123
 * - PayPal:      ?tx_ref=xxx&provider=paypal&token=ORDER_ID
 *
 * CRITICAL: We verify server-side with the provider's API before
 * marking the payment as paid. Never trust redirect URL params alone.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const txRef = params.get("tx_ref") || "";
  const provider = params.get("provider") || "flutterwave";
  const status = params.get("status") || "successful";
  const transactionId = params.get("transaction_id") || "";
  const paypalOrderId = params.get("token") || ""; // PayPal sends order ID as "token"

  const db = readDB();
  const payment = db.payments.find((p) => p.ref === txRef);

  if (!payment) {
    return NextResponse.redirect(new URL("/dashboard?purchase=failed&reason=no_payment", req.url));
  }

  // Already processed?
  if (payment.status === "paid") {
    const course = getCourseById(payment.courseId);
    return NextResponse.redirect(
      new URL(`/dashboard?purchased=1&course=${course?.slug || ""}`, req.url)
    );
  }

  const course = getCourseById(payment.courseId);
  const currency = process.env.CURRENCY || "KES";

  // ── PayPal verification ──
  if (provider === "paypal" && paypalOrderId) {
    const result = await capturePayPalPayment(paypalOrderId);

    if (result.success) {
      mutate((d) => {
        const p = d.payments.find((x) => x.ref === txRef);
        if (p) {
          p.status = "paid";
          p.ref = result.ref || txRef; // update with PayPal capture ID
        }
      });
      enroll(payment.userId, payment.courseId, txRef);
      sendPaymentNotifications(payment.userId, course, "PayPal", txRef);
      return NextResponse.redirect(
        new URL(`/dashboard?purchased=1&course=${course?.slug || ""}`, req.url)
      );
    }

    mutate((d) => {
      const p = d.payments.find((x) => x.ref === txRef);
      if (p) p.status = "failed";
    });
    return NextResponse.redirect(
      new URL(`/dashboard?purchase=failed&reason=${encodeURIComponent(result.error || "paypal_failed")}`, req.url)
    );
  }

  // ── Flutterwave verification ──
  if (status === "successful" && transactionId) {
    const result = await verifyFlutterwavePayment(
      transactionId,
      payment.amount,
      currency
    );

    if (result.success) {
      mutate((d) => {
        const p = d.payments.find((x) => x.ref === txRef);
        if (p) p.status = "paid";
      });
      enroll(payment.userId, payment.courseId, txRef);
      const methodName = payment.method === "mpesa" ? "M-Pesa" : "Card";
      sendPaymentNotifications(payment.userId, course, methodName, txRef);
      return NextResponse.redirect(
        new URL(`/dashboard?purchased=1&course=${course?.slug || ""}`, req.url)
      );
    }

    mutate((d) => {
      const p = d.payments.find((x) => x.ref === txRef);
      if (p) p.status = "failed";
    });
    return NextResponse.redirect(
      new URL(`/dashboard?purchase=failed&reason=${encodeURIComponent(result.error || "verification_failed")}`, req.url)
    );
  }

  // ── Cancelled or failed ──
  mutate((d) => {
    const p = d.payments.find((x) => x.ref === txRef);
    if (p) p.status = "failed";
  });
  return NextResponse.redirect(new URL("/dashboard?purchase=failed&reason=cancelled", req.url));
}

// ── Helper: send enrollment + payment notifications ──
function sendPaymentNotifications(
  userId: string,
  course: ReturnType<typeof getCourseById>,
  methodName: string,
  ref: string
) {
  if (!course) return;

  createNotification({
    userId,
    type: "enrollment",
    title: `🎓 Enrolled in ${course.title}!`,
    message: `Welcome to the course! Start learning now — your progress is saved automatically.`,
    link: `/courses/${course.slug}/chapters`,
  });
  createNotification({
    userId,
    type: "payment",
    title: `💳 Payment confirmed`,
    message: `${formatPrice(course.price)} via ${methodName} — Ref: ${ref}`,
    link: `/dashboard`,
  });
  notifyAdmins(
    "New enrollment",
    `A student enrolled in "${course.title}" (${formatPrice(course.price)} via ${methodName})`,
    `/admin`
  );
}
