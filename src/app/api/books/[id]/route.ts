import { NextRequest, NextResponse } from "next/server";
import { getBookById, updateBook, deleteBook, incrementBookDownload } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

// GET /api/books/[id] — get a single book (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const book = getBookById(id);
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  return NextResponse.json({ book });
}

// PATCH /api/books/[id] — update a book (admin/instructor only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const book = getBookById(id);
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  updateBook(id, {
    title: body.title !== undefined ? String(body.title) : undefined,
    author: body.author !== undefined ? String(body.author) : undefined,
    description: body.description !== undefined ? String(body.description) : undefined,
    category: body.category !== undefined ? String(body.category) : undefined,
    fileType: body.fileType !== undefined ? String(body.fileType) : undefined,
    fileUrl: body.fileUrl !== undefined ? String(body.fileUrl) : undefined,
    coverImage: body.coverImage !== undefined ? String(body.coverImage) : undefined,
    featured: body.featured !== undefined ? Boolean(body.featured) : undefined,
  });

  return NextResponse.json({ book: getBookById(id) });
}

// DELETE /api/books/[id] — delete a book (admin/instructor only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const book = getBookById(id);
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });

  deleteBook(id);
  return NextResponse.json({ ok: true });
}

// POST /api/books/[id]/download — increment download counter
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const book = getBookById(id);
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  incrementBookDownload(id);
  return NextResponse.json({ ok: true, fileUrl: book.fileUrl });
}
