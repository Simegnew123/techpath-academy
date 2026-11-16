"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { marked } from "marked";

type Message = {
  role: "student" | "tutor";
  content: string;
  mode?: string;
  provider?: string;
  sources?: string[];
  timestamp: number;
};

const SUGGESTED_QUESTIONS = [
  "Can you explain the main concepts in this course?",
  "What are the key takeaways I should focus on?",
  "Give me a summary of what I've learned so far.",
  "What topics will the final exam cover?",
];

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  groq: { label: "⚡ Groq AI", color: "bg-orange-100 text-orange-700" },
  gemini: { label: "✨ Gemini AI", color: "bg-blue-100 text-blue-700" },
  openai: { label: "🤖 OpenAI", color: "bg-green-100 text-green-700" },
  search: { label: "📚 Course Search", color: "bg-amber-100 text-amber-700" },
};

function renderMarkdown(text: string): string {
  try {
    return marked.parse(text, { async: false }) as string;
  } catch {
    return text.replace(/\n/g, "<br/>");
  }
}

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

  const ask = useCallback(async (question: string) => {
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
          provider: data.provider,
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
  }, [loading, messages, courseId]);

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
        <div className="fixed bottom-6 right-6 z-40 flex h-[550px] w-[min(420px,calc(100vw-3rem))] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
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
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "student"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  {msg.role === "tutor" && msg.provider && PROVIDER_LABELS[msg.provider] && (
                    <div className={`mb-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${PROVIDER_LABELS[msg.provider].color}`}>
                      {PROVIDER_LABELS[msg.provider].label}
                    </div>
                  )}
                  {msg.role === "tutor" ? (
                    <div
                      className="prose prose-sm max-w-none [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:my-1.5 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-slate-800 [&_pre]:text-slate-100 [&_pre]:p-2 [&_pre]:rounded [&_a]:text-indigo-600"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {msg.role === "tutor" && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 border-t border-slate-100 pt-1.5">
                      <p className="text-xs text-slate-400">Sources: {msg.sources.join(", ")}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "0ms" }}></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "150ms" }}></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "300ms" }}></span>
                    <span className="ml-1 text-xs text-slate-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); ask(input); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
