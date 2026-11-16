import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCourses } from "@/lib/courses";
import {
  getFinalExamForCourse,
  getQuestionsForQuiz,
  readDB,
} from "@/lib/store";
import ExamBuilder from "@/components/quiz/ExamBuilder";

export const revalidate = 0;

export default async function ExamAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "instructor" && user.role !== "teaching_assistant") {
    redirect("/");
  }

  const sp = await searchParams;
  const allCourses = getCourses();
  // Instructors see only their courses
  const courses = user.role === "admin"
    ? allCourses
    : allCourses.filter(c => c.instructorId === user.id);

  const selectedCourseId = sp.course || courses[0]?.id;
  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const existingExam = selectedCourse ? getFinalExamForCourse(selectedCourse.id) : undefined;
  const existingQuestions = existingExam ? getQuestionsForQuiz(existingExam.id) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Final Exam Builder 📋</h1>
          <p className="mt-1 text-slate-500">Create end-of-course assessments with auto-grading</p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Course selector */}
      <div className="mt-8">
        <label className="text-sm font-semibold text-slate-700">Select Course</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {courses.map(c => (
            <Link
              key={c.id}
              href={`/admin/exam?course=${c.id}`}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                selectedCourseId === c.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {c.title}
              {getFinalExamForCourse(c.id) && <span className="ml-1">✅</span>}
            </Link>
          ))}
        </div>
      </div>

      {selectedCourse && (
        <div className="mt-8">
          {existingExam ? (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800">
                <strong>Existing exam:</strong> {existingExam.title} ({existingQuestions.length} questions, pass: {existingExam.passingScore}%)
                <br />Editing will replace the existing exam.
              </p>
            </div>
          ) : (
            <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                No final exam exists for <strong>{selectedCourse.title}</strong> yet. Create one below.
              </p>
            </div>
          )}
          <ExamBuilder
            courseId={selectedCourse.id}
            courseTitle={selectedCourse.title}
            existingExam={existingExam || null}
            existingQuestions={existingQuestions}
          />
        </div>
      )}
    </div>
  );
}
