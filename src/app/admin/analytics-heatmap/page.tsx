"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type QuestionStat = {
  questionId: string;
  questionText: string;
  totalAttempts: number;
  correctCount: number;
  failRate: number;
  courseId: string;
};

export default function HeatmapPage() {
  const [stats, setStats] = useState<QuestionStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/question-stats")
      .then((r) => r.json())
      .then((d) => setStats(d.all || []))
      .finally(() => setLoading(false));
  }, []);

  function getHeatColor(failRate: number): string {
    if (failRate >= 70) return "bg-red-500 text-white";
    if (failRate >= 50) return "bg-orange-400 text-white";
    if (failRate >= 30) return "bg-amber-300";
    if (failRate >= 10) return "bg-green-200";
    return "bg-green-100";
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/admin" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">← Admin Dashboard</Link>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">🔥 Question Difficulty Heatmap</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Identify which questions students struggle with most. Red = 70%+ fail rate (review needed).
      </p>

      {/* Legend */}
      <div className="mt-4 flex gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="h-4 w-8 rounded bg-red-500"></span> 70%+ fail</span>
        <span className="flex items-center gap-1"><span className="h-4 w-8 rounded bg-orange-400"></span> 50-69%</span>
        <span className="flex items-center gap-1"><span className="h-4 w-8 rounded bg-amber-300"></span> 30-49%</span>
        <span className="flex items-center gap-1"><span className="h-4 w-8 rounded bg-green-200"></span> 10-29%</span>
        <span className="flex items-center gap-1"><span className="h-4 w-8 rounded bg-green-100"></span> &lt;10%</span>
      </div>

      {loading ? (
        <div className="mt-8 text-center text-slate-400">Loading...</div>
      ) : stats.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <div className="text-5xl">📊</div>
          <h3 className="mt-3 text-lg font-semibold text-slate-700 dark:text-slate-100">No quiz data yet</h3>
          <p className="mt-1 text-sm text-slate-500">Question stats will appear once students start taking quizzes.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {stats.map((s) => (
            <div key={s.questionId} className={`rounded-lg p-4 ${getHeatColor(s.failRate)}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2">{s.questionText}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {s.totalAttempts} attempts · {s.correctCount} correct · {s.failRate}% fail rate
                  </p>
                </div>
                <span className="text-2xl font-bold">{s.failRate}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
