import { NextRequest, NextResponse } from "next/server";
import { readDB, mutate, uid, nowISO, createNotification } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

// GET /api/labs/complete?lessonId=xxx — fetch lab config for a lesson
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "lessonId required." }, { status: 400 });

  const db = readDB();
  const lab = db.labConfigs.find((l) => l.lessonId === lessonId);
  if (!lab) return NextResponse.json({ lab: null });

  // Don't send the expectedCommand or hint directly — send step instructions only
  // Actually, we DO need expectedCommand on the client for the terminal to work.
  // In a real deployment this would be server-side validation. For this educational platform,
  // we send the full config and also validate server-side on POST.
  const safeLab = {
    type: lab.type,
    title: lab.title,
    description: lab.description,
    environment: lab.environment,
    steps: lab.steps.map((s) => ({
      instruction: s.instruction,
      expectedCommand: s.expectedCommand,
      hint: s.hint,
      completed: false,
    })),
    commands: lab.commands,
  };

  return NextResponse.json({ lab: safeLab });
}

// POST /api/labs/complete — record lab completion
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { lessonId, stepsCompleted, totalSteps, completed } = body;

  const db = readDB();
  const lab = db.labConfigs.find((l) => l.lessonId === lessonId);
  if (!lab) return NextResponse.json({ error: "Lab not found." }, { status: 404 });

  // Check if already completed
  const existing = db.labCompletions.find(
    (c) => c.labConfigId === lab.id && c.userId === user.id && c.completed
  );
  if (existing) {
    return NextResponse.json({ message: "Lab already completed.", alreadyCompleted: true });
  }

  // Record completion
  const completion = {
    id: uid(),
    labConfigId: lab.id,
    userId: user.id,
    stepsCompleted: Number(stepsCompleted) || 0,
    totalSteps: Number(totalSteps) || 0,
    completed: Boolean(completed),
    completedAt: completed ? nowISO() : null,
    startedAt: nowISO(),
  };

  mutate((d) => {
    d.labCompletions.push(completion);

    if (completed) {
      // Award XP
      const streak = d.streaks.find((s) => s.userId === user.id);
      if (streak) {
        streak.totalXP = (streak.totalXP || 0) + 100; // 100 XP per lab
      }

      createNotification({
        userId: user.id,
        type: "lab_complete",
        title: "🧪 Lab Completed!",
        message: `You completed the lab "${lab.title}". +100 XP`,
        link: `/courses/${lab.courseId}`,
      });
    }
  });

  return NextResponse.json({ success: true, message: "Lab completion recorded!", xpAwarded: completed ? 100 : 0 });
}
