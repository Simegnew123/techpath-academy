"use client";

import { useState } from "react";

export default function CheckoutForm({
  courseId,
  price,
  demoMode,
}: {
  courseId: string;
  price: number;
  demoMode: boolean;
}) {
  const [method, setMethod] = useState(demoMode ? "demo" : "card");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
          <input
            type="radio"
            name="method"
            value="card"
            checked={method === "card"}
            onChange={() => setMethod("card")}
            className="accent-indigo-600"
          />
          <span>
            <span className="block font-medium text-slate-800">💳 Card</span>
            <span className="text-sm text-slate-500">Visa / Mastercard</span>
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
          <input
            type="radio"
            name="method"
            value="mpesa"
            checked={method === "mpesa"}
            onChange={() => setMethod("mpesa")}
            className="accent-indigo-600"
          />
          <span>
            <span className="block font-medium text-slate-800">📱 M-Pesa</span>
            <span className="text-sm text-slate-500">Pay via mobile money</span>
          </span>
        </label>

        {demoMode && (
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
            <input
              type="radio"
              name="method"
              value="demo"
              checked={method === "demo"}
              onChange={() => setMethod("demo")}
              className="accent-emerald-600"
            />
            <span>
              <span className="block font-medium text-slate-800">🧪 Demo mode</span>
              <span className="text-sm text-slate-500">
                Simulate a successful payment — no real money (test only)
              </span>
            </span>
          </label>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? "Processing..." : `Pay ${price.toLocaleString()}`}
      </button>
    </form>
  );
}
