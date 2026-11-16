"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type AuditLog = {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ip: string;
  createdAt: string;
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-blue-100 text-blue-700",
  CREATE_COURSE: "bg-green-100 text-green-700",
  EDIT_COURSE: "bg-yellow-100 text-yellow-700",
  DELETE_COURSE: "bg-red-100 text-red-700",
  VERIFY_PAYMENT: "bg-purple-100 text-purple-700",
  ADD_BOOK: "bg-green-100 text-green-700",
  DELETE_BOOK: "bg-red-100 text-red-700",
  ROLE_CHANGE: "bg-orange-100 text-orange-700",
  EXPORT_DATA: "bg-indigo-100 text-indigo-700",
  CREATE_QUIZ: "bg-purple-100 text-purple-700",
  DELETE_QUIZ: "bg-red-100 text-red-700",
  QUIZ_CHEATING_FLAG: "bg-red-100 text-red-700",
};

const ACTION_ICONS: Record<string, string> = {
  LOGIN: "🔐",
  CREATE_COURSE: "➕",
  EDIT_COURSE: "✏️",
  DELETE_COURSE: "🗑️",
  VERIFY_PAYMENT: "💳",
  ADD_BOOK: "📚",
  DELETE_BOOK: "🗑️",
  ROLE_CHANGE: "👥",
  EXPORT_DATA: "📥",
  CREATE_QUIZ: "📝",
  DELETE_QUIZ: "🗑️",
  QUIZ_CHEATING_FLAG: "⚠️",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch(`/api/audit-logs?limit=100&offset=${offset}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [offset]);

  const filtered = filter
    ? logs.filter((l) =>
        l.action.toLowerCase().includes(filter.toLowerCase()) ||
        l.userName.toLowerCase().includes(filter.toLowerCase()) ||
        l.details.toLowerCase().includes(filter.toLowerCase())
      )
    : logs;

  const exportData = (type: string) => {
    window.open(`/api/export?type=${type}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">📋 Audit Logs</h1>
              <p className="text-sm text-slate-500 mt-1">{total} total events recorded</p>
            </div>
            <Link href="/admin" className="text-sm text-indigo-600 hover:text-indigo-700">
              ← Back to Admin
            </Link>
          </div>
        </div>

        {/* Data Export */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-700 mb-2">📥 Data Export (CSV)</h2>
          <div className="flex gap-3">
            <button onClick={() => exportData("users")} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Export Users
            </button>
            <button onClick={() => exportData("enrollments")} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Export Enrollments
            </button>
            <button onClick={() => exportData("payments")} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Export Payments
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Filter by action, user, or details..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
          />
        </div>

        {/* Logs Table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading audit logs...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No audit logs found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition">
                  <span className="text-xl mt-0.5">{ACTION_ICONS[log.action] || "📌"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"}`}>
                        {log.action}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{log.userName}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 100 && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => setOffset(Math.max(0, offset - 100))}
              disabled={offset === 0}
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-white"
            >
              ← Previous
            </button>
            <span className="text-sm text-slate-500">
              {offset + 1}–{Math.min(offset + 100, total)} of {total}
            </span>
            <button
              onClick={() => setOffset(offset + 100)}
              disabled={offset + 100 >= total}
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-white"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
