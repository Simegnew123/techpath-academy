"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FlashcardPlayer from "@/components/FlashcardPlayer";

type DueCard = {
  id: string;
  flashcardId: string;
  flashcard: {
    id: string;
    front: string;
    back: string;
  };
};

export default function FlashcardReviewPage() {
  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/flashcards?action=due")
      .then((r) => r.json())
      .then((d) => setDueCards(d.cards || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  const cards = dueCards.map((d) => d.flashcard).filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/flashcards" className="mb-6 inline-block text-sm text-indigo-600 hover:underline">
        ← Back to all decks
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-slate-800 dark:text-slate-100">🧠 Daily Review</h1>
      <p className="mb-6 text-slate-500 dark:text-slate-400">
        These cards are due for review based on your spaced repetition schedule.
      </p>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <div className="text-5xl">✅</div>
          <h3 className="mt-3 text-lg font-semibold text-slate-700 dark:text-slate-100">All caught up!</h3>
          <p className="mt-1 text-sm text-slate-500">
            No cards due for review right now. Study some flashcards and come back tomorrow!
          </p>
          <Link
            href="/flashcards"
            className="mt-5 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700"
          >
            Browse Decks
          </Link>
        </div>
      ) : (
        <FlashcardPlayer
          deck={{ id: "review", title: "Daily Review", description: "Cards due today" }}
          cards={cards}
          mode="review"
        />
      )}
    </div>
  );
}
