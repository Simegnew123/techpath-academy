import Link from "next/link";
import CourseCard from "@/components/CourseCard";
import TerminalDemo from "@/components/TerminalDemo";
import CareerPathSelector from "@/components/CareerPathSelector";
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
  const featured = [...allCardData].sort((a, b) => b.rating - a.rating).slice(0, 3);

  const totalLessons = published.reduce(
    (sum, c) => sum + getLessonsForCourse(c.id).length, 0
  );
  const db = readDB();
  const totalQuizzes = db.quizzes.length;
  const totalCertificates = db.certificates.length;
  const totalStudents = db.enrollments.length;
  const careerPaths = CATEGORIES.filter((c) => c.slug !== "other").length;

  // Real, verifiable specs — never show 0+
  const specs = [
    { value: `${careerPaths}`, label: "Career Tracks" },
    { value: `${published.length}`, label: "Published Courses" },
    { value: `${totalLessons}`, label: "Lessons & Labs" },
    { value: totalQuizzes > 0 ? `${totalQuizzes}` : "Auto-graded", label: "Quizzes" },
  ];

  return (
    <div>
      {/* ===============================================
          HERO — asymmetric split-screen
          Left: headline + value prop + CTAs + specs
          Right: interactive terminal demo
          =============================================== */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        {/* Subtle background accent — no full-bleed gradient */}
        <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/4 translate-x-1/4 rounded-full bg-indigo-50 dark:bg-indigo-950/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          {/* Left column */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Lab-based IT training — built for the real world
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
              Master real-world network engineering,
              <span className="text-indigo-600 dark:text-indigo-400"> Linux security</span>, and
              <span className="text-indigo-600 dark:text-indigo-400"> cloud infrastructure</span> through guided, lab-based training.
            </h1>

            <p className="mt-5 max-w-lg text-lg text-slate-600 dark:text-slate-400">
              No fluff, no theory-only lectures. Every course is built around hands-on labs,
              real command-line exercises, and verifiable certifications.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                Browse Courses
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-indigo-500"
              >
                Try a Free Lesson
              </Link>
            </div>

            {/* Specs — concrete, verifiable */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {specs.map((s) => (
                <div key={s.label}>
                  <div className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — interactive terminal */}
          <div className="relative">
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 15.5v-11z M5 6.25a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 015 6.25z" />
              </svg>
              <span className="font-medium">Try the virtual lab — type a command below</span>
            </div>
            <TerminalDemo />
            <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
              No sign-up needed. Start with <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">help</code> or try <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">nmap scanme.example.com</code>
            </p>
          </div>
        </div>
      </section>

      {/* ===============================================
          CAREER PATH SELECTOR — interactive
          =============================================== */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Choose Your Career Path</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Click a role to see the full curriculum roadmap, required tools, and estimated timeline.
          </p>
        </div>
        <div className="mt-8">
          <CareerPathSelector />
        </div>
      </section>

      {/* ===============================================
          FEATURED COURSES
          =============================================== */}
      {featured.length > 0 && (
        <section className="bg-slate-50 py-16 dark:bg-slate-950/50">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Top-Rated Courses</h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Most loved by our students</p>
              </div>
              <Link
                href="/courses"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
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

      {/* ===============================================
          FREE TUTORIALS
          =============================================== */}
      <section id="free-tutorials" className="bg-white py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Free Tutorials</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">Start learning right now — no account or payment needed</p>
            </div>
            <Link
              href="/courses"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View all →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {free.length > 0 ? (
              free.map((course) => <CourseCard key={course.id} course={course} />)
            ) : (
              <p className="text-slate-400 dark:text-slate-500">New free tutorials coming soon — check back!</p>
            )}
          </div>
        </div>
      </section>

      {/* ===============================================
          TRY BEFORE YOU SIGN UP — interactive previews
          =============================================== */}
      <section className="bg-slate-50 py-16 dark:bg-slate-950/50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Try Before You Sign Up</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Get a feel for the learning experience — no registration required
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <Link
              href="/placement"
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-600"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950">
                <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-slate-100">Skill Placement Quiz</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Answer 3 quick questions and we'll recommend the right starting point for your level.
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                Take the quiz →
              </span>
            </Link>

            <Link
              href="/flashcards"
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-600"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8l-4 4 4 4m6-8l4 4-4 4" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-slate-100">Flashcard Preview</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Flip through sample flashcards with spaced repetition — see how memory retention works.
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                Try flashcards →
              </span>
            </Link>

            <Link
              href="/search"
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-600"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-slate-100">Search Lessons</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Search across all courses, lessons, and books — find exactly what you need to learn.
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                Start searching →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===============================================
          WHY CHOOSE US — improved copy, no generic buzzwords
          =============================================== */}
      <section className="bg-white py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Built for how IT actually works</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Not another video-only platform</p>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Hands-On Labs",
                desc: "Every course includes command-line exercises and lab scenarios you'd encounter on the job — not just slides.",
                icon: (
                  <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                title: "Verifiable Certificates",
                desc: "Completion certificates are cryptographically signed with SHA-256 hashes and QR-code verification.",
                icon: (
                  <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
              },
              {
                title: "Learn Anywhere, Anytime",
                desc: "Mobile-friendly interface with dark mode, offline notes, bookmarks, and Pomodoro timer built in.",
                icon: (
                  <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                title: "Career-Track Roadmaps",
                desc: "Follow structured paths from beginner to job-ready, with skill matrices and progress tracking.",
                icon: (
                  <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                ),
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 p-6 dark:border-slate-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-bold text-slate-900 dark:text-slate-100">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===============================================
          CTA — clean, no gradient
          =============================================== */}
      <section className="border-t border-slate-200 py-16 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Ready to start building real IT skills?
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Create a free account and get instant access to tutorials, flashcards, and the virtual lab.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              Create Free Account
            </Link>
            <Link
              href="/courses"
              className="rounded-xl border border-slate-300 px-7 py-3.5 font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-200"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
