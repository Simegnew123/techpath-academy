import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB, mutate, createNotification, notifyAdmins } from "@/lib/store";
import { getCourseById, formatPrice } from "@/lib/courses";

/**
 * Student submits their Telebirr/CBE transaction ID after sending money.
 * The transaction ID is appended to the payment's ref field:
 *   "manual_telebirr_abc123" → "manual_telebirr_abc123|TXID:12345678"
 * This lets the admin verify the payment against their Telebirr/CBE account.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const paymentId = String(body?.paymentId || "");
  const txRef = String(body?.txRef || "").trim();

  if (!paymentId || !txRef) {
    return NextResponse.json({ error: "Payment ID and transaction reference are required." }, { status: 400 });
  }

  if (txRef.length < 4) {
    return NextResponse.json({ error: "Transaction reference seems too short. Please enter the full ID from your Telebirr/CBE confirmation." }, { status: 400 });
  }

  // Find the pending payment belonging to this user
  const db = readDB();
  const payment = db.payments.find(
    (p) => p.id === paymentId && p.userId === user.id && p.status === "pending"
  );

  if (!payment) {
    return NextResponse.json({ error: "Payment not found or already processed." }, { status: 404 });
  }

  if (payment.method !== "telebirr" && payment.method !== "cbe") {
    return NextResponse.json({ error: "This payment method doesn't require a transaction ID." }, { status: 400 });
  }

  // Check if already submitted
  if (payment.ref.includes("|TXID:")) {
    return NextResponse.json({ error: "You already submitted a transaction ID for this payment. Please wait for verification." }, { status: 400 });
  }

  // Append the user's transaction ID to the ref
  const originalRef = payment.ref;
  const newRef = `${originalRef}|TXID:${txRef}`;

  mutate((d) => {
    const p = d.payments.find((p) => p.id === paymentId);
    if (p) {
      p.ref = newRef;
    }
  });

  const course = getCourseById(payment.courseId);
  const methodName = payment.method === "telebirr" ? "Telebirr" : "CBE";

  // Notify admins
  notifyAdmins(
    `${methodName} payment submitted for verification`,
    `${user.name} submitted ${methodName} transaction ID "${txRef}" for "${course?.title || "course"}" (${formatPrice(payment.amount)}). Please verify and approve.`,
    "/admin/payments"
  );

  // Notify the student
  createNotification({
    userId: user.id,
    type: "payment",
    title: `✅ Transaction ID submitted`,
    message: `Your ${methodName} transaction ID "${txRef}" has been submitted. We'll verify it shortly — your course will unlock once confirmed.`,
    link: "/dashboard",
  });

  return NextResponse.json({ success: true, message: "Transaction ID submitted. We'll verify your payment shortly." });
}
