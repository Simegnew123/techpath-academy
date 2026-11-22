"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HeroCTA() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.user))
      .catch(() => setLoggedIn(false));
  }, []);

  if (loggedIn) {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
        >
          Resume Learning
        </Link>
        <Link
          href="/courses"
          className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-indigo-500"
        >
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
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
  );
}
