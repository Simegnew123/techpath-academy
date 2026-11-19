"use client";

import { useState } from "react";
import type { PaymentMethod } from "@/lib/payments";

interface MethodConfig {
  telebirr: boolean;
  cbe: boolean;
  paypal: boolean;
  card: boolean;
  mpesa: boolean;
}

interface ManualPaymentInfo {
  account: string;
  name: string;
  note: string;
}

const METHOD_META: { id: PaymentMethod; icon: string; label: string; sub: string }[] = [
  { id: "telebirr", icon: "📲", label: "Telebirr", sub: "Ethio Telecom mobile money" },
  { id: "cbe", icon: "🏦", label: "CBE Bank Transfer", sub: "Commercial Bank of Ethiopia" },
  { id: "paypal", icon: "🅿️", label: "PayPal", sub: "International payments" },
  { id: "card", icon: "💳", label: "Card", sub: "Visa / Mastercard via Flutterwave" },
  { id: "mpesa", icon: "📱", label: "M-Pesa", sub: "Mobile money (Kenya) via Flutterwave" },
];

export default function CheckoutForm({
  courseId,
  price,
  demoMode,
  methodConfig,
  manualInfo,
}: {
  courseId: string;
  price: number;
  demoMode: boolean;
  methodConfig: MethodConfig | null;
  manualInfo: Record<"telebirr" | "cbe", ManualPaymentInfo>;
}) {
  const [method, setMethod] = useState<PaymentMethod>(
    demoMode ? "demo" : "telebirr"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAccount = (text: string) => {
    navigator.clipboard?.writeText(text.replace(/-/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout/${courseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed.");
        setLoading(false);
        return;
      }
      if (data.redirect_url) {
        window.location.href = data.redirect_url; // live payment gateway
      } else if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  // Build methods list
  let methods: { id: PaymentMethod; icon: string; label: string; sub: string }[] = [...METHOD_META];

  if (demoMode) {
    // In demo mode, all methods shown + demo option
    methods.push({
      id: "demo",
      icon: "🧪",
      label: "Demo mode",
      sub: "Simulate payment — no real money (test only)",
    });
  } else if (methodConfig) {
    // In live mode, only show configured methods
    methods = METHOD_META.filter((m) => methodConfig[m.id as keyof MethodConfig]);
  }

  const showInstructions = method === "telebirr" || method === "cbe";
  const info = showInstructions ? manualInfo[method as "telebirr" | "cbe"] : null;

  // No methods available in live mode
  if (!demoMode && methodConfig && methods.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="font-semibold text-amber-900">⚠️ No payment methods configured</p>
        <p className="mt-2 text-sm text-amber-700">
          The site administrator hasn&apos;t set up payment processing yet.
          Please contact{" "}
          <a href="mailto:ademezerihun2013@gmail.com" className="underline">
            support
          </a>{" "}
          to complete your purchase.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Demo mode banner */}
      {demoMode && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700" role="status">
          <strong className="font-semibold">🧪 Demo Mode:</strong> Payments are simulated —
          no real money is charged. This is for testing only.
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* Payment method selection */}
      <div className="space-y-2">
        <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-300" id="payment-method-label">
          Choose a payment method
        </p>
        <div role="radiogroup" aria-labelledby="payment-method-label">
          {methods.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 dark:has-[:checked]:border-indigo-500 dark:has-[:checked]:bg-indigo-950"
            >
              <input
                type="radio"
                name="method"
                value={m.id}
                checked={method === m.id}
                onChange={() => setMethod(m.id)}
                className="accent-indigo-600"
                aria-label={m.label}
              />
              <span className="text-xl" aria-hidden="true">{m.icon}</span>
              <span>
                <span className="block font-medium text-slate-800 dark:text-slate-100">{m.label}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{m.sub}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Telebirr / CBE instructions */}
      {showInstructions && info && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
          <h4 className="font-semibold text-amber-900 dark:text-amber-200">Payment Instructions</h4>
          <div className="mt-3 space-y-3 text-sm text-amber-800 dark:text-amber-300">
            <div>
              <span className="text-amber-600 dark:text-amber-400">Account holder:</span>{" "}
              <span className="font-medium">{info.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 dark:bg-slate-800">
              <div>
                <span className="text-amber-600 dark:text-amber-400">Account / Phone:</span>
                <div className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">{info.account}</div>
              </div>
              <button
                type="button"
                onClick={() => copyAccount(info.account)}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                aria-label="Copy account number to clipboard"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <p className="leading-relaxed">{info.note}</p>
            <div className="rounded-lg bg-white px-4 py-2 text-xs text-amber-700 dark:bg-slate-800 dark:text-amber-400">
              💡 After completing payment, click the button below. Your enrollment will be
              activated once payment is confirmed by our team (usually within a few minutes
              during business hours).
            </div>
          </div>
        </div>
      )}

      {/* PayPal note */}
      {method === "paypal" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          You&apos;ll be redirected to PayPal to complete your payment securely. You can pay
          with your PayPal balance, linked card, or bank account.
        </div>
      )}

      {/* Card / M-Pesa note */}
      {(method === "card" || method === "mpesa") && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300">
          You&apos;ll be redirected to Flutterwave to complete your{" "}
          {method === "mpesa" ? "M-Pesa" : "card"} payment securely.
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading
          ? "Processing…"
          : method === "telebirr" || method === "cbe"
          ? "I've completed payment →"
          : demoMode && method === "demo"
          ? "Complete (Demo)"
          : `Pay securely →`}
      </button>

      <p className="text-center text-xs text-slate-400">
        🔒 Payments are processed securely by our payment partners.
        We never store your card details.
      </p>
    </form>
  );
}
