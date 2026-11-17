import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getFlashcardDecks,
  getFlashcards,
  createFlashcardDeck,
  deleteFlashcardDeck,
  createFlashcard,
  deleteFlashcard,
  getSRSStats,
  getDueSRSReviews,
  processSRSReview,
} from "@/lib/store";

// GET /api/flashcards — list decks (optionally by course), or get SRS stats / due cards
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const courseId = searchParams.get("courseId");

  if (action === "srs-stats") {
    const stats = getSRSStats(user.id);
    return NextResponse.json({ stats });
  }

  if (action === "due") {
    const due = getDueSRSReviews(user.id);
    return NextResponse.json({ cards: due });
  }

  const decks = getFlashcardDecks(courseId || undefined);
  const result = decks.map((d) => ({
    ...d,
    cardCount: getFlashcards(d.id).length,
  }));
  return NextResponse.json({ decks: result });
}

// POST /api/flashcards — create deck or card, or submit SRS review
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  // Create deck
  if (!action || action === "createDeck") {
    if (user.role !== "instructor" && user.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    const deck = createFlashcardDeck({
      courseId: body.courseId,
      lessonId: body.lessonId || null,
      title: body.title,
      description: body.description || "",
      createdBy: user.id,
    });
    return NextResponse.json({ deck }, { status: 201 });
  }

  // Create card
  if (action === "createCard") {
    if (user.role !== "instructor" && user.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    const card = createFlashcard({
      deckId: body.deckId,
      front: body.front,
      back: body.back,
    });
    return NextResponse.json({ card }, { status: 201 });
  }

  // SRS review
  if (action === "review") {
    const quality = body.quality as 0 | 1 | 2 | 3 | 4 | 5;
    if (quality === undefined || quality === null) {
      return NextResponse.json({ error: "quality required (0-5)" }, { status: 400 });
    }
    processSRSReview(user.id, body.flashcardId, quality);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE /api/flashcards — delete deck or card
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const deckId = searchParams.get("deckId");
  const cardId = searchParams.get("cardId");

  if (cardId) {
    deleteFlashcard(cardId);
    return NextResponse.json({ success: true });
  }
  if (deckId) {
    deleteFlashcardDeck(deckId);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "deckId or cardId required" }, { status: 400 });
}
