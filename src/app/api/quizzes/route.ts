import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getQuizByLessonId,
  getFinalExamForCourse,
  getQuestionsForQuiz,
  createQuiz,
  createQuestion,
  deleteQuiz,
  createAuditLog,
} from "@/lib/store";

// GET /api/quizzes?lessonId=xxx — get quiz + questions for a lesson
// GET /api/quizzes?courseId=xxx&finalExam=1 — get final exam for a course
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lessonId = req.nextUrl.searchParams.get("lessonId");
  const courseId = req.nextUrl.searchParams.get("courseId");
  const isFinalExam = req.nextUrl.searchParams.get("finalExam") === "1";

  let quiz = null;

  if (isFinalExam && courseId) {
    quiz = getFinalExamForCourse(courseId);
  } else if (lessonId) {
    quiz = getQuizByLessonId(lessonId);
  } else {
    return NextResponse.json({ error: "lessonId or courseId required" }, { status: 400 });
  }

  if (!quiz) return NextResponse.json({ quiz: null, questions: [] });

  let questions: Array<{ id: string; quizId: string; text: string; options: string[]; correctAnswer: string; explanation: string; order: number }> = [];
  try {
    questions = getQuestionsForQuiz(quiz.id);
  } catch {
    questions = [];
  }

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
    isFinalExam = false,
    questions = [], replaceExisting = true,
  } = body;

  if (!courseId || !title) {
    return NextResponse.json({ error: "courseId, title required" }, { status: 400 });
  }
  // lessonId is required for lesson quizzes, null for final exams
  if (!isFinalExam && !lessonId) {
    return NextResponse.json({ error: "lessonId required (or set isFinalExam=true)" }, { status: 400 });
  }

  // For final exams, replace existing final exam for this course
  if (isFinalExam && replaceExisting) {
    const existing = getFinalExamForCourse(courseId);
    if (existing) deleteQuiz(existing.id);
  } else if (lessonId && replaceExisting) {
    const existing = getQuizByLessonId(lessonId);
    if (existing) deleteQuiz(existing.id);
  }

  const quiz = createQuiz({
    lessonId: isFinalExam ? null : lessonId,
    courseId, title, description: description || "",
    passingScore, maxAttempts, shuffleQuestions, timeLimit,
    isFinalExam,
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
    userId: user.id, userName: user.name,
    action: isFinalExam ? "CREATE_FINAL_EXAM" : "CREATE_QUIZ",
    entity: "quiz", entityId: quiz.id,
    details: `${isFinalExam ? "Final exam" : "Quiz"} "${title}" with ${questions.length} questions`,
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
