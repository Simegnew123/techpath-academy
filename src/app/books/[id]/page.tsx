import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookById, getAllBooks } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

export const revalidate = 0;

const FILE_ICONS: Record<string, string> = {
  pdf: "📄",
  epub: "📚",
  doc: "📝",
  docx: "📝",
  link: "🔗",
};

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = getBookById(id);
  if (!book) notFound();

  const user = await getCurrentUser();
  const canManage = user ? (user.role === "admin" || user.role === "instructor") : false;

  // Related books (same category)
  const related = getAllBooks()
    .filter((b) => b.category === book.category && b.id !== book.id)
    .slice(0, 4);

  const icon = FILE_ICONS[book.fileType] || "📄";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-indigo-600">Home</Link>
        {" / "}
        <Link href="/books" className="hover:text-indigo-600">Library</Link>
        {" / "}
        <span className="text-slate-700">{book.title}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        {/* Cover */}
        <div className="flex flex-col items-center">
          <div className="flex h-60 w-44 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-200 shadow-md">
            {book.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <div className="text-7xl opacity-50">{icon}</div>
            )}
          </div>
          <div className="mt-4 text-center">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {book.fileType.toUpperCase()}
            </span>
            <p className="mt-2 text-xs text-slate-400">{book.downloads} downloads</p>
          </div>
        </div>

        {/* Details */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{book.title}</h1>
          <p className="mt-1 text-slate-500">by {book.author}</p>

          <div className="mt-3">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
              {book.category}
            </span>
          </div>

          {book.description && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-800">Description</h3>
              <p className="mt-2 leading-relaxed text-slate-600 whitespace-pre-line">
                {book.description}
              </p>
            </div>
          )}

          {/* Download / Access button */}
          <div className="mt-8">
            {book.fileUrl ? (
              <a
                href={book.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => fetch(`/api/books/${book.id}`, { method: "POST" }).catch(() => {})}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                {book.fileType === "link" ? "🔗 Open Link" : `⬇ Download ${book.fileType.toUpperCase()}`}
              </a>
            ) : (
              <p className="text-sm text-slate-400">Download link not available yet.</p>
            )}

            {canManage && (
              <Link
                href={`/admin/books?edit=${book.id}`}
                className="ml-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                ✏️ Edit
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Related books */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Related Books</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((b) => (
              <Link
                key={b.id}
                href={`/books/${b.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="text-3xl">{FILE_ICONS[b.fileType] || "📄"}</div>
                <h3 className="mt-2 font-medium text-slate-800 line-clamp-2 group-hover:text-indigo-600">
                  {b.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500">by {b.author}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
