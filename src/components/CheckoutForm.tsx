"use client";

import { useState } from "react";

type Method = "telebirr" | "cbe" | "paypal" | "card" | "mpesa" | "demo";

const PAYMENT_INFO: Record<string, { account: string; name: string; note: string }> = {
  telebirr: {
    account: "0912-345-678",
    name: "TechPath Academy",
    note: "Open the Telebirr app or dial *127# → Send Money → Enter the number above. Use your email as the reference.",
  },
  cbe: {
    account: "1000-2030-4050-6070",
    name: "TechPath Academy Pvt. Ltd.",
    note: "Transfer to the CBE account above via CBE Birr, CBE Internet Banking, or bank visit. Email your transfer receipt to admin@techpath.academy.",
  },
};

export default function CheckoutForm({
  courseId,
  price,
  demoMode,
}: {
  courseId: string;
  price: number;
  demoMode: boolean;
}) {
  const [method, setMethod] = useState<Method>(demoMode ? "demo" : "card");
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

  const methods: { id: Method; icon: string; label: string; sub: string }[] = [
    { id: "telebirr", icon: "📲", label: "Telebirr", sub: "Ethio Telecom mobile money" },
    { id: "cbe", icon: "🏦", label: "CBE Bank Transfer", sub: "Commercial Bank of Ethiopia" },
    { id: "paypal", icon: "🅿️", label: "PayPal", sub: "International payments" },
    { id: "card", icon: "💳", label: "Card", sub: "Visa / Mastercard" },
    { id: "mpesa", icon: "📱", label: "M-Pesa", sub: "Mobile money (Kenya)" },
  ];

  if (demoMode) {
    methods.push({
      id: "demo",
      icon: "🧪",
      label: "Demo mode",
      sub: "Simulate payment — no real money (test only)",
    });
  }

  const showInstructions = method === "telebirr" || method === "cbe";
  const info = PAYMENT_INFO[method];

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      {/* Payment method selection */}
      <div className="space-y-2">
        <p className="mb-1 text-sm font-medium text-slate-600">Choose a payment method</p>
        {methods.map((m) => (
          <label
            key={m.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 hover:border-slate-300"
          >
            <input
              type="radio"
              name="method"
              value={m.id}
              checked={method === m.id}
              onChange={() => setMethod(m.id)}
              className="accent-indigo-600"
            />
            <span className="text-xl">{m.icon}</span>
            <span>
              <span className="block font-medium text-slate-800">{m.label}</span>
              <span className="text-sm text-slate-500">{m.sub}</span>
            </span>
          </label>
        ))}
      </div>

      {/* Telebirr / CBE instructions */}
      {showInstructions && info && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h4 className="font-semibold text-amber-900">Payment Instructions</h4>
          <div className="mt-3 space-y-3 text-sm text-amber-800">
            <div>
              <span className="text-amber-600">Account holder:</span>{" "}
              <span className="font-medium">{info.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
              <div>
                <span className="text-amber-600">Account / Phone:</span>
                <div className="font-mono text-lg font-bold text-slate-900">{info.account}</div>
              </div>
              <button
                type="button"
                onClick={() => copyAccount(info.account)}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <p className="leading-relaxed">{info.note}</p>
            <div className="rounded-lg bg-white px-4 py-2 text-xs text-amber-700">
              💡 After completing payment, click the button below. Your enrollment will be
              activated once payment is confirmed (usually within a few minutes).
            </div>
          </div>
        </div>
      )}

      {/* PayPal note */}
      {method === "paypal" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          You&apos;ll be redirected to PayPal to complete your payment securely. You can pay
          with your PayPal balance, linked card, or bank account.
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading
          ? "Processing..."
          : showInstructions
            ? `I've paid — Confirm enrollment`
            : `Pay ${price.toLocaleString()}`}
      </button>

      <p className="text-center text-xs text-slate-400">
        🔒 Your payment is secure. By proceeding you agree to our Terms of Service.
      </p>
    </form>
  );
}
