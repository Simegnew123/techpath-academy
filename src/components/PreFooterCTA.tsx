"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PreFooterCTA() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.user))
      .catch(() => setLoggedIn(false));
  }, []);

  if (loggedIn) {
    return (
      <section className="border-t border-slate-200 py-16 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Continue your lab progress
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Pick up where you left off — your courses, flashcards, and the virtual lab are ready.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              Go to My Learning
            </Link>
            <Link
              href="/#terminal"
              className="rounded-xl border border-slate-300 px-7 py-3.5 font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-200"
            >
              Launch Virtual Lab
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
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
  );
}
