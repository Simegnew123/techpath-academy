"use client";

import { useState, useEffect, useRef } from "react";
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell({ loggedIn }: { loggedIn: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loggedIn) return;
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [loggedIn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=8");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      // ignore
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  }

  if (!loggedIn) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-indigo-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-3xl">🔔</div>
                <p className="mt-2 text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                    if (n.link) {
                      window.location.href = n.link;
                    }
                  }}
                  className={`flex cursor-pointer gap-3 border-b border-slate-50 px-4 py-3 transition hover:bg-slate-50 ${
                    !n.read ? "bg-indigo-50/40" : ""
                  }`}
                >
                  <div className="text-xl flex-shrink-0">
                    {ICONS[n.type] || "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">{n.title}</span>
                      {!n.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />}
                    </div>
                    {n.message && (
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.message}</p>
                    )}
                    <span className="mt-0.5 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-medium text-indigo-600 transition hover:bg-slate-50"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
