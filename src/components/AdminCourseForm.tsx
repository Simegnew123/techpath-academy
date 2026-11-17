"use client";

import { useState } from "react";

export type CategoryOption = { id: string; name: string; slug: string; icon: string };

type LessonDraft = {
  id?: string;
  title: string;
  videoUrl: string;
  content: string;
  type: "text" | "video" | "quiz" | "pdf" | "ctf" | "lab";
  duration: number;
  preview: boolean;
};

type ModuleDraft = {
  id?: string;
  title: string;
  lessons: LessonDraft[];
};

export default function AdminCourseForm({
  categories,
  initial,
  instructorId,
}: {
  categories: CategoryOption[];
  initial?: {
    id: string;
    title: string;
    slug: string;
    categoryId: string;
    description: string;
    coverImage: string;
    price: number;
    published: boolean;
    level: string;
    language: string;
    modules: ModuleDraft[];
  };
  instructorId?: string;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || categories[0]?.id || "");
  const [level, setLevel] = useState(initial?.level || "Beginner");
  const [language, setLanguage] = useState(initial?.language || "English");
  const [description, setDescription] = useState(initial?.description || "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [price, setPrice] = useState<string>(initial ? String(initial.price) : "0");
  const [published, setPublished] = useState(initial?.published || false);
  const [modules, setModules] = useState<ModuleDraft[]>(
    initial?.modules || [
      {
        title: "Module 1",
        lessons: [{ title: "", videoUrl: "", content: "", type: "text", duration: 15, preview: false }],
      },
    ]
  );
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // ---- Module helpers ----
  const updateModule = (mi: number, patch: Partial<ModuleDraft>) => {
    setModules((ms) => ms.map((m, idx) => (idx === mi ? { ...m, ...patch } : m)));
  };
  const addModule = () =>
    setModules((ms) => [
      ...ms,
      { title: `Module ${ms.length + 1}`, lessons: [{ title: "", videoUrl: "", content: "", type: "text", duration: 15, preview: false }] },
    ]);
  const removeModule = (mi: number) =>
    setModules((ms) => ms.filter((_, idx) => idx !== mi));

  // ---- Lesson helpers ----
  const updateLesson = (mi: number, li: number, patch: Partial<LessonDraft>) => {
    setModules((ms) =>
      ms.map((m, idx) =>
        idx === mi
          ? { ...m, lessons: m.lessons.map((l, lidx) => (lidx === li ? { ...l, ...patch } : l)) }
          : m
      )
    );
  };
  const addLesson = (mi: number) =>
    setModules((ms) =>
      ms.map((m, idx) =>
        idx === mi
          ? { ...m, lessons: [...m.lessons, { title: "", videoUrl: "", content: "", type: "text", duration: 15, preview: false }] }
          : m
      )
    );
  const removeLesson = (mi: number, li: number) =>
    setModules((ms) =>
      ms.map((m, idx) =>
        idx === mi
          ? { ...m, lessons: m.lessons.filter((_, lidx) => lidx !== li) }
          : m
      )
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      categoryId,
      level,
      language,
      description: description.trim(),
      coverImage: coverImage.trim(),
      price: Number(price) || 0,
      published,
      instructorId,
      modules: modules.map((m) => ({
        id: m.id,
        title: m.title.trim() || "Untitled Module",
        lessons: m.lessons
          .filter((l) => l.title.trim())
          .map((l) => ({
            id: l.id,
            title: l.title.trim(),
            videoUrl: l.videoUrl.trim(),
            content: l.content,
            type: l.type,
            duration: Number(l.duration) || 0,
            preview: l.preview,
          })),
      })),
    };

    try {
      const res = await fetch(initial ? `/api/courses/${initial.id}` : "/api/courses", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error || "Save failed." });
        setLoading(false);
        return;
      }
      setMsg({ type: "ok", text: "✅ Course saved successfully!" });
      if (!initial && data.course) {
        window.location.href = `/admin/edit/${data.course.id}`;
        return;
      }
      setLoading(false);
    } catch {
      setMsg({ type: "err", text: "Something went wrong." });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {msg && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Course basics */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">📋 Course Details</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Title *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. Introduction to Cyber Security"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Web address (slug — optional)
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated from title"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Price (KSh — 0 = free) *
            </label>
            <input
              type="number"
              min={0}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Language</label>
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              placeholder="English"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            Cover image URL (optional)
          </label>
          <input
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">Description *</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            placeholder="What will students learn in this course?"
          />
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="accent-indigo-600"
          />
          Publish course (visible to everyone immediately)
        </label>
      </div>

      {/* Modules & Lessons */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">📚 Course Content</h2>
          <button
            type="button"
            onClick={addModule}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            + Add Module
          </button>
        </div>

        <div className="mt-4 space-y-6">
          {modules.map((mod, mi) => (
            <div key={mi} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              {/* Module header */}
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {mi + 1}
                </span>
                <input
                  value={mod.title}
                  onChange={(e) => updateModule(mi, { title: e.target.value })}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                  placeholder="Module title (e.g. Getting Started)"
                />
                <button
                  type="button"
                  onClick={() => removeModule(mi)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>

              {/* Lessons in this module */}
              <div className="mt-3 ml-10 space-y-4">
                {mod.lessons.map((l, li) => (
                  <div key={li} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-slate-400">
                        Lesson {mi + 1}.{li + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLesson(mi, li)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600">Title *</label>
                          <input
                            value={l.title}
                            onChange={(e) => updateLesson(mi, li, { title: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="Lesson title"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600">Type</label>
                          <select
                            value={l.type}
                            onChange={(e) => updateLesson(mi, li, { type: e.target.value as LessonDraft["type"] })}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="text">📝 Text</option>
                            <option value="video">🎬 Video</option>
                            <option value="quiz">❓ Quiz</option>
                            <option value="pdf">📄 PDF</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600">
                            Video URL (for video type)
                          </label>
                          <input
                            value={l.videoUrl}
                            onChange={(e) => updateLesson(mi, li, { videoUrl: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600">Duration (minutes)</label>
                          <input
                            type="number"
                            min={0}
                            value={l.duration}
                            onChange={(e) => updateLesson(mi, li, { duration: Number(e.target.value) })}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          Lesson content (supports Markdown)
                        </label>
                        <textarea
                          rows={5}
                          value={l.content}
                          onChange={(e) => updateLesson(mi, li, { content: e.target.value })}
                          placeholder={"# Topic\n\nWrite your lesson content here…"}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <input
                          type="checkbox"
                          checked={l.preview}
                          onChange={(e) => updateLesson(mi, li, { preview: e.target.checked })}
                          className="accent-indigo-600"
                        />
                        Free preview (anyone can access this lesson without purchasing)
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addLesson(mi)}
                  className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600"
                >
                  + Add lesson to this module
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : initial ? "💾 Save Changes" : "🚀 Create Course"}
        </button>
      </div>
    </form>
  );
}
