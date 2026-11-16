import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCourseBySlug, getLessons, hasAccess } from "@/lib/courses";
import {
  getFinalExamForCourse,
  getQuestionsForQuiz,
  getQuizAttempts,
  getCompletionPercent,
} from "@/lib/store";
import FinalExamPlayer from "@/components/quiz/FinalExamPlayer";

export const revalidate = 0;

export default async function ExamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const course = getCourseBySlug(slug);
  if (!course) notFound();

  // Must be enrolled
  if (!hasAccess(user.id, course)) {
    redirect(`/checkout/${course.slug}`);
  }

  // Must have completed all lessons
  const completion = getCompletionPercent(user.id, course.id);
  if (completion < 100) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="text-6xl">🔒</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Complete All Lessons First</h1>
        <p className="mt-2 text-slate-600">
          You need to complete 100% of the course lessons before taking the final exam.
          You're at <strong>{completion}%</strong>.
        </p>
        <Link
          href={`/courses/${course.slug}`}
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Back to Course
        </Link>
      </div>
    );
  }

  const exam = getFinalExamForCourse(course.id);
  if (!exam) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="text-6xl">📝</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">No Final Exam Available</h1>
        <p className="mt-2 text-slate-600">
          This course doesn't have a final exam yet. Your certificate will be issued automatically.
        </p>
        <Link
          href={`/courses/${course.slug}`}
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Back to Course
        </Link>
      </div>
    );
  }

  // Check attempt history
  const attempts = getQuizAttempts(user.id, exam.id);
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;
  const passed = attempts.some((a) => a.passed);
  const attemptsRemaining = exam.maxAttempts > 0 ? exam.maxAttempts - attempts.length : -1;

  // If no attempts remaining, show locked
  if (attemptsRemaining === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="text-6xl">⛔</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">No Attempts Remaining</h1>
        <p className="mt-2 text-slate-600">
          You've used all {exam.maxAttempts} attempts for this exam. Your best score is <strong>{bestScore}%</strong>.
          Please contact your instructor for a retake.
        </p>
        <Link
          href={`/courses/${course.slug}`}
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Back to Course
        </Link>
      </div>
    );
  }

  const isStaff = user.role === "admin" || user.role === "instructor" || user.role === "teaching_assistant";
  const questions = getQuestionsForQuiz(exam.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/courses" className="hover:text-indigo-600">Courses</Link>
        <span>/</span>
        <Link href={`/courses/${course.slug}`} className="hover:text-indigo-600">{course.title}</Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">Final Exam</span>
      </nav>

      {/* Exam header */}
      <div className="mt-6 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-4xl">📋</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
            <p className="text-sm text-slate-600">{exam.description || `Final assessment for ${course.title}`}</p>
          </div>
        </div>

        {/* Exam meta */}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-lg bg-amber-100 px-3 py-1 font-medium text-amber-800">
            📊 Pass: {exam.passingScore}%
          </span>
          <span className="rounded-lg bg-blue-100 px-3 py-1 font-medium text-blue-800">
            ❓ {questions.length} Questions
          </span>
          {exam.timeLimit > 0 && (
            <span className="rounded-lg bg-red-100 px-3 py-1 font-medium text-red-800">
              ⏱ {exam.timeLimit} min limit
            </span>
          )}
          {exam.maxAttempts > 0 && (
            <span className="rounded-lg bg-slate-100 px-3 py-1 font-medium text-slate-700">
              🔄 {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} left
            </span>
          )}
          {attempts.length > 0 && (
            <span className={`rounded-lg px-3 py-1 font-medium ${passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {passed ? "✅ Passed" : "❌ Best: " + bestScore + "%"}
            </span>
          )}
        </div>
      </div>

      {/* If already passed, show success */}
      {passed && (
        <div className="mt-6 rounded-2xl border border-green-300 bg-green-50 p-6 text-center">
          <div className="text-5xl">🎉</div>
          <h2 className="mt-3 text-xl font-bold text-green-900">You Passed the Final Exam!</h2>
          <p className="mt-2 text-green-800">
            Your certificate has been issued. Best score: <strong>{bestScore}%</strong>
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            View My Certificates →
          </Link>
        </div>
      )}

      {/* Exam player */}
      {!passed && (
        <div className="mt-6">
          <FinalExamPlayer
            quiz={exam}
            questions={isStaff ? questions : questions.map(q => ({ ...q, correctAnswer: "", explanation: "" }))}
            isStaff={isStaff}
          />
        </div>
      )}

      {/* Previous attempts */}
      {attempts.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-slate-900">Previous Attempts</h3>
          <div className="mt-3 space-y-2">
            {attempts.map((att, i) => (
              <div
                key={att.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  att.passed ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
                }`}
              >
                <span className="text-sm font-medium text-slate-700">
                  Attempt {attempts.length - i}: <strong>{att.score}%</strong>
                  {att.violations > 0 && <span className="ml-2 text-amber-600">⚠️ {att.violations} violations</span>}
                </span>
                <span className={`text-sm font-semibold ${att.passed ? "text-green-600" : "text-red-600"}`}>
                  {att.passed ? "PASSED" : "FAILED"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
