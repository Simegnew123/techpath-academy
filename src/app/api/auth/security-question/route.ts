import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB, mutate } from "@/lib/store";
import { hashPassword } from "@/lib/auth";

// POST /api/auth/security-question — set or update security question (must be logged in)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const question = String(body?.question || "").trim();
  const answer = String(body?.answer || "").trim();

  if (!question || !answer) {
    return NextResponse.json({ error: "Security question and answer are required." }, { status: 400 });
  }

  const answerHash = await hashPassword(answer.toLowerCase());
  mutate((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (u) {
      u.securityQuestion = question;
      u.securityAnswerHash = answerHash;
    }
  });

  return NextResponse.json({ success: true });
}
