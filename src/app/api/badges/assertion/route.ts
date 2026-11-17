import { NextRequest, NextResponse } from "next/server";
import { readDB, mutate, uid, nowISO } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

// GET /api/badges/assertion?badgeId=xxx&userId=xxx — get Open Badges v3 compliant assertion
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assertionId = searchParams.get("assertionId");
  const badgeId = searchParams.get("badgeId");
  const userId = searchParams.get("userId");

  const db = readDB();

  let assertion = null;

  if (assertionId) {
    assertion = db.badgeAssertions.find((a) => a.id === assertionId);
  } else if (badgeId && userId) {
    assertion = db.badgeAssertions.find((a) => a.badgeId === badgeId && a.userId === userId);
  }

  if (!assertion) {
    return NextResponse.json({ error: "Badge assertion not found." }, { status: 404 });
  }

  const badge = db.badges.find((b) => b.id === assertion.badgeId);
  if (!badge) return NextResponse.json({ error: "Badge definition not found." }, { status: 404 });

  // Build Open Badges v3 (VC) compliant JSON-LD
  const openBadgeAssertion = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://purl.imsglobal.org/spec/ob/v3p0/context.json",
    ],
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    id: assertion.verificationUrl,
    issuer: {
      type: ["Profile"],
      id: "https://techpath-academy.onrender.com",
      name: "TechPath Academy",
      url: "https://techpath-academy.onrender.com",
      email: "ademezerihun2013@gmail.com",
    },
    issuanceDate: assertion.issuedOn,
    credentialSubject: {
      type: ["AchievementSubject"],
      id: `mailto:${assertion.recipientEmail}`,
      name: assertion.recipientName,
      achievement: {
        type: ["Achievement"],
        id: `https://techpath-academy.onrender.com/api/badges/assertion?badgeId=${badge.id}`,
        name: badge.name,
        description: badge.description,
        criteria: {
          type: "Criteria",
          narrative: badge.description,
        },
        image: {
          type: "Image",
          id: badge.icon || "https://techpath-academy.onrender.com/badge-default.png",
        },
      },
    },
    evidence: [{
      type: "Evidence",
      id: assertion.evidenceUrl,
      narrative: "Completed all required coursework and assessments.",
    }],
  };

  return NextResponse.json(openBadgeAssertion, {
    headers: { "Content-Type": "application/ld+json" },
  });
}

// POST /api/badges/assertion — issue a badge assertion (auto-called when badge is earned)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { badgeId, userId, evidenceUrl } = body;
  const targetUserId = userId || user.id;

  // Only admin can issue to other users
  if (targetUserId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Can only issue badges to yourself." }, { status: 403 });
  }

  const db = readDB();
  const badge = db.badges.find((b) => b.id === badgeId);
  if (!badge) return NextResponse.json({ error: "Badge not found." }, { status: 404 });

  const targetUser = db.users.find((u) => u.id === targetUserId);
  if (!targetUser) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // Check if assertion already exists
  const existing = db.badgeAssertions.find((a) => a.badgeId === badgeId && a.userId === targetUserId);
  if (existing) {
    return NextResponse.json({ assertion: existing, message: "Badge already issued." });
  }

  const assertionId = uid();
  const assertion = {
    id: assertionId,
    badgeId,
    userId: targetUserId,
    issuedOn: nowISO(),
    verificationUrl: `https://techpath-academy.onrender.com/api/badges/assertion?assertionId=${assertionId}`,
    evidenceUrl: evidenceUrl || `https://techpath-academy.onrender.com/profile/${targetUser.email}`,
    recipientEmail: targetUser.email,
    recipientName: targetUser.name,
  };

  mutate((d) => {
    d.badgeAssertions.push(assertion);
  });

  return NextResponse.json({ assertion, message: "Badge issued!" }, { status: 201 });
}
