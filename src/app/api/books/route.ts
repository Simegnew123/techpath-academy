import { NextRequest, NextResponse } from "next/server";
import { getAllBooks, createBook } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

// GET /api/books — list all books (public)
export async function GET() {
  const books = getAllBooks();
  return NextResponse.json({ books });
}

// POST /api/books — create a new book (admin/instructor only)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Only instructors and admins can add books." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.author) {
    return NextResponse.json({ error: "Title and author are required." }, { status: 400 });
  }

  const book = createBook({
    title: String(body.title),
    author: String(body.author),
    description: String(body.description || ""),
    category: String(body.category || "Other"),
    fileType: String(body.fileType || "link"),
    fileUrl: String(body.fileUrl || ""),
    coverImage: String(body.coverImage || ""),
    uploadedBy: user.id,
    featured: Boolean(body.featured),
  });

  return NextResponse.json({ book }, { status: 201 });
}
