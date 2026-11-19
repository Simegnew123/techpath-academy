"use client";

import Link from "next/link";
import { useState } from "react";

const PRESET_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What was the model of your first computer?",
];

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState(PRESET_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, securityQuestion, securityAnswer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" aria-label="Registration form">
      {error && (
        <div role="alert" aria-live="assertive" className="rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
      <div>
        <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
        <input
          id="reg-name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
        <input
          id="reg-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
        <input
          id="reg-password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="password-hint"
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
        />
        <p id="password-hint" className="mt-1 text-xs text-slate-400">At least 6 characters.</p>
      </div>

      {/* Security Question */}
      <fieldset className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <legend className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          <span aria-hidden="true">🔒 </span>Security Question
        </legend>
        <p className="mt-1 text-xs text-slate-400">
          Used to recover your password if you forget it. You can skip this, but then only the admin can reset your password.
        </p>
        <div className="mt-3">
          <label htmlFor="reg-security-q" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Question</label>
          <select
            id="reg-security-q"
            value={securityQuestion}
            onChange={(e) => setSecurityQuestion(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
          >
            {PRESET_QUESTIONS.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
        <div className="mt-2">
          <label htmlFor="reg-security-a" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Answer</label>
          <input
            id="reg-security-a"
            type="text"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            placeholder="Your answer (case-insensitive)"
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        aria-disabled={loading}
        className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
      <p className="text-center text-xs text-slate-400">
        The very first account created becomes the admin.
      </p>
    </form>
  );
}
