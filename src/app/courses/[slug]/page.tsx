import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCourseBySlug,
  formatPrice,
  hasAccess,
  getLessons,
  getRelatedCourses,
} from "@/lib/courses";
import {
  getModulesForCourse,
  getLessonsForModule,
  getLessonsForCourse,
  getCategoryById,
  getInstructor,
  getReviewsForCourse,
  getAverageRating,
  getCompletionPercent,
  getFinalExamForCourse,
  hasPassedFinalExam,
} from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { buildCourseCardData } from "@/lib/courseData";

export const revalidate = 0;

function Stars({ rating, size = "text-sm" }: { rating: number; size?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "text-amber-400" : "text-slate-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const modules = getModulesForCourse(course.id);
  const allLessons = getLessonsForCourse(course.id);
  const user = await getCurrentUser();
  const access = user ? hasAccess(user.id, course) : course.price === 0;
  const category = getCategoryById(course.categoryId);
  const instructor = course.instructorId ? getInstructor(course.instructorId) : undefined;
  const reviews = getReviewsForCourse(course.id);
  const avgRating = getAverageRating(course.id);
  const totalDuration = allLessons.reduce((s, l) => s + (l.duration || 0), 0);
  const progress = user ? getCompletionPercent(user.id, course.id) : 0;

  const firstLesson = allLessons[0];

  // Related courses (same category, excluding current)
  const relatedCourses = getRelatedCourses(course.id, course.categoryId, 3).map(buildCourseCardData);

  return (
    <div className="bg-slate-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {/* Left: Course info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <Link href="/courses" className="text-indigo-300 hover:text-white">Courses</Link>
                <span className="text-slate-500">/</span>
                <span className="text-indigo-300">{category?.name || "Other"}</span>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{course.title}</h1>
              <p className="mt-4 max-w-2xl text-slate-300">{course.description}</p>

              {/* Meta row */}
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
                {avgRating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-400">★ {avgRating.toFixed(1)}</span>
                    <span className="text-slate-400">({reviews.length} reviews)</span>
                  </span>
                )}
                <span className="text-slate-400">👥 {allLessons.length} lessons</span>
                <span className="text-slate-400">⏱ {formatDuration(totalDuration)}</span>
                <span className="rounded-full bg-indigo-500/30 px-2.5 py-0.5 text-xs font-medium text-indigo-200">
                  {course.level}
                </span>
                <span className="text-slate-400">🌐 {course.language}</span>
              </div>

              {/* Instructor */}
              {instructor && (
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                    {instructor.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{instructor.name}</div>
                    <div className="text-xs text-slate-400">{instructor.title || "Instructor"}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Sidebar card (desktop) */}
            <div className="hidden w-80 shrink-0 lg:block">
              <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
                <div className="text-3xl font-bold">
                  {formatPrice(course.price)}
                </div>
                {course.price === 0 ? (
                  <p className="mt-1 text-sm text-emerald-600">100% Free — no payment needed</p>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">One-time payment · Lifetime access</p>
                )}

                {access ? (
                  <Link
                    href={firstLesson ? `/courses/${course.slug}/chapters/${firstLesson.id}` : "#"}
                    className="mt-4 block rounded-xl bg-emerald-500 px-6 py-3 text-center font-semibold text-white transition hover:bg-emerald-600"
                  >
                    {progress > 0 ? `Continue Learning (${progress}%)` : "Start Course →"}
                  </Link>
                ) : course.price === 0 ? (
                  <Link
                    href={user ? (firstLesson ? `/courses/${course.slug}/chapters/${firstLesson.id}` : "#") : "/register"}
                    className="mt-4 block rounded-xl bg-emerald-500 px-6 py-3 text-center font-semibold text-white transition hover:bg-emerald-600"
                  >
                    {user ? "Start Free Course →" : "Register to Start Free →"}
                  </Link>
                ) : (
                  <Link
                    href={`/checkout/${course.id}`}
                    className="mt-4 block rounded-xl bg-indigo-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Enroll Now →
                  </Link>
                )}

                <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <div className="flex justify-between"><span>📚 Lessons</span><span className="font-medium">{allLessons.length}</span></div>
                  <div className="flex justify-between"><span>⏱ Duration</span><span className="font-medium">{formatDuration(totalDuration)}</span></div>
                  <div className="flex justify-between"><span>📊 Level</span><span className="font-medium">{course.level}</span></div>
                  <div className="flex justify-between"><span>🌐 Language</span><span className="font-medium">{course.language}</span></div>
                  <div className="flex justify-between"><span>🏆 Certificate</span><span className="font-medium">Yes</span></div>
                </div>

                {/* Final Exam button (enrolled students who completed 100%) */}
                {access && progress === 100 && getFinalExamForCourse(course.id) && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    {hasPassedFinalExam(user!.id, course.id) ? (
                      <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
                        <span className="text-sm font-semibold text-green-700">✅ Final Exam Passed</span>
                      </div>
                    ) : (
                      <Link
                        href={`/courses/${course.slug}/exam`}
                        className="block rounded-xl bg-amber-500 px-6 py-3 text-center font-bold text-white transition hover:bg-amber-600"
                      >
                        📋 Take Final Exam
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile CTA bar */}
      <div className="sticky top-0 z-30 bg-white shadow-sm lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-xl font-bold text-slate-900">{formatPrice(course.price)}</span>
          {access ? (
            <Link
              href={firstLesson ? `/courses/${course.slug}/chapters/${firstLesson.id}` : "#"}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-white"
            >
              {progress > 0 ? `Continue (${progress}%)` : "Start →"}
            </Link>
          ) : course.price === 0 ? (
            <Link
              href={user ? (firstLesson ? `/courses/${course.slug}/chapters/${firstLesson.id}` : "#") : "/register"}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-white"
            >
              {user ? "Start Free →" : "Register →"}
            </Link>
          ) : (
            <Link
              href={`/checkout/${course.id}`}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white"
            >
              Enroll →
            </Link>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: modules + reviews */}
          <div className="lg:col-span-2">
            {/* About */}
            <h2 className="text-xl font-bold text-slate-900">About this course</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">{course.description}</p>

            {/* What you'll learn */}
            <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
              <h3 className="font-bold text-slate-900">🎯 What you'll learn</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                {allLessons.slice(0, 6).map((l) => (
                  <li key={l.id} className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>{l.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Course content - modules */}
            <h2 className="mt-10 text-xl font-bold text-slate-900">Course content</h2>
            <p className="mt-1 text-sm text-slate-500">
              {modules.length} {modules.length === 1 ? "module" : "modules"} · {allLessons.length} lessons · {formatDuration(totalDuration)}
            </p>

            <div className="mt-4 space-y-3">
              {modules.map((mod, mi) => {
                const modLessons = getLessonsForModule(mod.id);
                const modDuration = modLessons.reduce((s, l) => s + (l.duration || 0), 0);
                return (
                  <div key={mod.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between bg-slate-50 px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                          {mi + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{mod.title}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {modLessons.length} lessons · {formatDuration(modDuration)}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {modLessons.map((lesson, li) => {
                        const canAccess = access || lesson.preview;
                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between px-5 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400">
                                {lesson.type === "video" ? "▶️" : lesson.type === "quiz" ? "❓" : "📄"}
                              </span>
                              <div>
                                <div className="text-sm font-medium text-slate-700">
                                  {mi + 1}.{li + 1} {lesson.title}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {lesson.duration}m{lesson.preview && !access ? " · Preview" : ""}
                                </div>
                              </div>
                            </div>
                            {canAccess ? (
                              <Link
                                href={`/courses/${course.slug}/chapters/${lesson.id}`}
                                className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                              >
                                {access ? "View" : "Preview"}
                              </Link>
                            ) : (
                              <span className="text-slate-300">🔒</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {modules.length === 0 && allLessons.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">
                    Lessons are being organized into modules. Check back soon!
                  </p>
                </div>
              )}
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-bold text-slate-900">Student Reviews</h2>
                <div className="mt-3 flex items-center gap-4">
                  <div className="text-4xl font-bold text-slate-900">{avgRating.toFixed(1)}</div>
                  <div>
                    <Stars rating={avgRating} size="text-lg" />
                    <div className="text-sm text-slate-500">{reviews.length} reviews</div>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {reviews.map((rev) => {
                    const revUser = getInstructor(rev.userId);
                    return (
                      <div key={rev.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                            {revUser?.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-800">{revUser?.name || "Anonymous"}</div>
                            <Stars rating={rev.rating} size="text-xs" />
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">{rev.comment}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar (mobile shows below, desktop shows sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Instructor card */}
              {instructor && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900">👨‍🏫 Instructor</h3>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
                      {instructor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{instructor.name}</div>
                      <div className="text-sm text-slate-500">{instructor.title || "Instructor"}</div>
                    </div>
                  </div>
                  {instructor.bio && (
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{instructor.bio}</p>
                  )}
                </div>
              )}

              {/* Related courses */}
              {relatedCourses.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900">Related Courses</h3>
                  <div className="mt-3 space-y-3">
                    {relatedCourses.map((rc) => (
                      <Link
                        key={rc.id}
                        href={`/courses/${rc.slug}`}
                        className="block rounded-lg p-2 transition hover:bg-slate-50"
                      >
                        <div className="text-sm font-medium text-slate-800 hover:text-indigo-600">{rc.title}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {rc.categoryIcon} {rc.categoryName} · {rc.lessonCount} lessons
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
