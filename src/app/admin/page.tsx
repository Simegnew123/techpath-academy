import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCourses, getLessons, formatPrice } from "@/lib/courses";
import {
  readDB,
  getCategoryById,
  getModulesForCourse,
  getReviewsForCourse,
  getAverageRating,
} from "@/lib/store";

export const revalidate = 0;

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "instructor") redirect("/");

  const db = readDB();
  const allCourses = getCourses();
  // Instructors see only their own courses; admins see all
  const courses =
    user.role === "admin"
      ? allCourses
      : allCourses.filter((c) => c.instructorId === user.id);

  // Stats
  const publishedCount = courses.filter((c) => c.published).length;
  const totalLessons = courses.reduce(
    (s, c) => s + getLessons(c.id).length, 0
  );
  const totalEnrollments = db.enrollments.filter((e) =>
    courses.some((c) => c.id === e.courseId)
  ).length;
  const totalRevenue = db.payments
    .filter((p) => p.status === "paid" && courses.some((c) => c.id === p.courseId))
    .reduce((s, p) => s + p.amount, 0);
  const totalReviews = courses.reduce(
    (s, c) => s + getReviewsForCourse(c.id).length, 0
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {user.role === "admin" ? "Admin Dashboard" : "Instructor Dashboard"}
          </h1>
          <p className="mt-1 text-slate-500">
            {user.role === "admin"
              ? "Manage all courses, students, and platform settings."
              : "Manage your courses and training content."}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/books"
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            📚 Manage Books
          </Link>
          <Link
            href="/admin/new"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
          >
            + New Course
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-2xl">📚</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{courses.length}</div>
          <div className="text-xs text-slate-500">Total Courses</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-2xl">✅</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{publishedCount}</div>
          <div className="text-xs text-slate-500">Published</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-2xl">📖</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{totalLessons}</div>
          <div className="text-xs text-slate-500">Lessons</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-2xl">👥</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{totalEnrollments}</div>
          <div className="text-xs text-slate-500">Enrollments</div>
        </div>
        {user.role === "admin" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-2xl">💰</div>
            <div className="mt-1 text-xl font-bold text-slate-900">
              {formatPrice(totalRevenue)}
            </div>
            <div className="text-xs text-slate-500">Revenue</div>
          </div>
        )}
      </div>

      {/* Courses table */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900">Courses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Modules</th>
                <th className="px-5 py-3">Lessons</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => {
                const cat = getCategoryById(c.categoryId);
                const modules = getModulesForCourse(c.id);
                const lessons = getLessons(c.id);
                const rating = getAverageRating(c.id);
                const reviewCount = getReviewsForCourse(c.id).length;
                const enrollCount = db.enrollments.filter(
                  (e) => e.courseId === c.id
                ).length;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{c.title}</div>
                      <div className="text-xs text-slate-400">{enrollCount} enrolled</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {cat?.icon} {cat?.name || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.level}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.price === 0 ? (
                        <span className="text-emerald-600 font-medium">Free</span>
                      ) : (
                        formatPrice(c.price)
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{modules.length}</td>
                    <td className="px-5 py-3 text-slate-600">{lessons.length}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {rating > 0 ? (
                        <span className="text-amber-500">★ {rating.toFixed(1)}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                      {reviewCount > 0 && (
                        <span className="ml-1 text-xs text-slate-400">({reviewCount})</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {c.published ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          Published
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/edit/${c.id}`}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    <div className="text-3xl">📝</div>
                    <p className="mt-2">No courses yet — click &quot;+ New Course&quot; to create your first one!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
