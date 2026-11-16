"use client";

import { useState, useEffect, useCallback } from "react";

type Assignment = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  maxPoints: number;
  dueDate: string | null;
  allowedFileTypes: string[];
  maxFileSizeMB: number;
};

type Submission = {
  id: string;
  fileName: string;
  submittedAt: string;
  status: string;
  grade: number | null;
  feedback: string;
  gradedAt: string | null;
};

export default function AssignmentUploader({
  courseId,
  userId,
}: {
  courseId: string;
  userId: string;
}) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchAssignments = useCallback(async () => {
    const res = await fetch(`/api/assignments?courseId=${courseId}`);
    if (res.ok) {
      const data = await res.json();
      setAssignments(data.assignments);
      // Fetch submissions for each assignment
      for (const a of data.assignments) {
        const subRes = await fetch(`/api/assignments/${a.id}/submit`);
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubmissions(prev => ({ ...prev, [a.id]: subData.submissions }));
        }
      }
    }
  }, [courseId]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  async function submitAssignment(assignment: Assignment) {
    if (!selectedFile) { setError("Please select a file"); return; }
    setError("");
    setUploading(true);

    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (assignment.allowedFileTypes.length > 0 && ext && !assignment.allowedFileTypes.includes(ext)) {
      setError(`File type .${ext} not allowed. Allowed: ${assignment.allowedFileTypes.join(", ")}`);
      setUploading(false);
      return;
    }

    const sizeMB = selectedFile.size / (1024 * 1024);
    if (sizeMB > assignment.maxFileSizeMB) {
      setError(`File too large. Max ${assignment.maxFileSizeMB}MB`);
      setUploading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const res = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileData: base64,
          fileType: ext,
          notes,
        }),
      });
      if (res.ok) {
        setSelectedFile(null);
        setNotes("");
        await fetchAssignments();
      } else {
        const data = await res.json();
        setError(data.error || "Upload failed");
      }
      setUploading(false);
    };
    reader.readAsDataURL(selectedFile);
  }

  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
        <span className="text-3xl">📋</span>
        <p className="mt-2 text-sm text-slate-500">No assignments for this course yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="region" aria-label="Course assignments">
      {assignments.map((a) => {
        const subs = submissions[a.id] || [];
        const latestSub = subs[0];
        const isExpanded = expanded === a.id;
        const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();

        return (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <button
              onClick={() => setExpanded(isExpanded ? null : a.id)}
              className="w-full text-left"
              aria-expanded={isExpanded}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                    <span aria-hidden="true">📋</span> {a.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">{a.description}</p>
                </div>
                <div className="text-right text-xs">
                  {latestSub ? (
                    <span className={`rounded px-2 py-1 ${latestSub.status === "graded" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {latestSub.status === "graded" ? `Graded: ${latestSub.grade}/${a.maxPoints}` : "Pending Review"}
                    </span>
                  ) : (
                    <span className={`rounded px-2 py-1 ${isOverdue ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                      {isOverdue ? "Overdue" : "Not Submitted"}
                    </span>
                  )}
                </div>
              </div>
              {a.dueDate && (
                <p className={`mt-1 text-xs ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                  Due: {new Date(a.dueDate).toLocaleDateString()}
                </p>
              )}
            </button>

            {isExpanded && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                {a.instructions && (
                  <div className="mb-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-600">Instructions:</p>
                    <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{a.instructions}</p>
                  </div>
                )}

                {/* Latest submission feedback */}
                {latestSub && latestSub.status === "graded" && latestSub.feedback && (
                  <div className="mb-3 rounded-lg bg-green-50 p-3 border border-green-200">
                    <p className="text-xs font-semibold text-green-700">Instructor Feedback:</p>
                    <p className="mt-1 text-sm text-green-800">{latestSub.feedback}</p>
                    <p className="mt-1 text-xs text-green-600">Grade: {latestSub.grade}/{a.maxPoints}</p>
                  </div>
                )}

                {/* Upload form */}
                {latestSub?.status !== "graded" && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                      aria-label="Select file to upload"
                    />
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add a note for the instructor (optional)..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      rows={2}
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button
                      onClick={() => submitAssignment(a)}
                      disabled={uploading || !selectedFile}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {uploading ? "Uploading..." : "Submit Assignment"}
                    </button>
                    <p className="text-xs text-slate-400">
                      Allowed: {a.allowedFileTypes.join(", ")} | Max: {a.maxFileSizeMB}MB
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
