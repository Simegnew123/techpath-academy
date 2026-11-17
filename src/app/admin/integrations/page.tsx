"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Webhook = {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
};

export default function IntegrationsPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [whUrl, setWhUrl] = useState("");
  const [whEvents, setWhEvents] = useState("course.completed, user.enrolled, certificate.issued");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [botStatus, setBotStatus] = useState("");

  useEffect(() => {
    fetch("/api/webhooks")
      .then((r) => r.json())
      .then((d) => setWebhooks(d.webhooks || []))
      .finally(() => setLoading(false));
  }, []);

  async function addWebhook() {
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: whUrl,
        events: whEvents.split(",").map((e) => e.trim()),
        isActive: true,
      }),
    });
    const data = await res.json();
    if (data.webhook) {
      setWebhooks([...webhooks, data.webhook]);
      setWhUrl("");
      setShowAdd(false);
    }
  }

  async function deleteWebhook(id: string) {
    await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" });
    setWebhooks(webhooks.filter((w) => w.id !== id));
  }

  async function toggleWebhook(wh: Webhook) {
    await fetch("/api/webhooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: wh.id, isActive: !wh.isActive }),
    });
    setWebhooks(webhooks.map((w) => (w.id === wh.id ? { ...w, isActive: !w.isActive } : w)));
  }

  async function testTelegram() {
    if (!telegramChatId) return;
    setBotStatus("Sending test message...");
    const res = await fetch("/api/bot-integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", platform: "telegram", chatId: telegramChatId }),
    });
    const data = await res.json();
    if (data.success) {
      setBotStatus("✅ Test message sent! Check your Telegram.");
    } else {
      setBotStatus(`❌ ${data.error}`);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">← Admin Dashboard</Link>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">🔌 Integrations</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Connect external services to TechPath Academy</p>

      {/* Webhooks Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Webhooks</h2>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Add Webhook
          </button>
        </div>

        {showAdd && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <input
              value={whUrl}
              onChange={(e) => setWhUrl(e.target.value)}
              placeholder="https://your-app.com/webhook"
              className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-600"
            />
            <input
              value={whEvents}
              onChange={(e) => setWhEvents(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-600"
            />
            <button
              onClick={addWebhook}
              disabled={!whUrl}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Create Webhook
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-4 text-slate-400">Loading...</div>
        ) : webhooks.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No webhooks configured.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {webhooks.map((wh) => (
              <div key={wh.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{wh.url}</p>
                  <p className="text-xs text-slate-500">{wh.events.join(" · ")}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleWebhook(wh)}
                    className={`rounded px-2 py-1 text-xs font-medium ${wh.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {wh.isActive ? "Active" : "Paused"}
                  </button>
                  <button
                    onClick={() => deleteWebhook(wh.id)}
                    className="rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Telegram Bot Section */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Telegram Bot</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Send study reminders and notifications to students via Telegram. Set <code className="rounded bg-slate-100 px-1">TELEGRAM_BOT_TOKEN</code> in your environment variables.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            placeholder="Telegram Chat ID (e.g. 123456789)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-600"
          />
          <button
            onClick={testTelegram}
            disabled={!telegramChatId}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
          >
            Send Test
          </button>
        </div>
        {botStatus && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{botStatus}</p>}
      </div>
    </div>
  );
}
