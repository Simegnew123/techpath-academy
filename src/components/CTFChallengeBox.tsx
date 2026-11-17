"use client";

import { useState, useEffect } from "react";

type Challenge = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  hint: string;
  maxAttempts: number;
  solveCount: number;
  solved: boolean;
  attemptsUsed: number;
};

export default function CTFChallengeBox({ lessonId }: { lessonId: string }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, { correct: boolean; message: string; showHint?: boolean; hint?: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ctf/challenges?lessonId=${lessonId}`)
      .then((r) => r.json())
      .then((data) => {
        setChallenges(data.challenges || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lessonId]);

  const submitFlag = async (challengeId: string) => {
    const flag = flags[challengeId];
    if (!flag?.trim()) return;

    setSubmitting(challengeId);
    try {
      const res = await fetch("/api/ctf/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, flag }),
      });
      const data = await res.json();

      setResults((prev) => ({
        ...prev,
        [challengeId]: {
          correct: data.correct,
          message: data.correct ? data.message : data.error,
          showHint: data.showHint,
          hint: data.hint,
        },
      }));

      if (data.correct) {
        // Update challenge solved status
        setChallenges((prev) =>
          prev.map((c) => (c.id === challengeId ? { ...c, solved: true } : c))
        );
      }
    } catch {
      setResults((prev) => ({
        ...prev,
        [challengeId]: { correct: false, message: "Network error." },
      }));
    }
    setSubmitting(null);
  };

  if (loading) {
    return <div className="animate-pulse rounded-xl bg-slate-100 p-6 dark:bg-slate-800">Loading challenges...</div>;
  }

  if (challenges.length === 0) {
    return null; // No challenges for this lesson — don't render anything
  }

  const difficultyColors: Record<string, string> = {
    easy: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    hard: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
    expert: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  };

  const categoryIcons: Record<string, string> = {
    crypto: "🔐",
    forensics: "🔍",
    network: "🌐",
    web: "🕸️",
    linux: "🐧",
    reverse: "🔄",
    misc: "🎯",
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏁</span>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Capture The Flag Challenges
        </h3>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Put your skills to the test. Find the flag, submit it, and earn XP. Flags are typically in the format{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
          flag{`{...}`}
        </code>{" "}
        or a specific string mentioned in the challenge.
      </p>

      {challenges.map((ch) => {
        const result = results[ch.id];
        return (
          <div
            key={ch.id}
            className={`rounded-2xl border p-6 ${
              ch.solved
                ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryIcons[ch.category] || "🎯"}</span>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{ch.title}</h4>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColors[ch.difficulty] || difficultyColors.easy}`}>
                    {ch.difficulty}
                  </span>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                    +{ch.points} XP
                  </span>
                  <span className="text-xs text-slate-400">
                    {ch.solveCount} {ch.solveCount === 1 ? "solve" : "solves"}
                  </span>
                </div>
              </div>
              {ch.solved && (
                <div className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
                  ✓ Solved
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {ch.description}
            </div>

            {/* Flag submission (only if not solved) */}
            {!ch.solved && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Submit Flag
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={flags[ch.id] || ""}
                    onChange={(e) => setFlags((prev) => ({ ...prev, [ch.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && submitFlag(ch.id)}
                    placeholder="flag{your_answer_here}"
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none dark:bg-slate-800 dark:text-slate-100"
                  />
                  <button
                    onClick={() => submitFlag(ch.id)}
                    disabled={submitting === ch.id || !flags[ch.id]?.trim()}
                    className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {submitting === ch.id ? "..." : "Submit"}
                  </button>
                </div>

                {/* Result */}
                {result && (
                  <div className="mt-3">
                    {result.correct ? (
                      <div className="rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                        {result.message}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                          ❌ {result.message}
                        </div>
                        {result.showHint && result.hint && (
                          <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            💡 <strong>Hint:</strong> {result.hint}
                          </div>
                        )}
                      </div>
                    )}
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
