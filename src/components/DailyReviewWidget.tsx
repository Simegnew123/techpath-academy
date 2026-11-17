"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type SRSStats = {
  totalCards: number;
  dueToday: number;
  mastered: number;
};

export default function DailyReviewWidget() {
  const [stats, setStats] = useState<SRSStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/flashcards/srs-stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStats(d.stats); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-20 animate-pulse rounded bg-slate-100 dark:bg-slate-700/50" />
      </div>
    );
  }

  if (!stats || stats.totalCards === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">🧠 Spaced Repetition</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Start studying flashcards to build your daily review queue. Cards you've studied will reappear at optimal intervals to lock knowledge into long-term memory.
        </p>
        <Link
          href="/flashcards"
          className="mt-3 inline-block rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300"
        >
          Browse Flashcard Decks →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 dark:border-indigo-800 dark:from-slate-800 dark:to-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">🧠 Daily Review</h3>
        {stats.dueToday > 0 && (
          <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white animate-pulse">
            {stats.dueToday} due
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-white/70 p-3 text-center dark:bg-slate-700/50">
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.dueToday}</p>
          <p className="text-xs text-slate-500">Due Today</p>
        </div>
        <div className="rounded-lg bg-white/70 p-3 text-center dark:bg-slate-700/50">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.mastered}</p>
          <p className="text-xs text-slate-500">Mastered</p>
        </div>
        <div className="rounded-lg bg-white/70 p-3 text-center dark:bg-slate-700/50">
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.totalCards}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
      </div>

      {stats.dueToday > 0 ? (
        <Link
          href="/flashcards/review"
          className="mt-4 block rounded-xl bg-indigo-600 py-2.5 text-center font-semibold text-white transition hover:bg-indigo-700"
        >
          Start Daily Review ({stats.dueToday} cards) →
        </Link>
      ) : (
        <p className="mt-4 text-center text-sm text-slate-500">
          ✅ All caught up! Come back tomorrow for more reviews.
        </p>
      )}
    </div>
  );
}
