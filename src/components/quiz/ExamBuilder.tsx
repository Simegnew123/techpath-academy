"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Quiz = {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  maxAttempts: number;
  timeLimit: number;
  shuffleQuestions: boolean;
};

type Question = {
  id: string;
  text: string;
  type: "mcq" | "true_false" | "short_answer";
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
};

export default function ExamBuilder({
  courseId,
  courseTitle,
  existingExam,
  existingQuestions,
}: {
  courseId: string;
  courseTitle: string;
  existingExam: Quiz | null;
  existingQuestions: Question[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(existingExam?.title || `Final Exam: ${courseTitle}`);
  const [description, setDescription] = useState(existingExam?.description || "");
  const [passingScore, setPassingScore] = useState(existingExam?.passingScore || 70);
  const [maxAttempts, setMaxAttempts] = useState(existingExam?.maxAttempts || 3);
  const [timeLimit, setTimeLimit] = useState(existingExam?.timeLimit || 30);
  const [shuffleQuestions, setShuffleQuestions] = useState(existingExam?.shuffleQuestions ?? true);

  const [questions, setQuestions] = useState<Question[]>(
    existingQuestions.length > 0
      ? existingQuestions.map(q => ({ ...q }))
      : [
          {
            id: `tmp-${Date.now()}-0`,
            text: "",
            type: "mcq" as const,
            options: ["", "", "", ""],
            correctAnswer: "",
            explanation: "",
            points: 1,
          },
        ]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function addQuestion() {
    setQuestions([...questions, {
      id: `tmp-${Date.now()}-${questions.length}`,
      text: "",
      type: "mcq",
      options: ["", "", "", ""],
      correctAnswer: "",
      explanation: "",
      points: 1,
    }]);
  }

  function removeQuestion(idx: number) {
    setQuestions(questions.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx: number, updates: Partial<Question>) {
    setQuestions(questions.map((q, i) => i === idx ? { ...q, ...updates } : q));
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    setQuestions(questions.map((q, i) => {
      if (i !== qIdx) return q;
      const newOpts = [...q.options];
      newOpts[optIdx] = value;
      return { ...q, options: newOpts };
    }));
  }

  function addOption(qIdx: number) {
    setQuestions(questions.map((q, i) => i === qIdx ? { ...q, options: [...q.options, ""] } : q));
  }

  function removeOption(qIdx: number, optIdx: number) {
    setQuestions(questions.map((q, i) => {
      if (i !== qIdx) return q;
      return { ...q, options: q.options.filter((_, j) => j !== optIdx) };
    }));
  }

  async function saveExam() {
    setError("");
    // Validate
    if (!title.trim()) { setError("Title is required"); return; }
    const validQs = questions.filter(q => q.text.trim());
    if (validQs.length === 0) { setError("At least one question is required"); return; }
    for (let i = 0; i < validQs.length; i++) {
      if (validQs[i].type !== "short_answer" && !validQs[i].correctAnswer.trim()) {
        setError(`Question ${i + 1}: Correct answer is required for MCQ/True-False`);
        return;
      }
      if (validQs[i].type !== "short_answer") {
        const filled = validQs[i].options.filter(o => o.trim());
        if (filled.length < 2) { setError(`Question ${i + 1}: At least 2 options required`); return; }
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          isFinalExam: true,
          lessonId: null,
          title,
          description,
          passingScore,
          maxAttempts,
          timeLimit,
          shuffleQuestions,
          questions: validQs.map(q => ({
            text: q.text,
            type: q.type,
            options: q.type === "short_answer" ? [] : q.options.filter(o => o.trim()),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        setTimeout(() => router.refresh(), 1500);
      } else {
        setError(data.error || "Failed to save exam");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Exam Settings</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Exam Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Passing Score (%)</label>
            <input
              type="number" min={1} max={100}
              value={passingScore}
              onChange={e => setPassingScore(parseInt(e.target.value) || 70)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Max Attempts (0 = unlimited)</label>
            <input
              type="number" min={0}
              value={maxAttempts}
              onChange={e => setMaxAttempts(parseInt(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Time Limit (minutes, 0 = none)</label>
            <input
              type="number" min={0}
              value={timeLimit}
              onChange={e => setTimeLimit(parseInt(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={e => setShuffleQuestions(e.target.checked)}
              id="shuffle"
              className="h-4 w-4 rounded"
            />
            <label htmlFor="shuffle" className="text-sm font-medium text-slate-700">
              Shuffle questions for each student
            </label>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Questions ({questions.length})</h3>
          <button
            onClick={addQuestion}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Add Question
          </button>
        </div>

        <div className="mt-4 space-y-6">
          {questions.map((q, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Question {idx + 1}</span>
                <div className="flex items-center gap-2">
                  <select
                    value={q.type}
                    onChange={e => {
                      const newType = e.target.value as Question["type"];
                      updateQuestion(idx, {
                        type: newType,
                        options: newType === "true_false" ? ["True", "False"] : newType === "mcq" ? ["", "", "", ""] : [],
                        correctAnswer: "",
                      });
                    }}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                  <button
                    onClick={() => removeQuestion(idx)}
                    className="rounded-lg bg-red-50 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* Question text */}
              <textarea
                value={q.text}
                onChange={e => updateQuestion(idx, { text: e.target.value })}
                placeholder="Enter your question..."
                rows={2}
                className="mt-3 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500"
              />

              {/* Options (MCQ only) */}
              {q.type === "mcq" && (
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={q.correctAnswer === opt}
                        onChange={() => updateQuestion(idx, { correctAnswer: opt })}
                        className="h-4 w-4"
                      />
                      <input
                        value={opt}
                        onChange={e => updateOption(idx, optIdx, e.target.value)}
                        placeholder={`Option ${optIdx + 1}`}
                        className="flex-1 rounded-lg border border-slate-300 p-2 outline-none focus:border-indigo-500"
                      />
                      {q.options.length > 2 && (
                        <button
                          onClick={() => removeOption(idx, optIdx)}
                          className="text-red-400 hover:text-red-600"
                        >✕</button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(idx)}
                    className="text-sm text-indigo-600 hover:underline"
                  >+ Add option</button>
                  <p className="text-xs text-slate-500">Select the radio button to mark the correct answer</p>
                </div>
              )}

              {/* True/False */}
              {q.type === "true_false" && (
                <div className="mt-3 flex gap-4">
                  {["True", "False"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => updateQuestion(idx, { correctAnswer: opt })}
                      className={`rounded-lg border-2 px-6 py-2 font-medium transition ${
                        q.correctAnswer === opt
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Short answer */}
              {q.type === "short_answer" && (
                <div className="mt-3">
                  <label className="text-sm font-medium text-slate-600">Model Answer (keywords for auto-grading)</label>
                  <input
                    value={q.correctAnswer}
                    onChange={e => updateQuestion(idx, { correctAnswer: e.target.value })}
                    placeholder="Expected answer keywords..."
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">Student answers matching ≥60% of keywords will be marked correct</p>
                </div>
              )}

              {/* Explanation */}
              <div className="mt-3">
                <label className="text-sm font-medium text-slate-600">Explanation (shown after answering)</label>
                <input
                  value={q.explanation}
                  onChange={e => updateQuestion(idx, { explanation: e.target.value })}
                  placeholder="Why is this the correct answer?"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Points */}
              <div className="mt-3 flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">Points:</label>
                <input
                  type="number" min={1}
                  value={q.points}
                  onChange={e => updateQuestion(idx, { points: parseInt(e.target.value) || 1 })}
                  className="w-20 rounded-lg border border-slate-300 p-1.5 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}
      {saved && <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">✅ Final exam saved successfully! Refreshing...</div>}

      <button
        onClick={saveExam}
        disabled={saving}
        className="w-full rounded-xl bg-amber-600 px-6 py-3 text-lg font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "💾 Save Final Exam"}
      </button>
    </div>
  );
}
