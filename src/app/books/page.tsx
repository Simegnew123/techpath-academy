import Link from "next/link";
import { getAllBooks } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

export const revalidate = 0;

const FILE_ICONS: Record<string, string> = {
  pdf: "📄",
  epub: "📚",
  doc: "📝",
  docx: "📝",
  link: "🔗",
};

const CATEGORY_COLORS: Record<string, string> = {
  Networking: "bg-blue-100 text-blue-700",
  Programming: "bg-purple-100 text-purple-700",
  "Cyber Security": "bg-red-100 text-red-700",
  Database: "bg-green-100 text-green-700",
  "IT Support": "bg-orange-100 text-orange-700",
  AI: "bg-pink-100 text-pink-700",
  "Self-Help": "bg-yellow-100 text-yellow-700",
  Other: "bg-slate-100 text-slate-700",
};

export default async function BooksPage() {
  const books = getAllBooks();
  const user = await getCurrentUser();
  const canManage = user ? (user.role === "admin" || user.role === "instructor") : false;

  // Get unique categories for filter pills
  const categories = [...new Set(books.map((b) => b.category))].sort();
  const featured = books.filter((b) => b.featured);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📚 Book Library</h1>
          <p className="mt-1 text-slate-500">
            Browse our collection of e-books, guides, and important documents.
          </p>
        </div>
        {canManage && (
          <Link
            href="/admin/books"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + Add Book
          </Link>
        )}
      </div>

      {books.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-6xl">📚</div>
          <h2 className="mt-4 text-xl font-semibold text-slate-700">No books yet</h2>
          <p className="mt-2 text-slate-500">
            {canManage
              ? "Click \"Add Book\" to upload your first e-book or document."
              : "Check back soon — new books are being added regularly!"}
          </p>
        </div>
      ) : (
        <>
          {/* Featured books */}
          {featured.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">⭐ Featured</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((book) => (
                  <BookCard key={book.id} book={book} featured />
                ))}
              </div>
            </div>
          )}

          {/* Category filter pills */}
          {categories.length > 1 && (
            <div className="mt-10 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-slate-500">Filter:</span>
              {categories.map((cat) => (
                <span
                  key={cat}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other
                  }`}
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* All books grid */}
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              {featured.length > 0 ? "All Books" : "Books"}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BookCard({
  book,
  featured = false,
}: {
  book: {
    id: string;
    title: string;
    author: string;
    description: string;
    category: string;
    fileType: string;
    downloads: number;
    coverImage: string;
  };
  featured?: boolean;
}) {
  const icon = FILE_ICONS[book.fileType] || "📄";
  const catColor = CATEGORY_COLORS[book.category] || CATEGORY_COLORS.Other;

  return (
    <Link
      href={`/books/${book.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      {/* Cover area */}
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        {book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImage}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-5xl opacity-50">{icon}</div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${catColor}`}>
            {book.category}
          </span>
          {featured && <span className="text-xs text-amber-500">⭐</span>}
        </div>
        <h3 className="mt-2 font-semibold text-slate-800 group-hover:text-indigo-600 line-clamp-2">
          {book.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500">by {book.author}</p>
        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{book.description}</p>
        <div className="mt-auto pt-3 text-xs text-slate-400">
          {book.fileType.toUpperCase()} · {book.downloads} downloads
        </div>
      </div>
    </Link>
  );
}
