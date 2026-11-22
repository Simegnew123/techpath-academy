"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

type Analytics = {
  totalEnrolled: number;
  totalCompleted: number;
  completionRate: number;
  totalLessons: number;
  lessonStats: { lessonId: string; title: string; type: string; enrolled: number; completed: number; completionRate: number; dropOff: number }[];
  quizStats: { quizId: string; title: string; isFinalExam: boolean; totalAttempts: number; passed: number; passRate: number; avgScore: number }[];
  assignmentStats: { assignmentId: string; title: string; totalSubmissions: number; pending: number; graded: number }[];
  revenue: number;
};

type Course = { id: string; title: string; categoryId: string };

export default function AdminAnalyticsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        const published = (data.courses || data).filter((c: any) => c.published);
        setCourses(published);
        if (published.length > 0) setSelected(published[0].id);
      }
      setLoadingCourses(false);
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetch(`/api/analytics?courseId=${selected}`)
      .then(res => res.json())
      .then(data => setAnalytics(data.analytics))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Instructor Analytics</h1>
          <p className="text-slate-500">Student engagement, drop-off points, and quiz performance</p>
        </div>
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Back to Admin</Link>
      </div>

      {/* Course selector */}
      <div className="mb-6">
        {loadingCourses ? (
          <p className="text-sm text-slate-400">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-slate-400">No published courses found. Publish a course first to see analytics.</p>
        ) : (
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            aria-label="Select course for analytics"
          >
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-8">Loading analytics...</div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-indigo-50 p-4">
              <p className="text-xs text-indigo-600 font-medium">Enrolled</p>
              <p className="text-2xl font-bold text-indigo-900">{analytics.totalEnrolled}</p>
            </div>
            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-xs text-green-600 font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-900">{analytics.totalCompleted}</p>
              <p className="text-xs text-green-500">{analytics.completionRate}% rate</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs text-amber-600 font-medium">Revenue</p>
              <p className="text-2xl font-bold text-amber-900">KES {analytics.revenue.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-600 font-medium">Lessons</p>
              <p className="text-2xl font-bold text-slate-900">{analytics.totalLessons}</p>
            </div>
          </div>

          {/* Lesson completion / drop-off */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-bold text-slate-800">📖 Lesson Completion & Drop-off</h2>
            <div className="space-y-2">
              {analytics.lessonStats.map((ls, i) => (
                <div key={ls.lessonId} className="flex items-center gap-3">
                  <span className="w-6 text-xs text-slate-400">{i + 1}</span>
                  <span className="flex-1 text-sm text-slate-700">{ls.title}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${ls.completionRate >= 70 ? "bg-green-500" : ls.completionRate >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${ls.completionRate}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-slate-500">{ls.completionRate}%</span>
                    {ls.dropOff > 0 && <span className="text-xs text-red-400">↓{ls.dropOff}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz performance */}
          {analytics.quizStats.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 font-bold text-slate-800">❓ Quiz Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="text-left py-2">Quiz</th>
                      <th className="text-center py-2">Attempts</th>
                      <th className="text-center py-2">Passed</th>
                      <th className="text-center py-2">Pass Rate</th>
                      <th className="text-center py-2">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.quizStats.map(qs => (
                      <tr key={qs.quizId}>
                        <td className="py-2 text-slate-700">
                          {qs.isFinalExam && <span className="mr-1 text-xs text-amber-600">🎓</span>}
                          {qs.title}
                        </td>
                        <td className="py-2 text-center text-slate-600">{qs.totalAttempts}</td>
                        <td className="py-2 text-center text-green-600">{qs.passed}</td>
                        <td className="py-2 text-center">
                          <span className={`rounded px-2 py-0.5 text-xs ${qs.passRate >= 70 ? "bg-green-100 text-green-700" : qs.passRate >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                            {qs.passRate}%
                          </span>
                        </td>
                        <td className="py-2 text-center text-slate-600">{qs.avgScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Assignment stats */}
          {analytics.assignmentStats.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 font-bold text-slate-800">📋 Assignment Submissions</h2>
              <div className="space-y-2">
                {analytics.assignmentStats.map(a => (
                  <div key={a.assignmentId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-700">{a.title}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-slate-500">{a.totalSubmissions} submitted</span>
                      <span className="text-amber-600">{a.pending} pending</span>
                      <span className="text-green-600">{a.graded} graded</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-slate-400 py-8">Select a course to view analytics</div>
      )}
    </div>
  );
}
