import { NextRequest, NextResponse } from "next/server";
import { getCourseById, enroll, formatPrice } from "@/lib/courses";
import { getCurrentUser } from "@/lib/auth";
import { readDB, mutate, uid, nowISO, createNotification, notifyAdmins } from "@/lib/store";
import { sendPaymentReceiptEmail, sendAdminNotificationEmail } from "@/lib/email";

// Methods that go through Flutterwave in live mode
const FLUTTERWAVE_METHODS = ["card", "mpesa"];
// Methods that are manual (show instructions, create pending payment)
const MANUAL_METHODS = ["telebirr", "cbe"];
// PayPal gets its own live integration
const PAYPAL_METHOD = "paypal";

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

  // ===================== DEMO MODE =====================
  // All methods auto-complete instantly for testing
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

    // Notifications
    createNotification({
      userId: user.id,
      type: "enrollment",
      title: `🎓 Enrolled in ${course.title}!`,
      message: `Welcome to the course! Start learning now — your progress is saved automatically.`,
      link: `/courses/${course.slug}/chapters`,
    });
    createNotification({
      userId: user.id,
      type: "payment",
      title: `💳 Payment confirmed`,
      message: `${formatPrice(course.price)} via ${method} — Ref: ${ref}`,
      link: `/dashboard`,
    });
    notifyAdmins(
      "New enrollment",
      `${user.name} enrolled in "${course.title}" (${formatPrice(course.price)} via ${method})`,
      `/admin`
    );

    // Send payment receipt email (non-blocking)
    sendPaymentReceiptEmail(user.name, user.email, course.title, course.slug, course.price, process.env.CURRENCY || "KES", method, ref).catch(() => {});

    return NextResponse.json({ redirect: `/dashboard?purchased=1&course=${course.slug}` });
  }

  // ===================== LIVE MODE =====================

  // --- Manual methods: Telebirr, CBE ---
  if (MANUAL_METHODS.includes(method)) {
    const ref = `manual_${method}_${uid()}`;
    mutate((db) => {
      db.payments.push({
        id: uid(),
        userId: user.id,
        courseId,
        amount: course.price,
        method,
        status: "pending",
        ref,
        createdAt: nowISO(),
      });
    });

    // Notifications for manual payment
    const methodName = method === "telebirr" ? "Telebirr" : method === "cbe" ? "CBE" : method;
    createNotification({
      userId: user.id,
      type: "payment",
      title: `⏳ ${methodName} payment pending`,
      message: `Please complete your ${methodName} payment of ${formatPrice(course.price)}. Ref: ${ref}. Your course will unlock after verification.`,
      link: `/dashboard`,
    });
    notifyAdmins(
      `${methodName} payment pending`,
      `${user.name} requested to pay for "${course.title}" via ${methodName}. Ref: ${ref}. Please verify payment.`,
      `/admin`
    );

    // Tell the user to complete payment on their end; admin will verify
    return NextResponse.json({
      redirect: `/dashboard?pending=1&course=${course.slug}&ref=${ref}&method=${method}`,
    });
  }

  // --- PayPal ---
  if (method === PAYPAL_METHOD) {
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!paypalClientId || !paypalSecret) {
      return NextResponse.json(
        { error: "PayPal is not configured yet. Please contact support." },
        { status: 500 }
      );
    }

    const siteUrl = process.env.SITE_URL || new URL(req.url).origin;
    const txRef = `pp_${uid()}`;
    const paypalBaseUrl = process.env.PAYPAL_SANDBOX === "true"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";

    // Create PayPal order
    try {
      // Get access token
      const tokenRes = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${paypalClientId}:${paypalSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        return NextResponse.json({ error: "PayPal authentication failed." }, { status: 502 });
      }

      const accessToken = tokenData.access_token;
      const currency = process.env.CURRENCY || "USD";

      // Create order
      const orderRes = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: txRef,
              description: course.title,
              amount: {
                currency_code: currency,
                value: course.price.toFixed(2),
              },
            },
          ],
          application_context: {
            brand_name: "TechPath Academy",
            return_url: `${siteUrl}/api/payments/verify?tx_ref=${txRef}&provider=paypal`,
            cancel_url: `${siteUrl}/checkout/${courseId}?cancelled=1`,
          },
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.links) {
        return NextResponse.json({ error: "Could not create PayPal order." }, { status: 502 });
      }

      mutate((db) => {
        db.payments.push({
          id: uid(),
          userId: user.id,
          courseId,
          amount: course.price,
          method: "paypal",
          status: "pending",
          ref: txRef,
          createdAt: nowISO(),
        });
      });

      const approveLink = orderData.links.find((l: { rel: string; href: string }) => l.rel === "approve");
      if (approveLink) {
        return NextResponse.json({ redirect_url: approveLink.href });
      }
      return NextResponse.json({ error: "PayPal approval link not found." }, { status: 502 });
    } catch {
      return NextResponse.json({ error: "PayPal service unavailable." }, { status: 502 });
    }
  }

  // --- Card / M-Pesa via Flutterwave ---
  if (FLUTTERWAVE_METHODS.includes(method)) {
    const secretKey = process.env.FLW_SECRET_KEY;
    const publicKey = process.env.FLW_PUBLIC_KEY;
    if (!secretKey || !publicKey) {
      return NextResponse.json(
        { error: "Payment is not configured yet. Please contact support." },
        { status: 500 }
      );
    }

    const currency = process.env.CURRENCY || "KES";
    const siteUrl = process.env.SITE_URL || new URL(req.url).origin;
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
          redirect_url: `${siteUrl}/api/payments/verify?tx_ref=${txRef}&provider=flutterwave`,
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

  return NextResponse.json({ error: "Unknown payment method." }, { status: 400 });
}
