import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getQuizById,
  getQuestionsForQuiz,
  getQuizAttempts,
  createQuizAttempt,
  createAuditLog,
  createNotification,
} from "@/lib/store";
import { getCourseById } from "@/lib/courses";
import { issueCertificate } from "@/lib/courses";

// POST /api/quizzes/[id]/submit — auto-grade quiz submission
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: quizId } = await params;
  const quiz = getQuizById(quizId);
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  // Check attempt limit
  const attempts = getQuizAttempts(user.id, quizId);
  if (quiz.maxAttempts > 0 && attempts.length >= quiz.maxAttempts) {
    return NextResponse.json({
      error: `Maximum attempts (${quiz.maxAttempts}) reached for this quiz.`,
      bestScore: Math.max(...attempts.map((a) => a.score), 0),
    }, { status: 429 });
  }

  const body = await req.json();
  const { answers = {}, timeTakenSec = 0, violations = 0 } = body;

  // Auto-grade
  const questions = getQuestionsForQuiz(quizId);
  let earnedPoints = 0;
  let totalPoints = 0;
  const gradedAnswers: { questionId: string; answer: string; correct: boolean }[] = [];

  for (const q of questions) {
    totalPoints += q.points;
    const userAnswer = (answers[q.id] || "").toString().trim();
    let correct = false;

    if (q.type === "mcq" || q.type === "true_false") {
      correct = userAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
    } else if (q.type === "short_answer") {
      // Simple keyword matching for short answers
      const modelWords = q.correctAnswer.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const userWords = userAnswer.toLowerCase();
      const matched = modelWords.filter((w) => userWords.includes(w));
      correct = matched.length >= Math.ceil(modelWords.length * 0.6);
    }

    if (correct) earnedPoints += q.points;
    gradedAnswers.push({ questionId: q.id, answer: userAnswer, correct });
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= quiz.passingScore;

  const attempt = createQuizAttempt({
    quizId,
    userId: user.id,
    answers: gradedAnswers,
    score,
    passed,
    timeTakenSec,
    violations,
  });

  // Flag suspicious attempts in audit log
  if (violations >= 3) {
    createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "QUIZ_CHEATING_FLAG",
      entity: "quiz",
      entityId: quizId,
      details: `Flagged for ${violations} anti-cheating violations on quiz "${quiz.title}" (score: ${score}%)`,
    });
  }

  // ---- Final exam passed → auto-issue certificate ----
  let certificateIssued = false;
  if (quiz.isFinalExam && passed) {
    const course = getCourseById(quiz.courseId);
    if (course) {
      try {
        const cert = issueCertificate(user.id, quiz.courseId);
        if (cert) {
          certificateIssued = true;
          createNotification({
            userId: user.id,
            type: "certificate",
            title: "🏅 Certificate Earned!",
            message: `Congratulations! You passed the final exam for "${course.title}" and earned your certificate.`,
            link: `/certificates/${cert.code}`,
          });
          createAuditLog({
            userId: user.id,
            userName: user.name,
            action: "CERTIFICATE_ISSUED",
            entity: "certificate",
            entityId: cert.id,
            details: `Certificate issued via final exam pass (${score}%) for "${course.title}"`,
          });
        }
      } catch (e) {
        // Certificate may already exist — that's fine
      }
    }
  }

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    passed,
    passingScore: quiz.passingScore,
    gradedAnswers,
    questions: questions.map((q) => ({
      id: q.id,
      text: q.text,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      type: q.type,
    })),
    attemptsRemaining:
      quiz.maxAttempts > 0 ? quiz.maxAttempts - attempts.length - 1 : -1,
    certificateIssued,
    isFinalExam: quiz.isFinalExam,
  });
}
