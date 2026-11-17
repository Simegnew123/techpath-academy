"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type RiskFlag = {
  id: string;
  userId: string;
  courseId: string;
  riskLevel: "low" | "medium" | "high";
  reasons: string[];
  flaggedAt: string;
  resolvedAt: string | null;
  resolutionNote: string;
  userName?: string;
  courseTitle?: string;
};

export default function AtRiskPage() {
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");

  useEffect(() => {
    fetch("/api/risk-analysis")
      .then((r) => r.json())
      .then((d) => {
        setFlags(d.flags || []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function runScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/risk-analysis", { method: "POST" });
      const data = await res.json();
      setScanResult(data.message);
      // Reload flags
      const flagsRes = await fetch("/api/risk-analysis");
      const flagsData = await flagsRes.json();
      setFlags(flagsData.flags || []);
    } catch {
      setScanResult("Scan failed");
    }
    setScanning(false);
  }

  async function resolve(flagId: string) {
    await fetch("/api/risk-analysis", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagId, note: "Reviewed by admin" }),
    });
    setFlags(flags.filter((f) => f.id !== flagId));
  }

  const levelColor: Record<string, string> = {
    high: "bg-red-100 text-red-700 border-red-300",
    medium: "bg-amber-100 text-amber-700 border-amber-300",
    low: "bg-blue-100 text-blue-700 border-blue-300",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/admin" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">← Admin Dashboard</Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">⚠️ At-Risk Students</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Early warning system — flag learners showing disengagement patterns</p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {scanning ? "Scanning..." : "🔍 Run Risk Scan"}
        </button>
      </div>

      {scanResult && <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{scanResult}</div>}

      {loading ? (
        <div className="mt-8 text-center text-slate-400">Loading...</div>
      ) : flags.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <div className="text-5xl">✅</div>
          <h3 className="mt-3 text-lg font-semibold text-slate-700 dark:text-slate-100">No at-risk students detected</h3>
          <p className="mt-1 text-sm text-slate-500">Run a scan to check for disengagement patterns.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {flags.map((flag) => (
            <div key={flag.id} className={`rounded-xl border-2 p-5 ${levelColor[flag.riskLevel]}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase text-sm">{flag.riskLevel} Risk</span>
                    <span className="text-sm opacity-70">· {flag.userName}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {flag.reasons.map((r, i) => (
                      <span key={i} className="rounded-full bg-white/60 px-2.5 py-1 text-xs font-medium">
                        {r.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs opacity-60">Flagged: {new Date(flag.flaggedAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => resolve(flag.id)}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  ✓ Mark Resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
