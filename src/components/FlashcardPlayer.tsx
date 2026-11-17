"use client";

import { useState, useEffect, useCallback } from "react";

type Flashcard = {
  id: string;
  front: string;
  back: string;
};

type Deck = {
  id: string;
  title: string;
  description: string;
};

export default function FlashcardPlayer({
  deck,
  cards,
  mode,
}: {
  deck: Deck;
  cards: Flashcard[];
  mode: "study" | "review";
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, total: 0 });
  const [finished, setFinished] = useState(false);

  const card = cards[currentIdx];

  const next = useCallback((quality: "again" | "good" | "easy") => {
    if (mode === "review") {
      // Submit SRS review
      const qualityMap = { again: 0, good: 3, easy: 5 };
      fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId: card.id, quality: qualityMap[quality] }),
      });
    }

    setStats((s) => ({
      correct: quality !== "again" ? s.correct + 1 : s.correct,
      wrong: quality === "again" ? s.wrong + 1 : s.wrong,
      total: s.total + 1,
    }));

    setFlipped(false);
    if (currentIdx + 1 < cards.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setFinished(true);
    }
  }, [card, currentIdx, cards.length, mode]);

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (finished) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "1" && flipped) {
        next("again");
      } else if (e.key === "2" && flipped) {
        next("good");
      } else if (e.key === "3" && flipped) {
        next("easy");
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, finished, next]);

  if (finished) {
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
        <div className="text-5xl">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        <h3 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">Session Complete!</h3>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          You got {stats.correct} out of {stats.total} correct ({pct}%)
        </p>
        <button
          onClick={() => { setCurrentIdx(0); setFlipped(false); setStats({ correct: 0, wrong: 0, total: 0 }); setFinished(false); }}
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
        >
          Study Again
        </button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-center text-slate-400 py-8">No flashcards in this deck</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Card {currentIdx + 1} of {cards.length}
        </span>
        <div className="flex gap-3 text-xs">
          <span className="text-green-600">✓ {stats.correct}</span>
          <span className="text-red-500">✗ {stats.wrong}</span>
        </div>
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${((currentIdx) / cards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        className="relative h-72 cursor-pointer perspective-1000"
        onClick={() => setFlipped(!flipped)}
        role="button"
        aria-label="Flashcard - click to flip"
      >
        <div
          className={`relative h-full w-full transition-transform duration-500 transform-style-3d ${flipped ? "rotate-y-180" : ""}`}
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-indigo-200 bg-white p-8 shadow-lg dark:border-indigo-800 dark:bg-slate-800"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-indigo-500">Question</p>
              <p className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">{card.front}</p>
              <p className="mt-6 text-xs text-slate-400">Click to flip · Space</p>
            </div>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8 shadow-lg dark:border-emerald-800 dark:bg-slate-800"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-emerald-600">Answer</p>
              <p className="mt-4 text-lg text-slate-700 dark:text-slate-100">{card.back}</p>
              <p className="mt-6 text-xs text-slate-400">How did you do?</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons (shown when flipped) */}
      {flipped && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => next("again")}
            className="flex-1 rounded-xl bg-red-100 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
          >
            🔴 Again <kbd className="ml-1 text-xs opacity-60">1</kbd>
          </button>
          <button
            onClick={() => next("good")}
            className="flex-1 rounded-xl bg-amber-100 px-4 py-3 font-semibold text-amber-700 transition hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
          >
            🟡 Good <kbd className="ml-1 text-xs opacity-60">2</kbd>
          </button>
          <button
            onClick={() => next("easy")}
            className="flex-1 rounded-xl bg-green-100 px-4 py-3 font-semibold text-green-700 transition hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
          >
            🟢 Easy <kbd className="ml-1 text-xs opacity-60">3</kbd>
          </button>
        </div>
      )}
    </div>
  );
}
