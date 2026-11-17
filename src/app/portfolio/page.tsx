"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Portfolio = {
  slug: string;
  bio: string;
  headline: string;
  location: string;
  website: string;
  linkedinUrl: string;
  githubUrl: string;
  isPublic: boolean;
};

export default function PortfolioEditorPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/portfolios")
      .then((r) => r.json())
      .then((d) => {
        setPortfolio(d.portfolio || {
          slug: "",
          bio: "",
          headline: "",
          location: "",
          website: "",
          linkedinUrl: "",
          githubUrl: "",
          isPublic: false,
        });
        setUser(d.user);
      });
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(portfolio),
    });
    if (res.ok) {
      const data = await res.json();
      setPortfolio(data.portfolio);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  if (!portfolio) return <div className="mx-auto max-w-2xl px-4 py-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">🌐 My Public Portfolio</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Create a shareable public profile showcasing your certificates and completed courses.
        {portfolio.slug && portfolio.isPublic && (
          <> Share it at <code className="rounded bg-slate-100 px-1.5 py-0.5 text-indigo-600 dark:bg-slate-700">/@{portfolio.slug}</code></>
        )}
      </p>

      <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        {/* Headline */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Headline</label>
          <input
            type="text"
            value={portfolio.headline}
            onChange={(e) => setPortfolio({ ...portfolio, headline: e.target.value })}
            placeholder="e.g. Network Engineer in training"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Bio</label>
          <textarea
            value={portfolio.bio}
            onChange={(e) => setPortfolio({ ...portfolio, bio: e.target.value })}
            placeholder="Tell the world about yourself..."
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
          <input
            type="text"
            value={portfolio.location}
            onChange={(e) => setPortfolio({ ...portfolio, location: e.target.value })}
            placeholder="e.g. Nairobi, Kenya"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
          />
        </div>

        {/* Links */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
            <input
              type="url"
              value={portfolio.website}
              onChange={(e) => setPortfolio({ ...portfolio, website: e.target.value })}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">LinkedIn URL</label>
            <input
              type="url"
              value={portfolio.linkedinUrl}
              onChange={(e) => setPortfolio({ ...portfolio, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/in/..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">GitHub URL</label>
          <input
            type="url"
            value={portfolio.githubUrl}
            onChange={(e) => setPortfolio({ ...portfolio, githubUrl: e.target.value })}
            placeholder="https://github.com/..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
          />
        </div>

        {/* Public toggle */}
        <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
          <input
            type="checkbox"
            checked={portfolio.isPublic}
            onChange={(e) => setPortfolio({ ...portfolio, isPublic: e.target.checked })}
            className="h-5 w-5 rounded border-slate-300"
          />
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Make portfolio public</span>
            <p className="text-xs text-slate-500">When enabled, your profile is visible at /@yourname</p>
          </div>
        </label>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Portfolio"}
          </button>
          {saved && <span className="text-sm text-green-600">✅ Saved!</span>}
          {portfolio.isPublic && portfolio.slug && (
            <Link
              href={`/@${portfolio.slug}`}
              className="ml-auto text-sm text-indigo-600 hover:underline"
            >
              View public profile →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
