"use client";

import { useState } from "react";
import Link from "next/link";

const PRESET_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What was the model of your first computer?",
];

export default function SettingsForm({
  email,
  name,
  hasSecurityQuestion,
  currentQuestion,
  mfaEnabled,
}: {
  email: string;
  name: string;
  hasSecurityQuestion: boolean;
  currentQuestion: string;
  mfaEnabled: boolean;
}) {
  // --- Change Password ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (newPassword !== confirmNew) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || "Failed to change password.");
      } else {
        setPwSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNew("");
      }
    } catch {
      setPwError("Network error. Try again.");
    }
    setPwLoading(false);
  }

  // --- Security Question ---
  const [sqQuestion, setSqQuestion] = useState(currentQuestion || PRESET_QUESTIONS[0]);
  const [sqAnswer, setSqAnswer] = useState("");
  const [sqError, setSqError] = useState("");
  const [sqSuccess, setSqSuccess] = useState(false);
  const [sqLoading, setSqLoading] = useState(false);

  async function saveSecurityQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSqError("");
    setSqSuccess(false);
    if (!sqAnswer.trim()) {
      setSqError("Please enter your answer.");
      return;
    }
    setSqLoading(true);
    try {
      const res = await fetch("/api/auth/security-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: sqQuestion, answer: sqAnswer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSqError(data.error || "Failed to save security question.");
      } else {
        setSqSuccess(true);
        setSqAnswer("");
      }
    } catch {
      setSqError("Network error. Try again.");
    }
    setSqLoading(false);
  }

  // --- MFA (Two-Factor Authentication) ---
  const [mfaOn, setMfaOn] = useState(mfaEnabled);
  const [mfaStep, setMfaStep] = useState<"idle" | "setup" | "confirm">("idle");
  const [mfaQr, setMfaQr] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaConfirmCode, setMfaConfirmCode] = useState("");
  const [mfaDisableCode, setMfaDisableCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaSuccess, setMfaSuccess] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  async function startMfaSetup() {
    setMfaError(""); setMfaSuccess("");
    setMfaLoading(true);
    try {
      const res = await fetch("/api/auth/mfa-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const data = await res.json();
      if (!res.ok) { setMfaError(data.error || "Failed to start MFA setup."); setMfaLoading(false); return; }
      setMfaQr(data.qrCode);
      setMfaSecret(data.secret);
      setMfaStep("confirm");
      setMfaLoading(false);
    } catch { setMfaError("Network error."); setMfaLoading(false); }
  }

  async function confirmMfaSetup(e: React.FormEvent) {
    e.preventDefault();
    setMfaError(""); setMfaSuccess("");
    if (mfaConfirmCode.length !== 6) { setMfaError("Enter a 6-digit code."); return; }
    setMfaLoading(true);
    try {
      const res = await fetch("/api/auth/mfa-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", code: mfaConfirmCode }),
      });
      const data = await res.json();
      if (!res.ok) { setMfaError(data.error || "Invalid code."); setMfaLoading(false); return; }
      setMfaOn(true);
      setMfaStep("idle");
      setMfaConfirmCode("");
      setMfaQr("");
      setMfaSecret("");
      setMfaSuccess("MFA enabled! You'll now need your authenticator app to log in.");
      setMfaLoading(false);
    } catch { setMfaError("Network error."); setMfaLoading(false); }
  }

  async function disableMfa(e: React.FormEvent) {
    e.preventDefault();
    setMfaError(""); setMfaSuccess("");
    setMfaLoading(true);
    try {
      const res = await fetch("/api/auth/mfa-disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaDisableCode }),
      });
      const data = await res.json();
      if (!res.ok) { setMfaError(data.error || "Failed to disable MFA."); setMfaLoading(false); return; }
      setMfaOn(false);
      setMfaDisableCode("");
      setMfaSuccess("MFA disabled.");
      setMfaLoading(false);
    } catch { setMfaError("Network error."); setMfaLoading(false); }
  }

  // --- Render ---
  return (
    <div className="space-y-8">
      {/* Account Info */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Account</h2>
        <div className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400">
          <p><span className="font-medium text-slate-700 dark:text-slate-300">Name:</span> {name}</p>
          <p><span className="font-medium text-slate-700 dark:text-slate-300">Email:</span> {email}</p>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Change Password</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Know your current password? Change it here.
        </p>
        <form onSubmit={changePassword} className="mt-4 space-y-4">
          {pwError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm text-red-600 dark:text-red-400">{pwError}</div>
          )}
          {pwSuccess && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/40 px-4 py-2 text-sm text-green-600 dark:text-green-400">
              ✅ Password changed successfully!
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
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
              value={confirmNew}
              onChange={(e) => setConfirmNew(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {pwLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Security Question */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Security Question
          {hasSecurityQuestion && (
            <span className="ml-2 inline-block rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-xs text-green-700 dark:text-green-400">
              ✓ Set
            </span>
          )}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {hasSecurityQuestion
            ? "Update your security question and answer. This is used to recover your password if you forget it."
            : "You haven't set a security question yet. Set one now so you can recover your password without contacting the admin."}
        </p>
        <form onSubmit={saveSecurityQuestion} className="mt-4 space-y-4">
          {sqError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm text-red-600 dark:text-red-400">{sqError}</div>
          )}
          {sqSuccess && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/40 px-4 py-2 text-sm text-green-600 dark:text-green-400">
              ✅ Security question saved!
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Question</label>
            <select
              value={sqQuestion}
              onChange={(e) => setSqQuestion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
            >
              {PRESET_QUESTIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Answer</label>
            <input
              type="text"
              required
              value={sqAnswer}
              onChange={(e) => setSqAnswer(e.target.value)}
              placeholder="Enter your answer (case-insensitive)"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            disabled={sqLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {sqLoading ? "Saving..." : "Save Security Question"}
          </button>
        </form>
      </div>

      {/* MFA / Two-Factor Authentication */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">🔐 Two-Factor Authentication (2FA)</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add an extra layer of security. You&apos;ll need an authenticator app (Google Authenticator, Authy, etc.) to log in.
        </p>

        {mfaError && (
          <div className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{mfaError}</div>
        )}
        {mfaSuccess && (
          <div className="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-400">{mfaSuccess}</div>
        )}

        <div className="mt-4">
          {mfaOn ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                ✓ 2FA is enabled
              </div>
              <form onSubmit={disableMfa} className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Enter code to disable</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={mfaDisableCode}
                    onChange={(e) => setMfaDisableCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-center tracking-widest focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={mfaLoading || mfaDisableCode.length !== 6}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {mfaLoading ? "..." : "Disable 2FA"}
                </button>
              </form>
            </div>
          ) : mfaStep === "confirm" ? (
            <div className="space-y-4">
              {mfaQr && (
                <div className="flex flex-col items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mfaQr} alt="QR code for authenticator app" width={200} height={200} className="rounded-lg border border-slate-200 dark:border-slate-700" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Can&apos;t scan? Enter this key manually: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800 dark:text-slate-300">{mfaSecret}</code>
                  </p>
                </div>
              )}
              <form onSubmit={confirmMfaSetup} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Enter the 6-digit code from your app</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={mfaConfirmCode}
                    onChange={(e) => setMfaConfirmCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-center text-lg tracking-widest focus:border-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={mfaLoading || mfaConfirmCode.length !== 6}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {mfaLoading ? "Verifying..." : "Confirm & Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMfaStep("idle"); setMfaQr(""); setMfaSecret(""); setMfaConfirmCode(""); }}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={startMfaSetup}
              disabled={mfaLoading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {mfaLoading ? "Generating..." : "Enable 2FA"}
            </button>
          )}
        </div>
      </div>

      {/* Forgot password link */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        Forgot your password and can&apos;t log in?{" "}
        <Link href="/forgot-password" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Reset it here
        </Link>
      </div>
    </div>
  );
}
