"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Competency = { id: string; name: string; description: string; category: string };

export default function SkillMatrixPage() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    fetch("/api/competencies")
      .then((r) => r.json())
      .then((d) => setCompetencies(d.competencies || []))
      .finally(() => setLoading(false));
  }, []);

  async function createCompetency() {
    const res = await fetch("/api/competencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name: newName, description: newDesc, category: newCat || "General" }),
    });
    const data = await res.json();
    if (data.competency) {
      setCompetencies([...competencies, data.competency]);
      setNewName(""); setNewDesc(""); setNewCat("");
      setShowCreate(false);
    }
  }

  const categories = [...new Set(competencies.map((c) => c.category))];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/admin" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">← Admin Dashboard</Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">🎯 Skill & Competency Matrix</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Define competencies and map them to lessons for skill tracking</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Add Competency
        </button>
      </div>

      {showCreate && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Competency name (e.g. Network Troubleshooting)"
            className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-600"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Short description"
            className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-600"
          />
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Category (e.g. Networking)"
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-600"
          />
          <button
            onClick={createCompetency}
            disabled={!newName}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Create
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 text-center text-slate-400">Loading...</div>
      ) : (
        <div className="mt-6 space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{cat}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {competencies
                  .filter((c) => c.category === cat)
                  .map((c) => (
                    <div key={c.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">{c.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
