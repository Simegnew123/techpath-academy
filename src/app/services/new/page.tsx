"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const categories = [
  { value: "tutoring", label: "📚 Tutoring", desc: "Academic subjects, exam prep, homework help" },
  { value: "consulting", label: "💡 Consulting", desc: "Professional advice, technical guidance" },
  { value: "mentoring", label: "🧭 Mentoring", desc: "Career guidance, life coaching" },
  { value: "design", label: "🎨 Design", desc: "Graphic design, UI/UX, branding" },
  { value: "writing", label: "✍️ Writing & Editing", desc: "Content writing, proofreading, resumes" },
  { value: "translation", label: "🌍 Translation", desc: "Language translation and interpretation" },
  { value: "marketing", label: "📣 Marketing", desc: "Social media, SEO, advertising" },
  { value: "business", label: "💼 Business Services", desc: "Accounting, registration, planning" },
  { value: "legal", label: "⚖️ Legal", desc: "Legal advice, document preparation" },
  { value: "health", label: "🏥 Health & Wellness", desc: "Fitness coaching, nutrition, counseling" },
  { value: "other", label: "🔧 Other", desc: "Something else entirely" },
];

const priceUnits = ["per hour", "per session", "fixed", "negotiable"];
const contactMethods = ["email", "phone", "telegram", "whatsapp"];

export default function NewServicePage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    price: 0,
    priceUnit: "negotiable",
    location: "Online",
    contactMethod: "email",
    contactInfo: "",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.user));
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.category || !form.description) {
      setStatus("⚠️ Title, category, and description are required");
      return;
    }
    setSubmitting(true);
    setStatus("Posting...");

    const tags = form.tags
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        category: form.category,
        tags,
        price: Number(form.price) || 0,
        priceUnit: form.priceUnit,
        location: form.location,
        contactMethod: form.contactMethod,
        contactInfo: form.contactInfo,
      }),
    });
    const data = await res.json();
    if (data.service) {
      setStatus("✅ Service posted successfully! Redirecting...");
      setTimeout(() => router.push(`/services/${data.service.id}`), 1500);
    } else {
      setStatus(`❌ ${data.error || "Failed to post service"}`);
      setSubmitting(false);
    }
  }

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-5xl">🔐</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Login Required</h1>
        <p className="mt-2 text-slate-500">You need to be logged in to post a service.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/login" className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            Log in
          </Link>
          <Link href="/register" className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600">
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/services" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">← All Services</Link>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">🛎️ Post a Service</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Offer tutoring, consulting, or any professional service to the TechPath community
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Service Title *</label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Private Math Tutoring for High School Students"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-600"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Category *</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => update("category", cat.value)}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  form.category === cat.value
                    ? "border-indigo-400 bg-indigo-50 dark:bg-slate-800"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                }`}
              >
                <span className="font-semibold">{cat.label}</span>
                <br />
                <span className="text-xs text-slate-400">{cat.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe what you offer, your experience, what's included, etc."
            className="mt-1 h-32 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-600"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Tags (comma-separated)</label>
          <input
            value={form.tags}
            onChange={(e) => update("tags", e.target.value)}
            placeholder="math, algebra, high-school, exam-prep"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-600"
          />
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Price (ETB)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => update("price", Number(e.target.value))}
              min={0}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-600"
            />
            <p className="mt-1 text-xs text-slate-400">Use 0 for free services</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Pricing Unit</label>
            <select
              value={form.priceUnit}
              onChange={(e) => update("priceUnit", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-600"
            >
              {priceUnits.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Location</label>
          <input
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Online, Addis Ababa, Remote, etc."
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-600"
          />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Contact Method</label>
            <select
              value={form.contactMethod}
              onChange={(e) => update("contactMethod", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-600"
            >
              {contactMethods.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Contact Info</label>
            <input
              value={form.contactInfo}
              onChange={(e) => update("contactInfo", e.target.value)}
              placeholder="your@email.com / +251... / @telegram"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-600"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-bold text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "✨ Post Service"}
        </button>
        {status && <p className="text-center text-sm text-slate-600 dark:text-slate-300">{status}</p>}
      </form>
    </div>
  );
}
