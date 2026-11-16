"use client";

import { useState, useEffect, useCallback } from "react";

type Note = {
  id: string;
  lessonId: string;
  timestamp: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export default function LessonNotes({
  userId,
  courseId,
  lessonId,
  videoTimestamp,
}: {
  userId: string;
  courseId: string;
  lessonId: string;
  videoTimestamp?: number;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const fetchNotes = useCallback(async () => {
    const res = await fetch(`/api/notes?courseId=${courseId}&lessonId=${lessonId}`);
    if (res.ok) {
      const data = await res.json();
      setNotes(data.notes);
    }
  }, [courseId, lessonId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  async function addNote() {
    if (!newNote.trim()) return;
    setLoading(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId, lessonId,
        timestamp: videoTimestamp ?? null,
        content: newNote,
      }),
    });
    if (res.ok) {
      setNewNote("");
      await fetchNotes();
    }
    setLoading(false);
  }

  async function saveEdit(id: string) {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", noteId: id, content: editContent }),
    });
    if (res.ok) {
      setEditingId(null);
      await fetchNotes();
    }
  }

  async function removeNote(id: string) {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", noteId: id }),
    });
    if (res.ok) await fetchNotes();
  }

  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  async function downloadStudyGuide() {
    const res = await fetch(`/api/notes?courseId=${courseId}&studyGuide=1`);
    if (res.ok) {
      const data = await res.json();
      const blob = new Blob([data.guide], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "study-guide.md";
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4" role="region" aria-label="Lesson notes">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-slate-800">
          <span aria-hidden="true">📝</span> My Notes
        </h3>
        <button
          onClick={downloadStudyGuide}
          className="text-xs text-indigo-600 hover:underline"
          aria-label="Download full study guide"
        >
          📥 Study Guide
        </button>
      </div>

      {/* Add note */}
      <div className="mb-3">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={videoTimestamp ? `Note at ${formatTime(videoTimestamp)}...` : "Write a note..."}
          className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          rows={3}
          aria-label="New note input"
        />
        <button
          onClick={addNote}
          disabled={loading || !newNote.trim()}
          className="mt-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Add Note
        </button>
      </div>

      {/* Notes list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-4">No notes yet. Start taking notes above!</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
              {editingId === note.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full rounded border border-slate-300 p-1.5 text-sm"
                    rows={2}
                  />
                  <div className="mt-1 flex gap-2">
                    <button onClick={() => saveEdit(note.id)} className="text-xs text-green-600">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-slate-400">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-700">{note.content}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {note.timestamp && <span aria-label={`Timestamp ${formatTime(note.timestamp)}`}>⏱ {formatTime(note.timestamp)} · </span>}
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                        className="text-xs text-indigo-500 hover:underline"
                      >
                        Edit
                      </button>
                      <button onClick={() => removeNote(note.id)} className="text-xs text-red-500 hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
