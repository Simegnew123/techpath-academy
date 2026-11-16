"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

type SearchResult = {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  level: string;
  price: number;
  rating: number;
  instructor: string;
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [level, setLevel] = useState(searchParams.get("level") || "");
  const [freeOnly, setFreeOnly] = useState(searchParams.get("freeOnly") === "1");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function search() {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      if (level) params.set("level", level);
      if (freeOnly) params.set("freeOnly", "1");
      params.set("maxPrice", "99999");
      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
      setLoading(false);
    }
    const timer = setTimeout(search, 200);
    return () => clearTimeout(timer);
  }, [query, category, level, freeOnly]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Search Courses</h1>
      <p className="text-slate-500 mb-6">Find courses by title, instructor, or topic</p>

      {/* Search input */}
      <div className="mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for courses, topics, instructors..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          aria-label="Search courses"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>

        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          aria-label="Filter by level"
        >
          <option value="">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(e) => setFreeOnly(e.target.checked)}
            className="rounded border-slate-300"
          />
          Free only
        </label>
      </div>

      {/* Results */}
      <div className="mb-4 text-sm text-slate-500">
        {loading ? "Searching..." : `${results.length} course${results.length !== 1 ? "s" : ""} found`}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((c) => (
          <Link
            key={c.id}
            href={`/courses/${c.slug}`}
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-lg hover:border-indigo-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 group-hover:text-indigo-600">{c.title}</h3>
                <p className="mt-1 text-xs text-slate-400">by {c.instructor}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${c.price === 0 ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"}`}>
                {c.price === 0 ? "FREE" : `KES ${c.price}`}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 line-clamp-2">{c.description}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
              <span className="rounded bg-slate-100 px-2 py-0.5">{c.level}</span>
              {c.rating > 0 && <span>⭐ {c.rating}</span>}
            </div>
          </Link>
        ))}
      </div>

      {!loading && results.length === 0 && (
        <div className="text-center py-16">
          <span className="text-5xl">🔍</span>
          <p className="mt-4 text-slate-500">No courses found. Try different keywords or filters.</p>
        </div>
      )}
    </div>
  );
}
