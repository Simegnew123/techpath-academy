"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Service = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  priceUnit: string;
  location: string;
  providerName: string;
  rating: number;
  reviewCount: number;
};

const categoryLabels: Record<string, { label: string; icon: string }> = {
  tutoring: { label: "Tutoring", icon: "📚" },
  consulting: { label: "Consulting", icon: "💡" },
  mentoring: { label: "Mentoring", icon: "🧭" },
  design: { label: "Design", icon: "🎨" },
  writing: { label: "Writing & Editing", icon: "✍️" },
  translation: { label: "Translation", icon: "🌍" },
  marketing: { label: "Marketing", icon: "📣" },
  business: { label: "Business", icon: "💼" },
  legal: { label: "Legal", icon: "⚖️" },
  health: { label: "Health & Wellness", icon: "🏥" },
  other: { label: "Other", icon: "🔧" },
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (searchQuery) params.set("search", searchQuery);
    const res = await fetch(`/api/services?${params}`);
    const data = await res.json();
    setServices(data.services || []);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchServices();
  }

  function formatPrice(price: number, unit: string) {
    if (price === 0) return "Free";
    return `${price} ETB / ${unit}`;
  }

  const categories = Object.entries(categoryLabels);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">← Home</Link>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">🛎️ Other Services</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Find tutors, consultants, mentors, and other professional services
          </p>
        </div>
        <Link
          href="/services/new"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Post a Service
        </Link>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search services, providers, or keywords..."
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100"
        />
        <button type="submit" className="rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 dark:bg-slate-700">
          Search
        </button>
      </form>

      {/* Category filter */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => { setActiveCategory("all"); setTimeout(fetchServices, 0); }}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            activeCategory === "all"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          All Services
        </button>
        {categories.map(([key, { label, icon }]) => (
          <button
            key={key}
            onClick={() => { setActiveCategory(key); setTimeout(fetchServices, 0); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeCategory === key
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Services grid */}
      {loading ? (
        <div className="mt-10 text-center text-slate-400">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="text-6xl">🛎️</div>
          <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-100">No services found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Be the first to post a service in this category!
          </p>
          <Link
            href="/services/new"
            className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Post a Service
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => {
            const cat = categoryLabels[svc.category] || { label: svc.category, icon: "🔧" };
            return (
              <Link
                key={svc.id}
                href={`/services/${svc.id}`}
                className="group rounded-2xl border border-slate-200 p-5 shadow-sm transition hover:shadow-md dark:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {cat.icon} {cat.label}
                  </span>
                  {svc.rating > 0 && (
                    <span className="text-sm font-semibold text-amber-500">
                      ⭐ {svc.rating} ({svc.reviewCount})
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-bold text-slate-800 group-hover:text-indigo-600 dark:text-slate-100">
                  {svc.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">by {svc.providerName}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{svc.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {svc.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-bold text-indigo-600">{formatPrice(svc.price, svc.priceUnit)}</span>
                  <span className="text-xs text-slate-400">📍 {svc.location}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
