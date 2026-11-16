"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
};

const ICONS: Record<string, string> = {
  enrollment: "🎓",
  payment: "💳",
  certificate: "🏅",
  lesson_complete: "✅",
  new_course: "📖",
  new_book: "📚",
  welcome: "👋",
  admin: "🔔",
};

const TYPE_COLORS: Record<string, string> = {
  enrollment: "bg-indigo-100",
  payment: "bg-green-100",
  certificate: "bg-amber-100",
  lesson_complete: "bg-blue-100",
  new_course: "bg-purple-100",
  new_book: "bg-pink-100",
  welcome: "bg-yellow-100",
  admin: "bg-slate-100",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  }

  async function deleteNotif(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  }

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading notifications...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🔔 Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
              : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ✓ Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            filter === "unread"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications list */}
      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="text-5xl">
              {filter === "unread" ? "✨" : "🔔"}
            </div>
            <p className="mt-3 text-slate-500">
              {filter === "unread" ? "No unread notifications!" : "No notifications yet."}
            </p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 rounded-xl border p-4 transition ${
                !n.read
                  ? "border-indigo-200 bg-indigo-50/30"
                  : "border-slate-200 bg-white"
              }`}
            >
              {/* Icon */}
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${TYPE_COLORS[n.type] || "bg-slate-100"}`}>
                <span className="text-lg">{ICONS[n.type] || "🔔"}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-800">{n.title}</h3>
                  {!n.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />}
                </div>
                {n.message && (
                  <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                )}
                <span className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5">
                {n.link && (
                  <Link
                    href={n.link}
                    onClick={() => { if (!n.read) markAsRead(n.id); }}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-indigo-700"
                  >
                    View
                  </Link>
                )}
                {!n.read && !n.link && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Read
                  </button>
                )}
                <button
                  onClick={() => deleteNotif(n.id)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-400 transition hover:border-red-300 hover:text-red-500"
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
