"use client";

import { useState } from "react";

export default function CompleteButton({
  lessonId,
  initiallyCompleted,
}: {
  lessonId: string;
  initiallyCompleted: boolean;
}) {
  const [done, setDone] = useState(initiallyCompleted);

  const toggle = async () => {
    const next = !done;
    setDone(next);
    await fetch(`/api/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: next }),
    });
  };

  return (
    <button
      onClick={toggle}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        done
          ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-300 hover:bg-slate-200"
      }`}
    >
      {done ? "✓ Completed" : "Mark as complete"}
    </button>
  );
}
