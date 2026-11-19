"use client";

import { useState } from "react";

interface PendingPayment {
  id: string;
  userName: string;
  userEmail: string;
  courseTitle: string;
  amount: number;
  method: string;
  ref: string;
  createdAt: string;
}

export default function PaymentActions({ payment }: { payment: PendingPayment }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"pending" | "paid" | "failed">("pending");
  const [error, setError] = useState("");

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/admin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Action failed.");
        setLoading(false);
        return;
      }
      setStatus(data.status);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  };

  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        ✅ Approved
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        ❌ Rejected
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        onClick={() => handleAction("approve")}
        disabled={loading}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
        aria-label={`Approve payment from ${payment.userName}`}
      >
        ✓ Approve
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={loading}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        aria-label={`Reject payment from ${payment.userName}`}
      >
        ✕ Reject
      </button>
    </div>
  );
}
