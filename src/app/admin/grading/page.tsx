"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Assignment = {
  id: string;
  courseId: string;
  title: string;
  maxPoints: number;
};

type Submission = {
  id: string;
  assignmentId: string;
  userId: string;
  fileName: string;
  fileType: string;
  notes: string;
  submittedAt: string;
  status: string;
  grade: number | null;
  feedback: string;
};

type Course = { id: string; title: string };

export default function AdminGradingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        const list = data.courses || data;
        setCourses(list.map((c: any) => ({ id: c.id, title: c.title })));
      }
      setLoadingCourses(false);
    }
    fetchCourses();
  }, []);

  const fetchAssignments = useCallback(async (courseId: string) => {
    const res = await fetch(`/api/assignments?courseId=${courseId}`);
    if (res.ok) {
      const data = await res.json();
      setAssignments(data.assignments);
      for (const a of data.assignments) {
        const subRes = await fetch(`/api/assignments/${a.id}/grade`);
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubmissions(prev => ({ ...prev, [a.id]: subData.submissions }));
        }
      }
    }
  }, []);

  useEffect(() => {
    if (selectedCourse) fetchAssignments(selectedCourse);
  }, [selectedCourse, fetchAssignments]);

  async function submitGrade(assignmentId: string, submissionId: string, maxPoints: number) {
    const grade = parseInt(gradeValue);
    if (isNaN(grade) || grade < 0 || grade > maxPoints) {
      alert(`Grade must be between 0 and ${maxPoints}`);
      return;
    }
    const res = await fetch(`/api/assignments/${assignmentId}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, grade, feedback }),
    });
    if (res.ok) {
      setGradingId(null);
      setGradeValue("");
      setFeedback("");
      await fetchAssignments(selectedCourse);
    }
  }

  function downloadFile(fileName: string, submission: Submission) {
    // We need to fetch the file data - get it from the grade endpoint which returns submissions
    // For now, create a simple text file with the submission info
    const content = `Submission: ${fileName}\nStudent Notes: ${submission.notes}\nSubmitted: ${submission.submittedAt}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Grading Queue</h1>
          <p className="text-slate-500">Review and grade student submissions</p>
        </div>
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Back to Admin</Link>
      </div>

      <div className="mb-6">
        {loadingCourses ? (
          <p className="text-sm text-slate-400">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-slate-400">No courses found. Create a course first.</p>
        ) : (
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            aria-label="Select course"
          >
            <option value="">Select a course...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        )}
      </div>

      {!selectedCourse ? (
        <p className="text-center text-slate-400 py-8">Select a course to view submissions</p>
      ) : assignments.length === 0 ? (
        <p className="text-center text-slate-400 py-8">No assignments for this course</p>
      ) : (
        <div className="space-y-6">
          {assignments.map(a => {
            const subs = submissions[a.id] || [];
            const pending = subs.filter(s => s.status === "pending");
            const graded = subs.filter(s => s.status === "graded");

            return (
              <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-bold text-slate-800">📋 {a.title}</h2>
                  <div className="flex gap-3 text-xs">
                    <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">{pending.length} pending</span>
                    <span className="rounded bg-green-100 px-2 py-1 text-green-700">{graded.length} graded</span>
                  </div>
                </div>

                {subs.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">No submissions yet</p>
                ) : (
                  <div className="space-y-2">
                    {subs.map(s => (
                      <div key={s.id} className={`rounded-lg p-3 ${s.status === "graded" ? "bg-green-50" : "bg-slate-50"}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-700">📄 {s.fileName}</p>
                            <p className="text-xs text-slate-400">Submitted: {new Date(s.submittedAt).toLocaleString()}</p>
                            {s.notes && <p className="mt-1 text-xs text-slate-500">Notes: {s.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            {s.status === "graded" ? (
                              <div className="text-right">
                                <span className="rounded bg-green-600 px-2 py-1 text-xs text-white">
                                  {s.grade}/{a.maxPoints}
                                </span>
                                {s.feedback && <p className="mt-1 text-xs text-slate-500 max-w-xs">{s.feedback}</p>}
                              </div>
                            ) : gradingId === s.id ? (
                              <div className="flex flex-col gap-1">
                                <input
                                  type="number"
                                  value={gradeValue}
                                  onChange={(e) => setGradeValue(e.target.value)}
                                  placeholder={`0-${a.maxPoints}`}
                                  className="w-20 rounded border border-slate-300 px-2 py-1 text-xs"
                                  aria-label="Grade"
                                />
                                <input
                                  type="text"
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  placeholder="Feedback..."
                                  className="w-48 rounded border border-slate-300 px-2 py-1 text-xs"
                                  aria-label="Feedback"
                                />
                                <button
                                  onClick={() => submitGrade(a.id, s.id, a.maxPoints)}
                                  className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                                >
                                  Save Grade
                                </button>
                                <button
                                  onClick={() => setGradingId(null)}
                                  className="text-xs text-slate-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setGradingId(s.id)}
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700"
                              >
                                Grade
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
