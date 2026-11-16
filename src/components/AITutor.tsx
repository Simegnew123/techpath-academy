"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "student" | "tutor";
  content: string;
  mode?: string;
  sources?: string[];
  timestamp: number;
};

const SUGGESTED_QUESTIONS = [
  "Can you explain the main concepts in this course?",
  "What are the key takeaways I should focus on?",
  "Give me a summary of what I've learned so far.",
  "What topics will the final exam cover?",
];

export default function AITutor({
  courseId,
  courseTitle,
  lessonTitle,
}: {
  courseId: string;
  courseTitle: string;
  lessonTitle?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setLoading(true);
    const userMsg: Message = { role: "student", content: question, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          courseId,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, {
          role: "tutor",
          content: data.answer,
          mode: data.mode,
          sources: data.sources,
          timestamp: Date.now(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "tutor",
          content: `⚠️ Error: ${data.error || "Something went wrong"}`,
          timestamp: Date.now(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "tutor",
        content: "⚠️ Network error. Please try again.",
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:scale-105"
        >
          <span className="text-xl">🤖</span>
          <span className="hidden sm:inline">AI Tutor</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[500px] w-[min(400px,calc(100vw-3rem))] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <h3 className="font-bold text-sm">AI Tutor</h3>
                <p className="text-xs text-indigo-100">{courseTitle}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-white/20 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <div className="text-4xl">🤖</div>
                <h4 className="mt-3 font-bold text-slate-800">Ask me anything!</h4>
                <p className="mt-1 text-sm text-slate-500">
                  I can help you understand course concepts, summarize lessons, and prepare for exams.
                </p>
                {lessonTitle && (
                  <p className="mt-2 text-xs text-indigo-600">Currently studying: {lessonTitle}</p>
                )}
                <div className="mt-4 space-y-2">
                  {SUGGESTED_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => ask(q)}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      💬 {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "student"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  {msg.role === "tutor" && msg.mode === "offline" && (
                    <div className="mb-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      📚 Course Search
                    </div>
                  )}
                  {msg.role === "tutor" && msg.mode === "ai" && (
                    <div className="mb-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      ✨ AI Powered
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 border-t border-slate-100 pt-1.5">
                      <p className="text-xs text-slate-400">Sources: {msg.sources.join(", ")}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "0ms" }}></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "150ms" }}></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
                placeholder="Ask a question about this course..."
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                disabled={loading}
              />
              <button
                onClick={() => ask(input)}
                disabled={loading || !input.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "⏳" : "Send →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
