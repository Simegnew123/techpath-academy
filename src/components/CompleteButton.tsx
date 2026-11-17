"use client";

import { useState } from "react";
import Confetti from "./Confetti";

export default function CompleteButton({
  lessonId,
  initiallyCompleted,
}: {
  lessonId: string;
  initiallyCompleted: boolean;
}) {
  const [done, setDone] = useState(initiallyCompleted);
  const [celebrate, setCelebrate] = useState(false);

  const toggle = async () => {
    const next = !done;
    setDone(next);
    await fetch(`/api/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: next }),
    });
    // Trigger confetti when marking as complete (not when un-completing)
    if (next) {
      setCelebrate(false);
      setTimeout(() => setCelebrate(true), 10);
    }
  };

  return (
    <>
      <button
        onClick={toggle}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          done
            ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700"
            : "bg-slate-100 text-slate-600 ring-1 ring-slate-300 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600"
        }`}
      >
        {done ? "✓ Completed" : "Mark as complete"}
      </button>
      <Confetti trigger={celebrate} />
    </>
  );
}
