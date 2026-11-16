import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getQuizByLessonId,
  getQuestionsForQuiz,
  createQuiz,
  createQuestion,
  deleteQuiz,
  createAuditLog,
} from "@/lib/store";

// GET /api/quizzes?lessonId=xxx — get quiz + questions for a lesson
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const quiz = getQuizByLessonId(lessonId);
  if (!quiz) return NextResponse.json({ quiz: null, questions: [] });

  let questions = getQuestionsForQuiz(quiz.id);
  const isStaff = user.role === "admin" || user.role === "instructor" || user.role === "teaching_assistant";
  if (!isStaff) {
    questions = questions.map((q) => ({
      ...q,
      correctAnswer: "",
      explanation: "",
    }));
  }
  return NextResponse.json({ quiz, questions });
}

// POST /api/quizzes — create or update quiz with questions
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor" && user.role !== "teaching_assistant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    lessonId, courseId, title, description,
    passingScore = 70, maxAttempts = 3, shuffleQuestions = false, timeLimit = 0,
    questions = [], replaceExisting = true,
  } = body;

  if (!lessonId || !courseId || !title) {
    return NextResponse.json({ error: "lessonId, courseId, title required" }, { status: 400 });
  }

  if (replaceExisting) {
    const existing = getQuizByLessonId(lessonId);
    if (existing) deleteQuiz(existing.id);
  }

  const quiz = createQuiz({
    lessonId, courseId, title, description: description || "",
    passingScore, maxAttempts, shuffleQuestions, timeLimit,
  });

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    createQuestion({
      quizId: quiz.id,
      text: q.text, type: q.type || "mcq",
      options: q.options || [], correctAnswer: q.correctAnswer || "",
      explanation: q.explanation || "", points: q.points || 1, order: i,
    });
  }

  createAuditLog({
    userId: user.id, userName: user.name, action: "CREATE_QUIZ",
    entity: "quiz", entityId: quiz.id,
    details: `Created quiz "${title}" with ${questions.length} questions`,
  });

  return NextResponse.json({ quiz, questionCount: questions.length });
}

// DELETE /api/quizzes?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const quizId = req.nextUrl.searchParams.get("id");
  if (!quizId) return NextResponse.json({ error: "id required" }, { status: 400 });

  deleteQuiz(quizId);
  createAuditLog({
    userId: user.id, userName: user.name, action: "DELETE_QUIZ",
    entity: "quiz", entityId: quizId, details: "Deleted quiz",
  });

  return NextResponse.json({ success: true });
}
