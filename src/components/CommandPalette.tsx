"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type CommandItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action: () => void;
  group: string;
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [courses, setCourses] = useState<{ id: string; slug: string; title: string; categoryId: string }[]>([]);
  const [me, setMe] = useState<{ user: { name: string; role: string } | null }>({ user: null });
  const router = useRouter();

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Fetch courses and user
  useEffect(() => {
    if (!open) return;
    fetch("/api/courses").then(r => r.json()).then(d => {
      setCourses((d.courses || d).filter((c: any) => c.published));
    });
    fetch("/api/auth/me").then(r => r.json()).then(d => setMe(d));
  }, [open]);

  const nav = useCallback((url: string) => {
    router.push(url);
    setOpen(false);
    setQuery("");
  }, [router]);

  // Build command list
  const buildCommands = useCallback((): CommandItem[] => {
    const items: CommandItem[] = [];
    const user = me.user;

    // Navigation commands
    items.push({ id: "nav-home", title: "Home", subtitle: "Go to homepage", icon: "🏠", group: "Navigation", action: () => nav("/") });
    items.push({ id: "nav-courses", title: "Browse Courses", subtitle: "View course catalog", icon: "📚", group: "Navigation", action: () => nav("/courses") });
    items.push({ id: "nav-library", title: "Book Library", subtitle: "Browse e-books", icon: "📖", group: "Navigation", action: () => nav("/library") });
    items.push({ id: "nav-search", title: "Advanced Search", subtitle: "Search with filters", icon: "🔍", group: "Navigation", action: () => nav("/search") });

    if (user) {
      items.push({ id: "nav-dashboard", title: "My Learning Dashboard", subtitle: "View your courses", icon: "📊", group: "Navigation", action: () => nav("/dashboard") });
      items.push({ id: "nav-notifications", title: "Notifications", subtitle: "View your notifications", icon: "🔔", group: "Navigation", action: () => nav("/notifications") });

      if (user.role === "admin" || user.role === "instructor") {
        items.push({ id: "nav-admin", title: "Admin Dashboard", subtitle: "Manage courses", icon: "⚙️", group: "Admin", action: () => nav("/admin") });
        items.push({ id: "nav-admin-new", title: "Create New Course", subtitle: "Add a new course", icon: "➕", group: "Admin", action: () => nav("/admin/new") });
        items.push({ id: "nav-admin-users", title: "Manage Users", subtitle: "User management", icon: "👥", group: "Admin", action: () => nav("/admin/users") });
        items.push({ id: "nav-admin-analytics", title: "Analytics", subtitle: "Course analytics", icon: "📈", group: "Admin", action: () => nav("/admin/analytics") });
        items.push({ id: "nav-admin-grading", title: "Grading Queue", subtitle: "Grade submissions", icon: "📝", group: "Admin", action: () => nav("/admin/grading") });
        items.push({ id: "nav-admin-exam", title: "Final Exam Builder", subtitle: "Create final exams", icon: "🎓", group: "Admin", action: () => nav("/admin/exam") });
      }

      items.push({ id: "act-portfolio", title: "My Public Portfolio", subtitle: "Edit your public profile", icon: "🌐", group: "Account", action: () => nav("/portfolio") });
      items.push({ id: "act-flashcards", title: "Flashcards & Review", subtitle: "Spaced repetition study", icon: "🃏", group: "Account", action: () => nav("/flashcards") });
      items.push({ id: "act-logout", title: "Log out", subtitle: "Sign out of your account", icon: "🚪", group: "Account", action: () => { fetch("/api/auth/logout", { method: "POST" }).then(() => nav("/")); } });
    } else {
      items.push({ id: "act-login", title: "Log in", subtitle: "Sign in to your account", icon: "🔑", group: "Account", action: () => nav("/login") });
      items.push({ id: "act-register", title: "Sign up", subtitle: "Create a new account", icon: "✨", group: "Account", action: () => nav("/register") });
    }

    // Course commands
    for (const c of courses) {
      items.push({
        id: `course-${c.id}`,
        title: c.title,
        subtitle: "Open course details",
        icon: "📘",
        group: "Courses",
        action: () => nav(`/courses/${c.slug}`),
      });
    }

    return items;
  }, [courses, me, nav]);

  const allCommands = buildCommands();
  const filtered = query
    ? allCommands.filter((c) =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  // Group filtered results
  const groups = Array.from(new Set(filtered.map((c) => c.group)));

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[selectedIndex]?.action();
    }
  }

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="mt-[10vh] w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-600">
          <span className="text-slate-400" aria-hidden="true">🔍</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search courses, pages, actions... (Ctrl+K)"
            className="flex-1 bg-transparent text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            aria-label="Command palette search"
            aria-expanded={filtered.length > 0}
            aria-controls="command-results"
            role="combobox"
            aria-autocomplete="list"
          />
          <kbd className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-400 dark:border-slate-600" aria-hidden="true">ESC</kbd>
        </div>

        {/* Results */}
        <div id="command-results" className="max-h-[50vh] overflow-y-auto p-2" role="listbox" aria-label="Command results">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400" role="status">No results found</div>
          ) : (
            groups.map((group) => (
              <div key={group} className="mb-2" role="group" aria-label={group}>
                <div className="px-3 py-1 text-xs font-semibold uppercase text-slate-400" aria-hidden="true">{group}</div>
                {filtered.filter((c) => c.group === group).map((cmd) => {
                  runningIndex++;
                  const idx = runningIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                        idx === selectedIndex
                          ? "bg-indigo-50 dark:bg-indigo-900/40"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                      role="option"
                      aria-selected={idx === selectedIndex}
                    >
                      <span className="text-lg" aria-hidden="true">{cmd.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{cmd.title}</div>
                        <div className="text-xs text-slate-400 truncate">{cmd.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-xs text-slate-400 dark:border-slate-600" aria-hidden="true">
          <span>↑↓ Navigate · Enter Select · ESC Close</span>
          <span className="font-medium">TechPath Academy</span>
        </div>
      </div>
    </div>
  );
}
