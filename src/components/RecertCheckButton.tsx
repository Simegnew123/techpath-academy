"use client";

import { useState } from "react";

export default function RecertCheckButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCheck() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/reminders", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult(`✅ Check complete: ${data.notificationsSent} reminders sent (${data.expiringCount} expiring, ${data.expiredCount} expired)`);
      } else {
        setError(data.error || "Failed to run check");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={runCheck}
        disabled={loading}
        className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
      >
        {loading ? "⏳ Checking..." : "⏰ Run Recert Check"}
      </button>
      {result && <span className="text-sm text-green-600">{result}</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
