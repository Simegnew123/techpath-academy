import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCourseById, getEnrollments, getLessons, countCompleted, formatPrice } from "@/lib/courses";
import {
  readDB,
  getCategoryById,
  getCompletionPercent,
  getCertificate,
  getExpiringCertificates,
  getExpiredCertificates,
} from "@/lib/store";
import { buildCourseCardData } from "@/lib/courseData";

export const revalidate = 0;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string; pending?: string; course?: string; ref?: string; method?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = readDB();
  const enrollments = getEnrollments(user.id);

  // Pending manual payments (Telebirr, CBE) awaiting verification
  const pendingPayments = db.payments.filter(
    (p) => p.userId === user.id && p.status === "pending"
  );

  // Courses the user has access to (paid enrollments + free courses with progress)
  const paidCourses = enrollments
    .map((e) => getCourseById(e.courseId))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const progressCourseIds = new Set(
    db.progress
      .filter((p) => p.userId === user.id)
      .map((p) => db.lessons.find((l) => l.id === p.lessonId)?.courseId)
      .filter((id): id is string => !!id)
  );
  const freeWithProgress = db.courses
    .filter((c) => c.price === 0 && progressCourseIds.has(c.id))
    .filter((c) => !paidCourses.some((pc) => pc.id === c.id));

  const myCourses = [...paidCourses, ...freeWithProgress];

  // Certificates
  const myCertificates = db.certificates.filter((c) => c.userId === user.id);
  const completedCount = myCourses.filter(
    (c) => getCompletionPercent(user.id, c.id) === 100
  ).length;

  // Recertification status
  const expiringCerts = getExpiringCertificates(30).filter((c) => c.userId === user.id);
  const expiredCerts = getExpiredCertificates().filter((c) => c.userId === user.id);
  const now = new Date();

  // Stats
  const totalLessons = myCourses.reduce(
    (s, c) => s + getLessons(c.id).length, 0
  );
  const completedLessons = myCourses.reduce(
    (s, c) => s + countCompleted(user.id, c.id), 0
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Learning</h1>
          <p className="mt-1 text-slate-500">Welcome back, {user.name}! 👋</p>
        </div>
        <Link
          href="/courses"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Browse Courses
        </Link>
      </div>

      {/* Pending payment banner (Telebirr / CBE) */}
      {sp.pending === "1" && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <h3 className="text-lg font-semibold text-amber-900">⏳ Payment Verification in Progress</h3>
          <p className="mt-2 text-sm text-amber-800">
            Thank you! Your {sp.method === "telebirr" ? "Telebirr" : sp.method === "cbe" ? "CBE" : "manual"}{" "}
            payment reference is <span className="font-mono font-bold">{sp.ref}</span>.
            We&apos;re confirming your payment — your course will be unlocked as soon as it&apos;s verified
            (usually within a few minutes).
          </p>
        </div>
      )}

      {/* Pending payments list */}
      {pendingPayments.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
          <h3 className="font-semibold text-amber-900">Pending Payments ({pendingPayments.length})</h3>
          <div className="mt-3 space-y-2">
            {pendingPayments.map((p) => {
              const c = getCourseById(p.courseId);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm">
                  <span className="font-medium text-slate-700">{c?.title || "Course"}</span>
                  <span className="font-mono text-xs text-amber-700">
                    {p.method} · {p.ref} · {formatPrice(p.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-3xl">📚</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{myCourses.length}</div>
          <div className="text-sm text-slate-500">Enrolled</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-3xl">✅</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{completedCount}</div>
          <div className="text-sm text-slate-500">Completed</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-3xl">🏆</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{myCertificates.length}</div>
          <div className="text-sm text-slate-500">Certificates</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-3xl">📖</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{completedLessons}/{totalLessons}</div>
          <div className="text-sm text-slate-500">Lessons Done</div>
        </div>
      </div>

      {/* My Courses */}
      {myCourses.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="text-4xl">📚</div>
          <h2 className="mt-3 text-lg font-semibold text-slate-800">
            You haven&apos;t started any course yet
          </h2>
          <p className="mt-1 text-slate-500">
            Browse the catalog and pick your first course — many are free!
          </p>
          <Link
            href="/courses"
            className="mt-5 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700"
          >
            Browse courses
          </Link>
        </div>
      ) : (
        <>
          <h2 className="mt-10 text-xl font-bold text-slate-900">Continue Learning</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((course) => {
              const lessons = getLessons(course.id);
              const done = countCompleted(user.id, course.id);
              const pct = getCompletionPercent(user.id, course.id);
              const cat = getCategoryById(course.categoryId);
              const cert = getCertificate(user.id, course.id);
              const firstLesson = lessons[0];
              const lastCompleted = lessons
                .filter(l => db.progress.some(p => p.userId === user.id && p.lessonId === l.id))
                .pop();

              return (
                <div
                  key={course.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-indigo-600">
                      {cat?.icon} {cat?.name || "Other"}
                    </span>
                    {pct === 100 ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        ✓ Completed
                      </span>
                    ) : pct > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        In Progress
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        Not Started
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-bold text-slate-900">{course.title}</h3>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{done}/{lessons.length} lessons</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct === 100 ? "bg-emerald-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-1 items-end gap-2">
                    {pct < 100 ? (
                      <Link
                        href={
                          firstLesson
                            ? `/courses/${course.slug}/chapters/${
                                lastCompleted && lessons[lessons.indexOf(lastCompleted) + 1]
                                  ? lessons[lessons.indexOf(lastCompleted) + 1].id
                                  : firstLesson.id
                              }`
                            : `/courses/${course.slug}`
                        }
                        className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        {pct > 0 ? "Continue →" : "Start →"}
                      </Link>
                    ) : cert ? (
                      <Link
                        href={`/certificates/${cert.code}`}
                        className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-amber-600"
                      >
                        🏆 View Certificate
                      </Link>
                    ) : (
                      <Link
                        href={`/courses/${course.slug}`}
                        className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-600"
                      >
                        View Course
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Recertification alerts */}
      {(expiringCerts.length > 0 || expiredCerts.length > 0) && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">Recertification Status ⏰</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Expiring soon */}
            {expiringCerts.map((cert) => {
              const course = getCourseById(cert.courseId);
              if (!course) return null;
              const daysLeft = Math.ceil((new Date(cert.expiresAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={cert.id} className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⏰</span>
                    <h3 className="font-bold text-amber-900">Expiring Soon</h3>
                  </div>
                  <p className="mt-2 text-sm text-amber-800">
                    Your certificate for <strong>{course.title}</strong> expires in <strong>{daysLeft} days</strong>.
                  </p>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                  >
                    Renew Now →
                  </Link>
                </div>
              );
            })}
            {/* Already expired */}
            {expiredCerts.map((cert) => {
              const course = getCourseById(cert.courseId);
              if (!course) return null;
              return (
                <div key={cert.id} className="rounded-2xl border border-red-300 bg-red-50 p-5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔴</span>
                    <h3 className="font-bold text-red-900">Expired</h3>
                  </div>
                  <p className="mt-2 text-sm text-red-800">
                    Your certificate for <strong>{course.title}</strong> has expired.
                    Re-enroll to renew your certification.
                  </p>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="mt-3 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Re-enroll →
                  </Link>
    {/* end of recertification block */}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certificates */}
      {myCertificates.length > 0 && (
        <>
          <h2 className="mt-12 text-xl font-bold text-slate-900">My Certificates 🏆</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myCertificates.map((cert) => {
              const course = getCourseById(cert.courseId);
              if (!course) return null;
              return (
                <Link
                  key={cert.id}
                  href={`/certificates/${cert.code}`}
                  className="group rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm transition hover:border-amber-400 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-3xl">🏆</div>
                    <span className="text-xs font-mono text-amber-600">{cert.code}</span>
                  </div>
                  <h3 className="mt-3 font-bold text-slate-900 group-hover:text-amber-700">
                    {course.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Issued on {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                  </p>
                  <div className="mt-3 text-sm font-medium text-amber-600 group-hover:text-amber-700">
                    View Certificate →
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
