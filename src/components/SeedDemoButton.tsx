"use client";

import { useState } from "react";

export default function SeedDemoButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSeed() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/seed-demo", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setError(data.error || "Failed to seed demo data.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white">
        ✅ Demo data seeded! Refreshing...
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleSeed}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "⏳ Seeding..." : "🌱 Seed Demo Data"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  );
}
