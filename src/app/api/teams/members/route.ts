import { NextRequest, NextResponse } from "next/server";
import { readDB, mutate, uid, nowISO, createNotification } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

// POST /api/teams/members — invite a team member
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { licenseId, email, name } = body;
  if (!licenseId || !email) {
    return NextResponse.json({ error: "License ID and email are required." }, { status: 400 });
  }

  const db = readDB();
  const license = db.teamLicenses.find((l) => l.id === licenseId);
  if (!license) return NextResponse.json({ error: "License not found." }, { status: 404 });

  // Check if the requester is the license owner or admin
  const isOwner = license.contactEmail === user.email;
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Only the team manager can invite members." }, { status: 403 });
  }

  // Check seats available
  if (license.seatsUsed >= license.seatsPurchased) {
    return NextResponse.json({ error: "No seats available. Purchase more seats to invite more members." }, { status: 400 });
  }

  // Check if already invited
  const existing = db.teamMembers.find(
    (m) => m.licenseId === licenseId && m.email === email.toLowerCase()
  );
  if (existing) {
    return NextResponse.json({ error: "This email has already been invited." }, { status: 400 });
  }

  // Find if the user already has an account
  const existingUser = db.users.find((u) => u.email === email.toLowerCase());
  const member = {
    id: uid(),
    licenseId,
    userId: existingUser?.id || "",
    email: email.toLowerCase(),
    name: name || email.split("@")[0],
    invitedAt: nowISO(),
    joinedAt: existingUser ? nowISO() : null,
    status: (existingUser ? "active" : "invited") as "active" | "invited" | "removed",
  };

  mutate((d) => {
    d.teamMembers.push(member);

    // Increment seats used
    const lic = d.teamLicenses.find((l) => l.id === licenseId);
    if (lic) lic.seatsUsed++;

    // If user exists, notify them
    if (existingUser) {
      createNotification({
        userId: existingUser.id,
        type: "team_invite",
        title: "🏢 Team Invitation Accepted",
        message: `You've been added to ${license.companyName}'s team license. You now have access to team courses.`,
        link: "/dashboard",
      });
    }
  });

  return NextResponse.json({
    member,
    message: existingUser
      ? `${name || email} added to the team.`
      : `Invitation sent to ${email}. They'll be added once they create an account.`,
  });
}

// GET /api/teams/members?licenseId=xxx — list members of a team
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const licenseId = searchParams.get("licenseId");
  if (!licenseId) return NextResponse.json({ error: "licenseId required." }, { status: 400 });

  const db = readDB();
  const license = db.teamLicenses.find((l) => l.id === licenseId);
  if (!license) return NextResponse.json({ error: "License not found." }, { status: 404 });

  const isOwner = license.contactEmail === user.email;
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const members = db.teamMembers.filter((m) => m.licenseId === licenseId);

  // Enrich with progress data
  const enriched = members.map((m) => {
    const enrollments = db.enrollments.filter((e) => e.userId === m.userId);
    const completedCount = enrollments.filter((e) => e.completed).length;
    return {
      ...m,
      coursesEnrolled: enrollments.length,
      coursesCompleted: completedCount,
      completionRate: enrollments.length > 0 ? Math.round((completedCount / enrollments.length) * 100) : 0,
    };
  });

  return NextResponse.json({ members: enriched, license });
}
