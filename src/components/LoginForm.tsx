"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaUserId, setMfaUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }
      // MFA required?
      if (data.mfaRequired) {
        setMfaUserId(data.userId);
        setLoading(false);
        return;
      }
      window.location.href = redirectTo;
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  const verifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: mfaUserId, mfaCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "MFA verification failed.");
        setLoading(false);
        return;
      }
      window.location.href = redirectTo;
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  // MFA step
  if (mfaUserId) {
    return (
      <form onSubmit={verifyMFA} className="space-y-4">
        <div className="text-center">
          <div className="text-4xl">🔐</div>
          <h2 className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-200">Two-Factor Authentication</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Authenticator Code</label>
          <input
            type="text"
            required
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-center text-2xl tracking-widest focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading || mfaCode.length !== 6}
          className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify & Log In"}
        </button>
        <button
          type="button"
          onClick={() => { setMfaUserId(null); setMfaCode(""); setError(""); }}
          className="w-full text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          ← Back to login
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Log in"}
      </button>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        New here?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
