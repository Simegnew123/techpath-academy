import Link from "next/link";
import CourseCard from "@/components/CourseCard";
import { getCourses } from "@/lib/courses";
import { CATEGORIES } from "@/lib/categories";
import { buildCourseCardData } from "@/lib/courseData";
import { getLessonsForCourse, readDB } from "@/lib/store";

export const revalidate = 60;

export default function HomePage() {
  const courses = getCourses();
  const published = courses.filter((c) => c.published);
  const allCardData = published.map(buildCourseCardData);

  const free = allCardData.filter((c) => c.price === 0).slice(0, 3);
  const paid = allCardData.filter((c) => c.price > 0).slice(0, 6);
  const featured = [...allCardData]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const totalLessons = published.reduce(
    (sum, c) => sum + getLessonsForCourse(c.id).length, 0
  );
  const db = readDB();
  const totalStudents = db.enrollments.length;
  const totalReviews = db.reviews.length;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-indigo-100 backdrop-blur">
            🎓 TechPath Academy — IT Skills Training
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Launch Your IT Career. 🚀
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-indigo-100 sm:text-xl">
            Hands-on training in IT Support, Networking, Database Administration,
            Cyber Security, Ethical Hacking & Artificial Intelligence — from beginner to job-ready.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/courses"
              className="rounded-xl bg-white px-7 py-3.5 font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50 hover:shadow-xl"
            >
              Browse Courses
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-white/30 px-7 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Start Learning Free
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">{published.length}+</div>
              <div className="text-sm text-indigo-200">Courses</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{totalLessons}+</div>
              <div className="text-sm text-indigo-200">Lessons</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{totalStudents}+</div>
              <div className="text-sm text-indigo-200">Students Enrolled</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{CATEGORIES.length - 1}</div>
              <div className="text-sm text-indigo-200">Career Paths</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Explore by Career Path</h2>
          <p className="mt-2 text-slate-500">Choose your path and start building real-world skills</p>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.filter((c) => c.slug !== "other").map((cat) => {
            const count = published.filter((c) => {
              const cd = buildCourseCardData(c);
              return cd.categoryName === cat.name;
            }).length;
            return (
              <Link
                key={cat.id}
                href={`/courses?category=${encodeURIComponent(cat.slug)}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <div className="text-4xl transition group-hover:scale-110">{cat.icon}</div>
                <div className="mt-3 text-sm font-bold text-slate-800">{cat.name}</div>
                <div className="mt-1 text-xs text-slate-400">{count} {count === 1 ? "course" : "courses"}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Courses */}
      {featured.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">⭐ Top Rated Courses</h2>
                <p className="mt-2 text-slate-500">Most loved by our students</p>
              </div>
              <Link href="/courses" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View all →
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Free tutorials */}
      <section id="free-tutorials" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Free Tutorials</h2>
              <p className="mt-2 text-slate-500">Start learning right now — no payment needed</p>
            </div>
            <Link
              href="/courses"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {free.length > 0 ? (
              free.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))
            ) : (
              <p className="text-slate-400">No free courses yet — check back soon!</p>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Why Choose TechPath Academy?</h2>
            <p className="mt-2 text-slate-500">We're committed to your success</p>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "🎯", title: "Practical Skills", desc: "Learn by doing with real-world examples and hands-on exercises." },
              { icon: "📱", title: "Learn Anywhere", desc: "Access courses on any device — mobile, tablet, or desktop." },
              { icon: "🏆", title: "Certificates", desc: "Earn verifiable certificates upon course completion." },
              { icon: "💬", title: "Community", desc: "Join a growing community of IT learners and professionals." },
            ].map((f) => (
              <div key={f.title} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to Start Your IT Journey?</h2>
          <p className="mt-4 text-indigo-100">
            Join TechPath Academy today and take the first step toward a rewarding IT career.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-white px-7 py-3.5 font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
            >
              Create Free Account
            </Link>
            <Link
              href="/courses"
              className="rounded-xl border border-white/30 px-7 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
