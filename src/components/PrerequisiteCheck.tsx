"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Prerequisite = {
  id: string;
  title: string;
  level: string;
};

type Props = {
  courseId: string;
};

/**
 * Fetches prerequisite status from the API and displays a warning
 * if the user hasn't completed required prerequisite courses.
 */
export default function PrerequisiteCheck({ courseId }: Props) {
  const [data, setData] = useState<{
    met: boolean;
    prerequisites: Prerequisite[];
    missing: Prerequisite[];
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/prerequisites?courseId=${courseId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [courseId]);

  if (loading || !data) return null;

  // No prerequisites — don't show anything
  if (data.prerequisites.length === 0) return null;

  // All met — show a small confirmation
  if (data.met) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        <span>Prerequisites completed — you're ready to enroll!</span>
      </div>
    );
  }

  // Prerequisites not met — show warning with links
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
            Prerequisites Required
          </h4>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-500">
            Complete these course{data.missing.length > 1 ? "s" : ""} before enrolling:
          </p>
          <ul className="mt-2 space-y-1.5">
            {data.missing.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/courses/${p.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-amber-800 shadow-sm transition hover:bg-amber-100 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700"
                >
                  <span>🔒</span>
                  <span>{p.title}</span>
                  <span className="text-xs text-amber-500">({p.level})</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
