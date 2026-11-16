"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&maxPrice=99999`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results.slice(0, 5));
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function goToSearch() {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShow(false);
    }
  }

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="flex items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShow(true); }}
          onKeyDown={(e) => { if (e.key === "Enter") goToSearch(); }}
          onFocus={() => setShow(true)}
          placeholder="Search courses..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          aria-label="Search courses"
        />
      </div>

      {show && query.trim().length >= 2 && (
        <div className="absolute top-full mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg z-50">
          {loading ? (
            <p className="p-3 text-center text-sm text-slate-400">Searching...</p>
          ) : results.length === 0 ? (
            <p className="p-3 text-center text-sm text-slate-400">No results</p>
          ) : (
            <ul role="listbox">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => { router.push(`/courses/${c.slug}`); setShow(false); setQuery(""); }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
                    role="option"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{c.title}</p>
                      <p className="text-xs text-slate-400">{c.instructor} · {c.level}</p>
                    </div>
                    <span className="text-xs text-slate-500">{c.price === 0 ? "FREE" : `KES ${c.price}`}</span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={goToSearch}
                  className="w-full border-t border-slate-100 px-3 py-2 text-center text-xs text-indigo-600 hover:bg-indigo-50"
                >
                  View all results →
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
