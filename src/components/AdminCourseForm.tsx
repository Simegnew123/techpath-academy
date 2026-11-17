"use client";

import { useState } from "react";

export type CategoryOption = { id: string; name: string; slug: string; icon: string };

type LabStepDraft = {
  instruction: string;
  expectedCommand: string;
  hint: string;
};

type LabCommandDraft = {
  command: string;
  output: string;
  success: boolean;
};

type LessonDraft = {
  id?: string;
  title: string;
  videoUrl: string;
  content: string;
  type: "text" | "video" | "quiz" | "pdf" | "ctf" | "lab";
  duration: number;
  preview: boolean;
  // CTF config (only used when type === "ctf")
  ctfFlag?: string;
  ctfCategory?: string;
  ctfDifficulty?: string;
  ctfPoints?: number;
  ctfHint?: string;
  ctfMaxAttempts?: number;
  ctfDescription?: string;
  // Lab config (only used when type === "lab")
  labType?: string;
  labEnvironment?: string;
  labTimeLimit?: number;
  labSteps?: LabStepDraft[];
  labCommands?: LabCommandDraft[];
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
            // CTF config
            ...(l.type === "ctf" ? {
              ctfFlag: l.ctfFlag || "",
              ctfCategory: l.ctfCategory || "misc",
              ctfDifficulty: l.ctfDifficulty || "easy",
              ctfPoints: Number(l.ctfPoints) || 50,
              ctfHint: l.ctfHint || "",
              ctfMaxAttempts: Number(l.ctfMaxAttempts) || 0,
              ctfDescription: l.ctfDescription || "",
            } : {}),
            // Lab config
            ...(l.type === "lab" ? {
              labType: l.labType || "terminal",
              labEnvironment: l.labEnvironment || "Linux Terminal",
              labTimeLimit: Number(l.labTimeLimit) || 0,
              labSteps: l.labSteps || [],
              labCommands: l.labCommands || [],
            } : {}),
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
                            <option value="ctf">🚩 CTF Challenge</option>
                            <option value="lab">💻 Interactive Lab</option>
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

                      {/* CTF Challenge Configuration */}
                      {l.type === "ctf" && (
                        <div className="rounded-lg border-2 border-red-200 bg-red-50/50 p-4">
                          <h4 className="text-sm font-bold text-red-700">🚩 CTF Challenge Configuration</h4>
                          <p className="mt-0.5 text-xs text-red-500">
                            The flag is stored as a SHA-256 hash — never sent to the browser in plain text.
                          </p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="block text-xs font-medium text-slate-600">Flag *</label>
                              <input
                                value={l.ctfFlag || ""}
                                onChange={(e) => updateLesson(mi, li, { ctfFlag: e.target.value })}
                                placeholder="e.g. flag{sql_injection_101}"
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-red-500 focus:outline-none"
                              />
                              <p className="mt-0.5 text-xs text-slate-400">Case-insensitive comparison</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600">Category</label>
                              <select
                                value={l.ctfCategory || "misc"}
                                onChange={(e) => updateLesson(mi, li, { ctfCategory: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                              >
                                <option value="crypto">🔐 Crypto</option>
                                <option value="forensics">🔍 Forensics</option>
                                <option value="network">🌐 Network</option>
                                <option value="web">🕸️ Web</option>
                                <option value="linux">🐧 Linux</option>
                                <option value="reverse">🔄 Reverse Engineering</option>
                                <option value="misc">🎯 Misc</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600">Difficulty</label>
                              <select
                                value={l.ctfDifficulty || "easy"}
                                onChange={(e) => updateLesson(mi, li, { ctfDifficulty: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                              >
                                <option value="easy">🟢 Easy</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="hard">🟠 Hard</option>
                                <option value="expert">🔴 Expert</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600">Points (XP)</label>
                              <input
                                type="number"
                                min={0}
                                value={l.ctfPoints ?? 50}
                                onChange={(e) => updateLesson(mi, li, { ctfPoints: Number(e.target.value) })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600">Max Attempts (0 = unlimited)</label>
                              <input
                                type="number"
                                min={0}
                                value={l.ctfMaxAttempts ?? 0}
                                onChange={(e) => updateLesson(mi, li, { ctfMaxAttempts: Number(e.target.value) })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-slate-600">Challenge Description (shown to students)</label>
                            <textarea
                              rows={2}
                              value={l.ctfDescription || ""}
                              onChange={(e) => updateLesson(mi, li, { ctfDescription: e.target.value })}
                              placeholder="Find the hidden flag in the network capture file..."
                              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                            />
                          </div>
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-slate-600">Hint (shown after 3 failed attempts)</label>
                            <input
                              value={l.ctfHint || ""}
                              onChange={(e) => updateLesson(mi, li, { ctfHint: e.target.value })}
                              placeholder="Try using grep to search for 'flag{' in the file..."
                              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Interactive Lab Configuration */}
                      {l.type === "lab" && (
                        <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50/50 p-4">
                          <h4 className="text-sm font-bold text-indigo-700">💻 Interactive Lab Configuration</h4>
                          <p className="mt-0.5 text-xs text-indigo-500">
                            Students practice in a guided terminal. Add steps with expected commands.
                          </p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600">Lab Type</label>
                              <select
                                value={l.labType || "terminal"}
                                onChange={(e) => updateLesson(mi, li, { labType: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                              >
                                <option value="terminal">Terminal</option>
                                <option value="cli_challenge">CLI Challenge</option>
                                <option value="network_sim">Network Simulation</option>
                                <option value="packet_capture">Packet Capture</option>
                                <option value="firewall_config">Firewall Config</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600">Environment</label>
                              <input
                                value={l.labEnvironment || ""}
                                onChange={(e) => updateLesson(mi, li, { labEnvironment: e.target.value })}
                                placeholder="Kali Linux 2024.1 | 2 vCPU | 4GB RAM"
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600">Time Limit (min, 0=no limit)</label>
                              <input
                                type="number"
                                min={0}
                                value={l.labTimeLimit ?? 0}
                                onChange={(e) => updateLesson(mi, li, { labTimeLimit: Number(e.target.value) })}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Lab Steps */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-medium text-slate-600">Guided Steps</label>
                              <button
                                type="button"
                                onClick={() => updateLesson(mi, li, {
                                  labSteps: [...(l.labSteps || []), { instruction: "", expectedCommand: "", hint: "" }],
                                })}
                                className="text-xs text-indigo-600 hover:underline"
                              >
                                + Add Step
                              </button>
                            </div>
                            {(l.labSteps || []).map((step, si) => (
                              <div key={si} className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-400">Step {si + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateLesson(mi, li, {
                                      labSteps: (l.labSteps || []).filter((_, idx) => idx !== si),
                                    })}
                                    className="text-xs text-red-500 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <input
                                  value={step.instruction}
                                  onChange={(e) => updateLesson(mi, li, {
                                    labSteps: (l.labSteps || []).map((s, idx) => idx === si ? { ...s, instruction: e.target.value } : s),
                                  })}
                                  placeholder="Instruction: e.g. 'List all files including hidden ones'"
                                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                                />
                                <input
                                  value={step.expectedCommand}
                                  onChange={(e) => updateLesson(mi, li, {
                                    labSteps: (l.labSteps || []).map((s, idx) => idx === si ? { ...s, expectedCommand: e.target.value } : s),
                                  })}
                                  placeholder="Expected command: e.g. 'ls -la'"
                                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                                />
                                <input
                                  value={step.hint}
                                  onChange={(e) => updateLesson(mi, li, {
                                    labSteps: (l.labSteps || []).map((s, idx) => idx === si ? { ...s, hint: e.target.value } : s),
                                  })}
                                  placeholder="Hint: e.g. 'Use the -a flag to show hidden files'"
                                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                            ))}
                            {(!l.labSteps || l.labSteps.length === 0) && (
                              <p className="mt-1 text-xs text-slate-400">No steps yet. Click "+ Add Step" to create guided lab steps.</p>
                            )}
                          </div>

                          {/* Lab Commands (optional — simulated command outputs) */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-medium text-slate-600">Simulated Commands (optional)</label>
                              <button
                                type="button"
                                onClick={() => updateLesson(mi, li, {
                                  labCommands: [...(l.labCommands || []), { command: "", output: "", success: true }],
                                })}
                                className="text-xs text-indigo-600 hover:underline"
                              >
                                + Add Command
                              </button>
                            </div>
                            {(l.labCommands || []).map((cmd, ci) => (
                              <div key={ci} className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-400">Command {ci + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateLesson(mi, li, {
                                      labCommands: (l.labCommands || []).filter((_, idx) => idx !== ci),
                                    })}
                                    className="text-xs text-red-500 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <input
                                  value={cmd.command}
                                  onChange={(e) => updateLesson(mi, li, {
                                    labCommands: (l.labCommands || []).map((c, idx) => idx === ci ? { ...c, command: e.target.value } : c),
                                  })}
                                  placeholder="Command: e.g. 'whoami'"
                                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                                />
                                <textarea
                                  rows={2}
                                  value={cmd.output}
                                  onChange={(e) => updateLesson(mi, li, {
                                    labCommands: (l.labCommands || []).map((c, idx) => idx === ci ? { ...c, output: e.target.value } : c),
                                  })}
                                  placeholder="Simulated output: e.g. 'root'"
                                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                                />
                                <label className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                  <input
                                    type="checkbox"
                                    checked={cmd.success}
                                    onChange={(e) => updateLesson(mi, li, {
                                      labCommands: (l.labCommands || []).map((c, idx) => idx === ci ? { ...c, success: e.target.checked } : c),
                                    })}
                                    className="accent-indigo-600"
                                  />
                                  Success command
                                </label>
                              </div>
                            ))}
                            {(!l.labCommands || l.labCommands.length === 0) && (
                              <p className="mt-1 text-xs text-slate-400">No simulated commands. Students can still type any command — these provide realistic responses.</p>
                            )}
                          </div>
                        </div>
                      )}

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
