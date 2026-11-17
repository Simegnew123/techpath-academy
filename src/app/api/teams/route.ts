import { NextRequest, NextResponse } from "next/server";
import { readDB, mutate, uid, nowISO, createNotification } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

// GET /api/teams — list team licenses (admin sees all, manager sees own)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const db = readDB();

  if (user.role === "admin") {
    // Admin sees all team licenses with member details
    const teams = db.teamLicenses.map((license) => {
      const members = db.teamMembers.filter((m) => m.licenseId === license.id);
      return { ...license, members };
    });
    return NextResponse.json({ teams });
  }

  // Regular user — see teams they're a member of
  const memberOf = db.teamMembers.filter((m) => m.userId === user.id);
  const licenses = memberOf
    .map((m) => db.teamLicenses.find((l) => l.id === m.licenseId))
    .filter(Boolean);

  return NextResponse.json({ teams: licenses });
}

// POST /api/teams — create a new team license (purchase seats)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { companyName, contactEmail, contactName, plan, seats, coursesIncluded, amountPaid, currency, paymentRef } = body;

  if (!companyName || !seats || seats < 1) {
    return NextResponse.json({ error: "Company name and at least 1 seat required." }, { status: 400 });
  }

  const planType = plan || "team";
  const now = new Date();
  const expires = new Date(now);
  expires.setFullYear(expires.getFullYear() + 1); // 1 year license

  const license = {
    id: uid(),
    companyName: String(companyName),
    contactEmail: String(contactEmail || user.email),
    contactName: String(contactName || user.name),
    plan: planType as "starter" | "team" | "enterprise",
    seatsPurchased: Number(seats),
    seatsUsed: 0,
    coursesIncluded: Array.isArray(coursesIncluded) ? coursesIncluded : [],
    amountPaid: Number(amountPaid) || 0,
    currency: String(currency || "KES"),
    paymentRef: String(paymentRef || `TEAM-${Date.now()}`),
    status: "active" as const,
    createdAt: nowISO(),
    expiresAt: expires.toISOString(),
  };

  mutate((db) => {
    db.teamLicenses.push(license);

    // The purchaser is auto-added as the first team member
    db.teamMembers.push({
      id: uid(),
      licenseId: license.id,
      userId: user.id,
      email: user.email,
      name: user.name,
      invitedAt: nowISO(),
      joinedAt: nowISO(),
      status: "active",
    });

    // Update seats used
    license.seatsUsed = 1;

    createNotification({
      userId: user.id,
      type: "team_purchase",
      title: "🏢 Team License Activated",
      message: `Your team license for ${companyName} is active. ${seats - 1} seats remaining to invite.`,
      link: "/dashboard",
    });
  });

  return NextResponse.json({ license, message: "Team license created successfully!" }, { status: 201 });
}
