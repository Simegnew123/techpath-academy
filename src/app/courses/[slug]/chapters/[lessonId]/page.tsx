import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { marked } from "marked";
import {
  getCourseBySlug,
  getLessons,
  getLesson,
  hasAccess,
  isLessonCompleted,
} from "@/lib/courses";
import {
  getModulesForCourse,
  getLessonsForModule,
  getCategoryById,
  getCompletionPercent,
} from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import CompleteButton from "@/components/CompleteButton";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import InteractiveVideoPlayer from "@/components/InteractiveVideoPlayer";
import AITutor from "@/components/AITutor";
import LessonNotes from "@/components/LessonNotes";
import DiscussionPanel from "@/components/DiscussionPanel";
import PomodoroTimer from "@/components/PomodoroTimer";
import CTFChallengeBox from "@/components/CTFChallengeBox";
import LabTerminal from "@/components/LabTerminal";
import { getYouTubeEmbed } from "@/lib/video";

export const revalidate = 0;

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const lessons = getLessons(course.id);
  const lesson = getLesson(lessonId);
  if (!lesson || lesson.courseId !== course.id) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasAccess(user.id, course)) redirect(`/checkout/${course.id}`);

  const html = await marked.parse(lesson.content || "");
  const embed = getYouTubeEmbed(lesson.videoUrl);

  const allLessons = getLessons(course.id);
  const idx = allLessons.findIndex((l) => l.id === lesson.id);
  const prev = allLessons[idx - 1];
  const next = allLessons[idx + 1];
  const completed = isLessonCompleted(user.id, lesson.id);
  const pct = getCompletionPercent(user.id, course.id);

  const modules = getModulesForCourse(course.id);
  const category = getCategoryById(course.categoryId);

  // Find which module this lesson belongs to
  const currentModule = modules.find((m) => m.id === lesson.moduleId);

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/courses" className="hover:text-indigo-600">Courses</Link>
          <span>›</span>
          <Link href={`/courses/${course.slug}`} className="hover:text-indigo-600">{course.title}</Link>
          {currentModule && (
            <>
              <span>›</span>
              <span className="text-slate-400">{currentModule.title}</span>
            </>
          )}
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-indigo-100 px-2 py-0.5 font-medium text-indigo-700">
                Lesson {idx + 1} of {allLessons.length}
              </span>
              {lesson.preview && (
                <span className="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                  Free Preview
                </span>
              )}
              <span className="text-slate-400">⏱ {lesson.duration}m</span>
            </div>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">{lesson.title}</h1>

            {/* Quiz or Video player */}
            {lesson.type === "quiz" ? (
              <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
                <QuizPlayer
                  lessonId={lesson.id}
                  courseId={course.id}
                  lessonTitle={lesson.title}
                  userRole={user.role}
                />
              </div>
            ) : (
              <>
                <InteractiveVideoPlayer
                  videoUrl={lesson.videoUrl}
                  title={lesson.title}
                  chapters={[]}
                  videoQuizzes={[]}
                  transcript={[]}
                />

                {/* Content */}
                {html && (
                  <article
                    className="lesson-content mt-8 rounded-2xl bg-white p-6 shadow-sm"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                )}
              </>
            )}

            {/* CTF Challenges — shown for "ctf" type lessons, or any lesson that has challenges */}
            <CTFChallengeBox lessonId={lesson.id} />

            {/* Interactive Lab Terminal — shown for "lab" type lessons */}
            <LabTerminal lessonId={lesson.id} />

            {/* Navigation + Complete */}
            <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              {prev ? (
                <Link
                  href={`/courses/${course.slug}/chapters/${prev.id}`}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-white"
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}

              <CompleteButton lessonId={lesson.id} initiallyCompleted={completed} />

              {next ? (
                <Link
                  href={`/courses/${course.slug}/chapters/${next.id}`}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  Next →
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  ✓ Back to Dashboard
                </Link>
              )}
            </div>

            {/* Lesson Notes */}
            <div className="mt-8">
              <LessonNotes userId={user.id} courseId={course.id} lessonId={lesson.id} />
            </div>

            {/* Discussion */}
            <div className="mt-6">
              <DiscussionPanel courseId={course.id} lessonId={lesson.id} userId={user.id} userRole={user.role} userName={user.name} />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Your Progress</span>
                  <span className="font-bold text-indigo-600">{pct}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Curriculum */}
              <h3 className="text-sm font-bold text-slate-900">📚 Course Curriculum</h3>
              <div className="mt-3 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {modules.map((mod, mi) => {
                  const modLessons = getLessonsForModule(mod.id);
                  const isCurrentModule = mod.id === lesson.moduleId;
                  return (
                    <div key={mod.id}>
                      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                        isCurrentModule ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
                      }`}>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs">
                          {mi + 1}
                        </span>
                        {mod.title}
                      </div>
                      <div className="ml-7 mt-1 space-y-0.5">
                        {modLessons.map((l, li) => {
                          const isCurrent = l.id === lesson.id;
                          const isDone = isLessonCompleted(user.id, l.id);
                          return (
                            <Link
                              key={l.id}
                              href={`/courses/${course.slug}/chapters/${l.id}`}
                              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition ${
                                isCurrent
                                  ? "bg-indigo-100 font-medium text-indigo-700"
                                  : "text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <span>
                                {isDone ? "✅" : isCurrent ? "▶️" : l.type === "video" ? "🎬" : "📄"}
                              </span>
                              <span className="line-clamp-1">{mi + 1}.{li + 1} {l.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {modules.length === 0 && allLessons.length > 0 && (
                  <div className="space-y-0.5">
                    {allLessons.map((l, i) => {
                      const isCurrent = l.id === lesson.id;
                      const isDone = isLessonCompleted(user.id, l.id);
                      return (
                        <Link
                          key={l.id}
                          href={`/courses/${course.slug}/chapters/${l.id}`}
                          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition ${
                            isCurrent ? "bg-indigo-100 font-medium text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span>{isDone ? "✅" : isCurrent ? "▶️" : "📄"}</span>
                          <span className="line-clamp-1">{l.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Course link */}
              <Link
                href={`/courses/${course.slug}`}
                className="mt-4 block rounded-lg border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                View Course Details →
              </Link>

              {/* Pomodoro Timer */}
              <div className="mt-4">
                <PomodoroTimer courseId={course.id} lessonId={lesson.id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Tutor — floating chat widget */}
      {user && <AITutor courseId={course.id} courseTitle={course.title} lessonTitle={lesson.title} />}
    </div>
  );
}
