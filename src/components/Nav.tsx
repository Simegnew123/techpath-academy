"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = {
  user: { name: string; role: string } | null;
};

export default function Nav() {
  const [user, setUser] = useState<Me["user"]>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: Me) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
          <span>🎓</span>
          <span>TechPath <span className="text-indigo-600">Academy</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
          <Link href="/" className="hover:text-indigo-600">Home</Link>
          <Link href="/courses" className="hover:text-indigo-600">Courses</Link>
          <Link href="/#free-tutorials" className="hover:text-indigo-600">Free Tutorials</Link>
          {user && (
            <Link href="/dashboard" className="hover:text-indigo-600">My Learning</Link>
          )}
          {(user?.role === "admin" || user?.role === "instructor") && (
            <Link href="/admin" className="hover:text-indigo-600">
              {user.role === "admin" ? "Admin" : "Instructor"}
            </Link>
          )}
        </nav>

        {/* Desktop auth */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                Hi, {user.name.split(" ")[0]}
              </span>
              <button
                onClick={logout}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-indigo-600"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-600">
            <Link href="/" onClick={() => setMenuOpen(false)} className="hover:text-indigo-600">Home</Link>
            <Link href="/courses" onClick={() => setMenuOpen(false)} className="hover:text-indigo-600">Courses</Link>
            <Link href="/#free-tutorials" onClick={() => setMenuOpen(false)} className="hover:text-indigo-600">Free Tutorials</Link>
            {user && (
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="hover:text-indigo-600">My Learning</Link>
            )}
            {(user?.role === "admin" || user?.role === "instructor") && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="hover:text-indigo-600">
                {user.role === "admin" ? "Admin Dashboard" : "Instructor Dashboard"}
              </Link>
            )}
            <div className="mt-2 border-t border-slate-100 pt-3">
              {user ? (
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  Logout ({user.name.split(" ")[0]})
                </button>
              ) : (
                <div className="flex gap-3">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-center hover:bg-slate-50"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-center text-white hover:bg-indigo-700"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
