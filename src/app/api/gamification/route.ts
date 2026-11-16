import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStreak, getUserBadges, updateStreak, getLeaderboard, readDB, awardBadge } from "@/lib/store";
import type { BadgeType } from "@/lib/store";

// GET /api/gamification — get user's streak, badges, and leaderboard
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const leaderboard = searchParams.get("leaderboard");

  if (leaderboard) {
    const entries = getLeaderboard(20);
    return NextResponse.json({ leaderboard: entries });
  }

  // Update streak on page load
  const streak = updateStreak(user.id);

  // Award first_course badge if they have enrollments
  const db = readDB();
  const hasEnrollments = db.enrollments.some((e) => e.userId === user.id);
  if (hasEnrollments) awardBadge(user.id, "first_course" as BadgeType);
  if (db.enrollments.filter((e) => e.userId === user.id).length >= 5) {
    awardBadge(user.id, "five_courses" as BadgeType);
  }

  const badges = getUserBadges(user.id);
  const allBadges = db.badges;

  return NextResponse.json({
    streak,
    badges: badges.map((b) => ({
      ...b,
      badge: allBadges.find((bd) => bd.type === b.badgeType),
    })),
    allBadges,
  });
}
