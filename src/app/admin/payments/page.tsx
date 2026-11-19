import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDB } from "@/lib/store";
import { getPaymentConfig } from "@/lib/payments";
import { formatPrice } from "@/lib/courses";
import PaymentActions from "@/components/PaymentActions";

export const revalidate = 0;

export default async function AdminPaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/admin");

  const config = getPaymentConfig();
  const db = readDB();

  // Build user + course lookup maps
  const userMap = new Map(db.users.map((u) => [u.id, u]));
  const courseMap = new Map(db.courses.map((c) => [c.id, c]));

  // Pending manual payments (Telebirr / CBE)
  const pendingPayments = db.payments
    .filter((p) => p.status === "pending" && (p.method === "telebirr" || p.method === "cbe"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Recent completed payments (last 20)
  const recentPayments = db.payments
    .filter((p) => p.status === "paid")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);

  // Provider configuration status
  const providers = [
    {
      name: "Telebirr",
      icon: "📲",
      type: "Manual",
      configured: true,
      envVars: ["TELEBIRR_ACCOUNT", "TELEBIRR_ACCOUNT_NAME"],
      helpUrl: "Manual — show your Telebirr number, admin verifies transfers",
      currentAccount: process.env.TELEBIRR_ACCOUNT || "0912-345-678 (default)",
    },
    {
      name: "CBE Bank Transfer",
      icon: "🏦",
      type: "Manual",
      configured: true,
      envVars: ["CBE_ACCOUNT", "CBE_ACCOUNT_NAME"],
      helpUrl: "Manual — show your CBE account, admin verifies transfers",
      currentAccount: process.env.CBE_ACCOUNT || "1000-2030-4050-6070 (default)",
    },
    {
      name: "PayPal",
      icon: "🅿️",
      type: "Automated",
      configured: config.methods.paypal.available,
      envVars: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_SANDBOX (optional)"],
      helpUrl: "https://developer.paypal.com → My Apps & Credentials → Create Live App",
      currentAccount: config.methods.paypal.available ? "✅ Configured" : "❌ Not set",
    },
    {
      name: "Card (Flutterwave)",
      icon: "💳",
      type: "Automated",
      configured: config.methods.card.available,
      envVars: ["FLW_SECRET_KEY", "FLW_PUBLIC_KEY"],
      helpUrl: "https://dashboard.flutterwave.com/dashboard/settings/apis",
      currentAccount: config.methods.card.available ? "✅ Configured" : "❌ Not set",
    },
    {
      name: "M-Pesa (Flutterwave)",
      icon: "📱",
      type: "Automated",
      configured: config.methods.mpesa.available,
      envVars: ["FLW_SECRET_KEY", "FLW_PUBLIC_KEY"],
      helpUrl: "https://dashboard.flutterwave.com/dashboard/settings/apis",
      currentAccount: config.methods.mpesa.available ? "✅ Configured" : "❌ Not set",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">💳 Payment Settings</h1>
          <p className="mt-1 text-slate-500">
            Configure payment providers, verify manual payments, and monitor transactions.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Mode banner */}
      <div
        className={`mt-6 rounded-2xl border p-5 ${
          config.demoMode
            ? "border-indigo-200 bg-indigo-50"
            : "border-green-200 bg-green-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.demoMode ? "🧪" : "✅"}</span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {config.demoMode ? "Demo Mode" : "Live Mode"}
            </h2>
            <p className="text-sm text-slate-600">
              {config.demoMode
                ? "All payments are simulated — no real money is charged. Set PAYMENT_MODE=live in your environment variables to start accepting real payments."
                : "Real payments are active. Students will be charged through the configured payment providers."}
            </p>
          </div>
        </div>
        <div className="mt-3 text-sm text-slate-500">
          <strong>Currency:</strong> {config.currency} ·{" "}
          <strong>Configured methods:</strong> {config.configuredCount}/5
        </div>
      </div>

      {/* How to go live */}
      {config.demoMode && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="font-bold text-amber-900">📋 How to switch to Live Mode</h3>
          <ol className="mt-3 space-y-2 text-sm text-amber-800">
            <li>
              <strong>1.</strong> Get credentials from at least one automated provider:
              <ul className="ml-6 mt-1 list-disc">
                <li>PayPal: Create a live app at developer.paypal.com</li>
                <li>Flutterwave: Get API keys at dashboard.flutterwave.com (covers Card + M-Pesa)</li>
              </ul>
            </li>
            <li>
              <strong>2.</strong> Set these environment variables on Render (Environment tab):
              <ul className="ml-6 mt-1 list-disc">
                <li><code className="rounded bg-amber-100 px-1">PAYMENT_MODE=live</code></li>
                <li><code className="rounded bg-amber-100 px-1">SITE_URL=https://techpath-academy.onrender.com</code></li>
                <li><code className="rounded bg-amber-100 px-1">PAYPAL_CLIENT_ID</code> + <code className="rounded bg-amber-100 px-1">PAYPAL_CLIENT_SECRET</code></li>
                <li><code className="rounded bg-amber-100 px-1">FLW_SECRET_KEY</code> + <code className="rounded bg-amber-100 px-1">FLW_PUBLIC_KEY</code></li>
                <li><code className="rounded bg-amber-100 px-1">TELEBIRR_ACCOUNT</code> + <code className="rounded bg-amber-100 px-1">CBE_ACCOUNT</code> (your real account numbers)</li>
              </ul>
            </li>
            <li>
              <strong>3.</strong> Redeploy — payments will be live immediately.
            </li>
          </ol>
        </div>
      )}

      {/* Provider status cards */}
      <h2 className="mt-8 text-xl font-bold text-slate-900">Payment Providers</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl border p-5 ${
              p.configured
                ? "border-green-200 bg-green-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{p.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  <span className="text-xs text-slate-500">{p.type}</span>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  p.configured
                    ? "bg-green-200 text-green-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {p.configured ? "✅ Ready" : "⚠️ Not set"}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <div>
                <strong>Status:</strong> {p.currentAccount}
              </div>
              <div>
                <strong>Env vars:</strong>{" "}
                <code className="rounded bg-white px-1 dark:bg-slate-800">{p.envVars.join(", ")}</code>
              </div>
              {p.helpUrl.startsWith("http") ? (
                <div>
                  <strong>Get keys:</strong>{" "}
                  <a
                    href={p.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Open dashboard →
                  </a>
                </div>
              ) : (
                <div>
                  <strong>How:</strong> {p.helpUrl}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pending manual payments */}
      <h2 className="mt-8 text-xl font-bold text-slate-900">
        ⏳ Pending Manual Payments
        {pendingPayments.length > 0 && (
          <span className="ml-2 rounded-full bg-amber-200 px-2.5 py-0.5 text-sm font-semibold text-amber-800">
            {pendingPayments.length}
          </span>
        )}
      </h2>
      {pendingPayments.length === 0 ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
          No pending manual payments. Students&apos; Telebirr/CBE payments will appear here for verification.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingPayments.map((p) => {
                const u = userMap.get(p.userId);
                const c = courseMap.get(p.courseId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{u?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500">{u?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c?.title || "Unknown course"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        {p.method === "telebirr" ? "Telebirr" : "CBE"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.ref}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentActions
                        payment={{
                          id: p.id,
                          userName: u?.name || "Unknown",
                          userEmail: u?.email || "",
                          courseTitle: c?.title || "",
                          amount: p.amount,
                          method: p.method,
                          ref: p.ref,
                          createdAt: p.createdAt,
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent completed payments */}
      <h2 className="mt-8 text-xl font-bold text-slate-900">💰 Recent Completed Payments</h2>
      {recentPayments.length === 0 ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
          No completed payments yet.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPayments.map((p) => {
                const u = userMap.get(p.userId);
                const c = courseMap.get(p.courseId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{u?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500">{u?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c?.title || "Unknown course"}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.ref}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
