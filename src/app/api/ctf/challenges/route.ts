import { NextRequest, NextResponse } from "next/server";
import { readDB, mutate, uid, nowISO } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

// GET /api/ctf/challenges?lessonId=xxx — get challenges for a lesson
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");
  const courseId = searchParams.get("courseId");

  const db = readDB();
  let challenges = db.ctfChallenges;

  if (lessonId) challenges = challenges.filter((c) => c.lessonId === lessonId);
  if (courseId) challenges = challenges.filter((c) => c.courseId === courseId);

  // Don't expose flagHash to client — only metadata
  const safe = challenges.map(({ flagHash, ...rest }) => rest);

  // If user is logged in, include their solve status
  const user = await getCurrentUser();
  if (user) {
    const solves = db.ctfSolves.filter((s) => s.userId === user.id);
    const solveMap = new Map(solves.map((s) => [s.challengeId, s]));
    return NextResponse.json({
      challenges: safe.map((c) => ({
        ...c,
        solved: solveMap.has(c.id),
        attemptsUsed: solveMap.get(c.id)?.attemptsUsed || 0,
      })),
    });
  }

  return NextResponse.json({ challenges: safe });
}

// POST /api/ctf/challenges — admin: create a new CTF challenge
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    return NextResponse.json({ error: "Admin or instructor access required." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const { lessonId, courseId, title, description, category, difficulty, flag, points, hint, maxAttempts } = body;

  if (!lessonId || !courseId || !title || !flag) {
    return NextResponse.json({ error: "lessonId, courseId, title, and flag are required." }, { status: 400 });
  }

  // Hash the flag (case-insensitive, trimmed) — SHA-256
  const normalizedFlag = String(flag).trim().toLowerCase();
  const flagHash = crypto.createHash("sha256").update(normalizedFlag).digest("hex");

  const challenge = {
    id: uid(),
    lessonId: String(lessonId),
    courseId: String(courseId),
    title: String(title),
    description: String(description || ""),
    category: String(category || "misc") as "crypto" | "forensics" | "network" | "web" | "linux" | "reverse" | "misc",
    difficulty: String(difficulty || "easy") as "easy" | "medium" | "hard" | "expert",
    flagHash,
    points: Number(points) || 50,
    hint: String(hint || ""),
    maxAttempts: Number(maxAttempts) || 0,
    solveCount: 0,
    createdAt: nowISO(),
  };

  mutate((db) => {
    db.ctfChallenges.push(challenge);
  });

  // Return without flagHash
  const { flagHash: _, ...safe } = challenge;
  return NextResponse.json({ challenge: safe }, { status: 201 });
}
