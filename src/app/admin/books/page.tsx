"use client";

import { useState, useEffect } from "react";

type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  fileType: string;
  fileUrl: string;
  coverImage: string;
  featured: boolean;
  downloads: number;
};

const CATEGORIES = [
  "Networking", "Programming", "Cyber Security", "Database",
  "IT Support", "AI", "Self-Help", "Other",
];

const FILE_TYPES = ["pdf", "epub", "doc", "docx", "link"];

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Book | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [fileType, setFileType] = useState("pdf");
  const [fileUrl, setFileUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBooks();
    // Check if editing from URL param
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      loadBookForEdit(editId);
    }
  }, []);

  async function loadBooks() {
    try {
      const res = await fetch("/api/books");
      const data = await res.json();
      setBooks(data.books || []);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function loadBookForEdit(id: string) {
    try {
      const res = await fetch(`/api/books/${id}`);
      const data = await res.json();
      if (data.book) {
        startEdit(data.book);
      }
    } catch {
      // ignore
    }
  }

  function startEdit(book: Book) {
    setEditing(book);
    setTitle(book.title);
    setAuthor(book.author);
    setDescription(book.description);
    setCategory(book.category);
    setFileType(book.fileType);
    setFileUrl(book.fileUrl);
    setCoverImage(book.coverImage);
    setFeatured(book.featured);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditing(null);
    setTitle("");
    setAuthor("");
    setDescription("");
    setCategory("Other");
    setFileType("pdf");
    setFileUrl("");
    setCoverImage("");
    setFeatured(false);
    setShowForm(false);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { title, author, description, category, fileType, fileUrl, coverImage, featured };
      const url = editing ? `/api/books/${editing.id}` : "/api/books";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save book.");
        setSaving(false);
        return;
      }
      resetForm();
      loadBooks();
    } catch {
      setError("Something went wrong.");
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this book? This cannot be undone.")) return;
    try {
      await fetch(`/api/books/${id}`, { method: "DELETE" });
      loadBooks();
    } catch {
      // ignore
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">📚 Manage Books</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Add Book
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            {editing ? "Edit Book" : "Add New Book"}
          </h2>

          {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-600">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. CompTIA Network+ Study Guide"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Author *</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. Simegnew Ademe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              placeholder="Brief description of the book or document..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-600">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">File Type</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              >
                {FILE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">
              File URL / Download Link *
            </label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              placeholder="https://drive.google.com/... or direct download link"
            />
            <p className="mt-1 text-xs text-slate-400">
              Use Google Drive, Dropbox, or any direct file link. For Google Drive, use a shareable link.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">Cover Image URL (optional)</label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              placeholder="https://...book-cover.jpg"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="accent-indigo-600"
            />
            <span className="text-sm text-slate-600">⭐ Feature this book on the library page</span>
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : editing ? "Update Book" : "Add Book"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-300 px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Books list */}
      <div className="mt-8 space-y-3">
        {books.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="text-4xl">📚</div>
            <p className="mt-2 text-slate-500">No books yet. Click "Add Book" to get started.</p>
          </div>
        ) : (
          books.map((book) => (
            <div
              key={book.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">
                  {book.fileType === "pdf" ? "📄" : book.fileType === "epub" ? "📚" : book.fileType === "link" ? "🔗" : "📝"}
                </div>
                <div>
                  <div className="font-medium text-slate-800">
                    {book.title} {book.featured && <span className="text-amber-500">⭐</span>}
                  </div>
                  <div className="text-sm text-slate-500">
                    by {book.author} · {book.category} · {book.downloads} downloads
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(book)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(book.id)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
