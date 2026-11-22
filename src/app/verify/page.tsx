"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyCertificatePage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) {
      router.push(`/certificates/${trimmed}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950">
          <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-slate-100">
          Verify a Certificate
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Enter the certificate ID to confirm its authenticity. Employers and recruiters
          can verify any TechPath Academy credential instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. TP-2026-XXXX"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            aria-label="Certificate ID"
            required
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
          >
            Verify
          </button>
        </div>
      </form>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">How verification works</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
          <li className="flex gap-2">
            <span className="text-indigo-500" aria-hidden="true">→</span>
            Every TechPath certificate has a unique ID (format: TP-YYYY-XXXX)
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-500" aria-hidden="true">→</span>
            Enter the ID above to view the full certificate details
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-500" aria-hidden="true">→</span>
            Verification is public — no login required
          </li>
        </ul>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
