import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPromoCodes, createPromoCode, validatePromoCode, incrementPromoUsage } from "@/lib/store";

// GET /api/promo-codes — list all (admin only)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const codes = getPromoCodes();
  return NextResponse.json({ promoCodes: codes });
}

// POST /api/promo-codes — create promo code or validate
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, code, courseId, price } = body;

  // Validate promo code (any logged-in user)
  if (action === "validate") {
    if (!code || !courseId) return NextResponse.json({ error: "code and courseId required" }, { status: 400 });
    const result = validatePromoCode(code, courseId, price || 0);
    return NextResponse.json(result);
  }

  // Use promo code (increment usage)
  if (action === "use") {
    if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
    incrementPromoUsage(code);
    return NextResponse.json({ success: true });
  }

  // Create promo code (admin only)
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { description, discountType, discountValue, maxUses, expiresAt, courseId: applyCourseId } = body;
  if (!code || !discountType || discountValue === undefined) {
    return NextResponse.json({ error: "code, discountType, discountValue required" }, { status: 400 });
  }

  const promo = createPromoCode({
    code: code.toUpperCase(),
    description: description || "",
    discountType,
    discountValue,
    maxUses: maxUses || 0,
    expiresAt: expiresAt || null,
    active: true,
    courseId: applyCourseId || null,
  });

  return NextResponse.json({ promoCode: promo });
}
