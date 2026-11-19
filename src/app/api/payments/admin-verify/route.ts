import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCourseById, enroll, formatPrice } from "@/lib/courses";
import { readDB, mutate, createNotification, notifyAdmins, uid, nowISO } from "@/lib/store";
import { sendPaymentReceiptEmail } from "@/lib/email";

/**
 * POST /api/payments/admin-verify
 *
 * Admin-only: approve or reject a manual (Telebirr/CBE) payment.
 *
 * Body: { paymentId: string, action: "approve" | "reject" }
 *
 * - approve: marks payment as "paid", enrolls the student, sends notifications
 * - reject:  marks payment as "failed", notifies the student
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const paymentId = String(body?.paymentId || "");
  const action = String(body?.action || "");

  if (!paymentId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request. Provide paymentId and action (approve/reject)." }, { status: 400 });
  }

  const db = readDB();
  const payment = db.payments.find((p) => p.id === paymentId);

  if (!payment) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (payment.status !== "pending") {
    return NextResponse.json({ error: `Payment is already ${payment.status}.` }, { status: 400 });
  }

  const course = getCourseById(payment.courseId);

  if (action === "approve") {
    // Mark as paid
    mutate((d) => {
      const p = d.payments.find((x) => x.id === paymentId);
      if (p) p.status = "paid";
      // Log to audit
      d.auditLogs.push({
        id: uid(),
        userId: user.id,
        userName: user.name,
        action: "VERIFY_PAYMENT",
        entity: "payment",
        entityId: paymentId,
        details: `Approved ${payment.method} payment of ${formatPrice(payment.amount)} for course ${payment.courseId}`,
        ip: "",
        createdAt: nowISO(),
      });
    });

    // Enroll the student
    enroll(payment.userId, payment.courseId, payment.ref);

    // Notify the student
    const methodName = payment.method === "telebirr" ? "Telebirr" : payment.method === "cbe" ? "CBE" : payment.method;
    createNotification({
      userId: payment.userId,
      type: "enrollment",
      title: `🎓 Enrolled in ${course?.title || "course"}!`,
      message: `Your ${methodName} payment has been confirmed. Welcome aboard — start learning now!`,
      link: course ? `/courses/${course.slug}/chapters` : `/dashboard`,
    });
    createNotification({
      userId: payment.userId,
      type: "payment",
      title: `✅ Payment confirmed by admin`,
      message: `${formatPrice(payment.amount)} via ${methodName} — Ref: ${payment.ref}`,
      link: `/dashboard`,
    });
    notifyAdmins(
      "Payment approved",
      `${user.name} approved a ${methodName} payment of ${formatPrice(payment.amount)} for "${course?.title || "course"}"`,
      `/admin/payments`
    );

    // Send payment receipt email to student (non-blocking)
    const student = readDB().users.find((u) => u.id === payment.userId);
    if (student && course) {
      sendPaymentReceiptEmail(
        student.name, student.email,
        course.title, course.slug,
        payment.amount,
        process.env.CURRENCY || "KES",
        payment.method,
        payment.ref
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, status: "paid" });
  }

  // action === "reject"
    mutate((d) => {
      const p = d.payments.find((x) => x.id === paymentId);
      if (p) p.status = "failed";
      d.auditLogs.push({
        id: uid(),
        userId: user.id,
        userName: user.name,
        action: "REJECT_PAYMENT",
        entity: "payment",
        entityId: paymentId,
        details: `Rejected ${payment.method} payment of ${formatPrice(payment.amount)} for course ${payment.courseId}`,
        ip: "",
        createdAt: nowISO(),
      });
    });

    createNotification({
      userId: payment.userId,
      type: "payment",
      title: `❌ Payment could not be verified`,
      message: `Your ${payment.method} payment of ${formatPrice(payment.amount)} could not be verified. Please contact support if you believe this is an error.`,
      link: `/contact`,
    });

    return NextResponse.json({ success: true, status: "failed" });
}
