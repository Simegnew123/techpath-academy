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

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: look up the security question
  async function lookupEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/forgot-password?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.notFound) {
        // Don't reveal if email exists — but we still need to handle it
        setError("If an account exists for that email, you'll see your security question. If not, please contact the admin.");
        setLoading(false);
        return;
      }
      if (data.notSet) {
        setError("You haven't set a security question yet. Please contact the admin to reset your password.");
        setLoading(false);
        return;
      }
      if (data.question) {
        setQuestion(data.question);
        setStep(2);
        setLoading(false);
      } else {
        setError("Something went wrong. Try again or contact the admin.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  // Step 2: verify answer + set new password
  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, answer, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed.");
        setLoading(false);
        return;
      }
      setStep(3);
      setLoading(false);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  if (step === 3) {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Password Reset!</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Your password has been changed. You can now log in with your new password.
        </p>
        <Link
          href="/login"
          className="inline-block w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (step === 2) {
    return (
      <form onSubmit={resetPassword} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Security Question</label>
          <div className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
            {question}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Your Answer</label>
          <input
            type="text"
            required
            autoFocus
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
        <button
          type="button"
          onClick={() => { setStep(1); setError(""); setAnswer(""); setNewPassword(""); setConfirmPassword(""); }}
          className="w-full text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          ← Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={lookupEmail} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? "Looking up..." : "Find My Account"}
      </button>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}

export { PRESET_QUESTIONS };
