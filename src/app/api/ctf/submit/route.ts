import { NextRequest, NextResponse } from "next/server";
import { readDB, mutate, uid, nowISO, createNotification } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS, getClientIP } from "@/lib/rateLimit";
import crypto from "crypto";

// POST /api/ctf/submit — submit a flag attempt
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in to submit flags." }, { status: 401 });

  // Rate limit: 10 flag submissions per minute
  const ip = getClientIP(req);
  const rl = checkRateLimit(`ctf:${ip}`, RATE_LIMITS.api);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { challengeId, flag } = body;
  if (!challengeId || !flag) {
    return NextResponse.json({ error: "Challenge ID and flag are required." }, { status: 400 });
  }

  const db = readDB();
  const challenge = db.ctfChallenges.find((c) => c.id === challengeId);
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  // Check if already solved
  const existingSolve = db.ctfSolves.find(
    (s) => s.challengeId === challengeId && s.userId === user.id
  );
  if (existingSolve) {
    return NextResponse.json({ error: "You've already solved this challenge!", alreadySolved: true });
  }

  // Count attempts
  const attemptKey = `ctf-attempts:${user.id}:${challengeId}`;
  const attemptRl = checkRateLimit(attemptKey, { windowMs: 60 * 60 * 1000, maxRequests: challenge.maxAttempts || 100 });
  if (challenge.maxAttempts > 0 && !attemptRl.allowed) {
    return NextResponse.json({
      error: `Maximum attempts (${challenge.maxAttempts}) reached for this challenge.`,
      showHint: true,
      hint: challenge.hint,
    }, { status: 429 });
  }

  // Hash the submitted flag and compare
  const normalizedFlag = String(flag).trim().toLowerCase();
  const submittedHash = crypto.createHash("sha256").update(normalizedFlag).digest("hex");

  if (submittedHash !== challenge.flagHash) {
    // Wrong flag — check if we should show hint (after 3 failed attempts)
    const attempts = (attemptRl.remaining === undefined ? 0 : (challenge.maxAttempts - attemptRl.remaining));
    const showHint = attempts >= 3 && challenge.hint;

    return NextResponse.json({
      correct: false,
      error: "Incorrect flag. Try again!",
      showHint,
      hint: showHint ? challenge.hint : undefined,
      attemptsRemaining: challenge.maxAttempts > 0 ? attemptRl.remaining : "unlimited",
    }, { status: 200 });
  }

  // Correct flag! Record the solve
  const solve = {
    id: uid(),
    challengeId,
    userId: user.id,
    attemptsUsed: challenge.maxAttempts > 0 ? (challenge.maxAttempts - attemptRl.remaining + 1) : 1,
    solvedAt: nowISO(),
    pointsAwarded: challenge.points,
  };

  mutate((d) => {
    d.ctfSolves.push(solve);
    // Increment solve count on the challenge
    const ch = d.ctfChallenges.find((c) => c.id === challengeId);
    if (ch) ch.solveCount++;

    // Award gamification points to the user's streak
    const streak = d.streaks.find((s) => s.userId === user.id);
    if (streak) {
      streak.totalXP = (streak.totalXP || 0) + challenge.points;
    }

    // Create notification
    createNotification({
      userId: user.id,
      type: "ctf_solved",
      title: `🎯 CTF Challenge Solved!`,
      message: `You solved "${challenge.title}" and earned ${challenge.points} XP!`,
      link: `/courses/${challenge.courseId}`,
    });
  });

  return NextResponse.json({
    correct: true,
    message: `🎉 Flag captured! +${challenge.points} XP`,
    pointsAwarded: challenge.points,
  });
}
