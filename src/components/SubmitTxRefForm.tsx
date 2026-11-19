"use client";

import { useState } from "react";

interface PendingPayment {
  id: string;
  ref: string;
  method: string;
  amount: number;
  courseTitle: string;
}

export default function SubmitTxRefForm({ payment }: { payment: PendingPayment }) {
  const [txRef, setTxRef] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Check if already submitted
  const alreadySubmitted = payment.ref.includes("|TXID:");
  const submittedTxId = alreadySubmitted
    ? payment.ref.split("|TXID:")[1]
    : "";

  if (alreadySubmitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
        <p className="text-sm font-medium text-green-800 dark:text-green-300">
          ✅ Transaction ID submitted: <span className="font-mono">{submittedTxId}</span>
        </p>
        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
          We&apos;re verifying your payment. Your course will unlock once confirmed (usually within a few hours).
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txRef.trim()) return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/payments/submit-ref", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id, txRef: txRef.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Submission failed.");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Transaction ID submitted successfully!");
      setTxRef("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const methodName = payment.method === "telebirr" ? "Telebirr" : "CBE";

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
      <h4 className="font-semibold text-amber-900 dark:text-amber-200">
        📋 Submit Your {methodName} Transaction ID
      </h4>
      <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
        You initiated a {methodName} payment of <strong>{payment.amount} KES</strong> for{" "}
        <strong>&quot;{payment.courseTitle}&quot;</strong>. After sending money via {methodName},
        enter your transaction confirmation code below so we can verify your payment.
      </p>
      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
        Your payment reference: <span className="font-mono">{payment.ref}</span>
      </p>

      {status === "success" ? (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            ✅ {message}
          </p>
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
            Please refresh this page to see the updated status.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor={`txref-${payment.id}`}
              className="mb-1 block text-sm font-medium text-amber-900 dark:text-amber-200"
            >
              {methodName} Transaction ID / Confirmation Code
            </label>
            <input
              id={`txref-${payment.id}`}
              type="text"
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
              placeholder={methodName === "Telebirr" ? "e.g. 1234567890" : "e.g. TRX12345678"}
              className="w-full rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-amber-700 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-800"
              required
              autoComplete="off"
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-red-600" role="alert">{message}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || !txRef.trim()}
            className="w-full rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-700 dark:hover:bg-amber-600"
          >
            {status === "loading" ? "Submitting..." : `Submit Transaction ID`}
          </button>
        </form>
      )}
    </div>
  );
}
