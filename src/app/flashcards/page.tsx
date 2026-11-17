"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FlashcardPlayer from "@/components/FlashcardPlayer";

type Deck = {
  id: string;
  title: string;
  description: string;
  courseId: string;
  cardCount: number;
};

type Flashcard = {
  id: string;
  front: string;
  back: string;
};

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [view, setView] = useState<"list" | "study">("list");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/flashcards")
      .then((r) => r.json())
      .then((d) => setDecks(d.decks || []))
      .finally(() => setLoading(false));
  }, []);

  async function studyDeck(deck: Deck) {
    const res = await fetch(`/api/flashcards?courseId=${deck.courseId}`);
    // Actually need to get cards for this specific deck
    // Let's use a different approach - fetch all and filter
    const allRes = await fetch("/api/flashcards");
    const allData = await allRes.json();
    const foundDeck = (allData.decks || []).find((d: any) => d.id === deck.id);
    // We need a way to get cards - let's create an inline fetch
    const cardRes = await fetch(`/api/flashcards?action=cards&deckId=${deck.id}`);
    let deckCards: Flashcard[] = [];
    if (cardRes.ok) {
      const cardData = await cardRes.json();
      deckCards = cardData.cards || [];
    }
    setActiveDeck(deck);
    setCards(deckCards);
    setView("study");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (view === "study" && activeDeck) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button
          onClick={() => setView("list")}
          className="mb-6 text-sm text-indigo-600 hover:underline"
        >
          ← Back to all decks
        </button>
        <h1 className="mb-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{activeDeck.title}</h1>
        <p className="mb-6 text-slate-500 dark:text-slate-400">{activeDeck.description}</p>
        <FlashcardPlayer deck={activeDeck} cards={cards} mode="study" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">🃏 Flashcard Decks</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Study with interactive flashcards. Spaced repetition ensures you review cards at the optimal time for long-term retention.
      </p>

      {/* Daily Review CTA */}
      <Link
        href="/flashcards/review"
        className="mt-6 flex items-center justify-between rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 transition hover:shadow-md dark:border-indigo-800 dark:from-slate-800 dark:to-slate-800"
      >
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">🧠 Daily Spaced Repetition Review</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review cards due today to lock in your knowledge</p>
        </div>
        <span className="text-indigo-600">→</span>
      </Link>

      {/* Decks grid */}
      {decks.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <div className="text-4xl">🃏</div>
          <h3 className="mt-3 font-semibold text-slate-700">No flashcard decks yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Instructors can create flashcard decks for courses. Check back soon!
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => studyDeck(deck)}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-indigo-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{deck.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{deck.description}</p>
                </div>
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {deck.cardCount} cards
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-indigo-600 group-hover:underline">Study now →</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
