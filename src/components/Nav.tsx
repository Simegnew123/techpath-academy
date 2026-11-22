"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";

type Me = {
  user: { name: string; role: string } | null;
};

export default function Nav() {
  const [user, setUser] = useState<Me["user"]>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Detect PWA standalone mode — hide "Get App" when already installed
  useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(mql.matches || (window.navigator as any).standalone === true);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: Me) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close menus on Escape key (WCAG 2.1.2 — no keyboard trap)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setResourcesOpen(false);
        setProfileOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  const resourcesLinks = [
    { href: "/books", label: "Library", icon: "📚" },
    { href: "/flashcards", label: "Flashcards", icon: "🃏" },
    { href: "/jobs", label: "Jobs", icon: "💼" },
    { href: "/hall-of-fame", label: "Hall of Fame", icon: "🏆" },
  ];

  const profileLinks = [
    { href: "/dashboard", label: "My Learning", icon: "📊" },
    { href: "/teams", label: "Teams", icon: "👥" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  // Admin/Instructor link shown conditionally in dropdown
  const adminLink =
    user?.role === "admin" || user?.role === "instructor"
      ? { href: "/admin", label: user.role === "admin" ? "Admin Panel" : "Instructor Panel", icon: "🛡️" }
      : null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        {/* Logo — never wraps */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap text-lg font-bold text-slate-900 dark:text-slate-100"
          aria-label="TechPath Academy — Home"
        >
          <Logo className="h-8 w-8" aria-hidden="true" />
          <span>TechPath <span className="text-indigo-600 dark:text-indigo-400">Academy</span></span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300 lg:flex"
          aria-label="Main navigation"
        >
          <Link href="/" className="whitespace-nowrap hover:text-indigo-600 dark:hover:text-indigo-400">Home</Link>
          <Link href="/courses" className="whitespace-nowrap hover:text-indigo-600 dark:hover:text-indigo-400">Courses</Link>
          <Link href="/services" className="whitespace-nowrap hover:text-indigo-600 dark:hover:text-indigo-400">Services</Link>
          {!isStandalone && (
            <Link
              href="/install"
              className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <span aria-hidden="true">📲</span> Get App
            </Link>
          )}

          {/* Resources dropdown */}
          <div ref={resourcesRef} className="relative">
            <button
              onClick={() => setResourcesOpen(!resourcesOpen)}
              className="flex items-center gap-1 whitespace-nowrap hover:text-indigo-600 dark:hover:text-indigo-400"
              aria-expanded={resourcesOpen}
              aria-haspopup="true"
              aria-controls="resources-menu"
            >
              Resources
              <svg className="h-4 w-4 transition-transform" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {resourcesOpen && (
              <div
                id="resources-menu"
                className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                role="menu"
                aria-label="Resources"
              >
                {resourcesLinks.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    onClick={() => setResourcesOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                    role="menuitem"
                  >
                    <span className="text-base" aria-hidden="true">{r.icon}</span>
                    {r.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Desktop right cluster: search + auth */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="hidden xl:block">
            <SearchBar />
          </div>
          <ThemeToggle />
          {user ? (
            <>
              <NotificationBell loggedIn={!!user} />
              {/* Profile dropdown — replaces cluttered individual links */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  aria-controls="profile-menu"
                >
                  {/* Avatar circle */}
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white dark:bg-indigo-500">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
                  <svg className="h-3.5 w-3.5 transition-transform" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                {profileOpen && (
                  <div
                    id="profile-menu"
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                    role="menu"
                    aria-label="Account menu"
                  >
                    <div className="border-b border-slate-100 px-4 py-2 dark:border-slate-700">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Signed in as</p>
                      <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{user.name}</p>
                    </div>
                    {profileLinks.map((p) => (
                      <Link
                        key={p.href}
                        href={p.href}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                        role="menuitem"
                      >
                        <span className="text-base" aria-hidden="true">{p.icon}</span>
                        {p.label}
                      </Link>
                    ))}
                    {adminLink && (
                      <Link
                        href={adminLink.href}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                        role="menuitem"
                      >
                        <span className="text-base" aria-hidden="true">{adminLink.icon}</span>
                        {adminLink.label}
                      </Link>
                    )}
                    <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                    <button
                      onClick={() => { logout(); setProfileOpen(false); }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      role="menuitem"
                    >
                      <span className="text-base" aria-hidden="true">🚪</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          ref={mobileMenuRef}
          id="mobile-menu"
          className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900 md:hidden"
        >
          <nav className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300" aria-label="Mobile navigation">
            {/* Search at top */}
            <div className="mb-2">
              <SearchBar />
            </div>
            <Link href="/" onClick={() => setMenuOpen(false)} className="py-2 hover:text-indigo-600 dark:hover:text-indigo-400">Home</Link>
            <Link href="/courses" onClick={() => setMenuOpen(false)} className="py-2 hover:text-indigo-600 dark:hover:text-indigo-400">Courses</Link>
            <Link href="/services" onClick={() => setMenuOpen(false)} className="py-2 hover:text-indigo-600 dark:hover:text-indigo-400">Services</Link>
            {!isStandalone && (
              <Link href="/install" onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-1.5 whitespace-nowrap py-2 hover:text-indigo-600 dark:hover:text-indigo-400">📲 Get the App</Link>
            )}
            <Link href="/books" onClick={() => setMenuOpen(false)} className="py-2 hover:text-indigo-600 dark:hover:text-indigo-400">📚 Library</Link>
            <Link href="/flashcards" onClick={() => setMenuOpen(false)} className="py-2 hover:text-indigo-600 dark:hover:text-indigo-400">🃏 Flashcards</Link>
            <Link href="/jobs" onClick={() => setMenuOpen(false)} className="py-2 hover:text-indigo-600 dark:hover:text-indigo-400">💼 Jobs</Link>
            <Link href="/hall-of-fame" onClick={() => setMenuOpen(false)} className="py-2 hover:text-indigo-600 dark:hover:text-indigo-400">🏆 Hall of Fame</Link>
            {user && (
              <>
                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="py-2 hover:text-indigo-600 dark:hover:text-indigo-400">📊 My Learning</Link>
                <Link href="/teams" onClick={() => setMenuOpen(false)} className="py-2 hover:text-indigo-600 dark:hover:text-indigo-400">👥 Teams</Link>
                <Link href="/settings" onClick={() => setMenuOpen(false)} className="py-2 hover:text-indigo-600 dark:hover:text-indigo-400">⚙️ Settings</Link>
                {(user?.role === "admin" || user?.role === "instructor") && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="py-2 hover:text-indigo-600 dark:hover:text-indigo-400">
                    🛡️ {user.role === "admin" ? "Admin Panel" : "Instructor Panel"}
                  </Link>
                )}
              </>
            )}
            <div className="mt-2 flex items-center gap-3 border-t border-slate-200 pt-3 dark:border-slate-700">
              <ThemeToggle />
              {user ? (
                <button onClick={() => { logout(); setMenuOpen(false); }} className="text-sm text-red-600 hover:text-red-700 dark:text-red-400" aria-label="Log out">
                  🚪 Logout
                </button>
              ) : (
                <div className="flex gap-3">
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-slate-300">Log in</Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white">Sign up</Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
