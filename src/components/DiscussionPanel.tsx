"use client";

import { useState, useEffect, useCallback } from "react";

type Discussion = {
  id: string;
  userId: string;
  title: string;
  content: string;
  pinned: boolean;
  upvotes: string[];
  replyCount: number;
  userUpvoted: boolean;
  createdAt: string;
};

type Reply = {
  id: string;
  userId: string;
  content: string;
  isVerifiedAnswer: boolean;
  upvotes: string[];
  userUpvoted: boolean;
  createdAt: string;
};

export default function DiscussionPanel({
  courseId,
  lessonId,
  userId,
  userRole,
  userName,
}: {
  courseId: string;
  lessonId: string | null;
  userId: string;
  userRole: string;
  userName: string;
}) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeDiscussion, setActiveDiscussion] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});

  const canModerate = userRole === "instructor" || userRole === "admin" || userRole === "teaching_assistant";

  const fetchDiscussions = useCallback(async () => {
    const url = `/api/discussions?courseId=${courseId}${lessonId ? `&lessonId=${lessonId}` : ""}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setDiscussions(data.discussions);
    }
  }, [courseId, lessonId]);

  const fetchReplies = useCallback(async (discId: string) => {
    const res = await fetch("/api/discussions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discussionId: discId }),
    });
    if (res.ok) {
      const data = await res.json();
      setReplies(data.replies);
    }
  }, []);

  useEffect(() => { fetchDiscussions(); }, [fetchDiscussions]);

  useEffect(() => {
    if (activeDiscussion) fetchReplies(activeDiscussion);
  }, [activeDiscussion, fetchReplies]);

  async function createDiscussion() {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    const res = await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, lessonId, title, content }),
    });
    if (res.ok) {
      setTitle(""); setContent(""); setShowForm(false);
      await fetchDiscussions();
    }
    setLoading(false);
  }

  async function addReply(discId: string) {
    if (!replyContent.trim()) return;
    const res = await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reply", discussionId: discId, replyContent }),
    });
    if (res.ok) {
      setReplyContent("");
      await fetchReplies(discId);
      await fetchDiscussions();
    }
  }

  async function upvoteDiscussion(discId: string) {
    await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upvote", discussionId: discId }),
    });
    await fetchDiscussions();
  }

  async function upvoteReply(replyId: string) {
    await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upvote_reply", replyId }),
    });
    if (activeDiscussion) await fetchReplies(activeDiscussion);
  }

  async function pinDiscussion(discId: string) {
    await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pin", discussionId: discId }),
    });
    await fetchDiscussions();
  }

  async function verifyReply(replyId: string) {
    await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", replyId }),
    });
    if (activeDiscussion) await fetchReplies(activeDiscussion);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4" role="region" aria-label="Discussion forum">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-slate-800">
          <span aria-hidden="true">💬</span> Discussion & Q&A
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          aria-expanded={showForm}
        >
          {showForm ? "Cancel" : "+ Ask"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2 rounded-lg bg-slate-50 p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Question title..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            aria-label="Discussion title"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your question in detail..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            rows={3}
            aria-label="Discussion content"
          />
          <button
            onClick={createDiscussion}
            disabled={loading || !title.trim() || !content.trim()}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Post Question
          </button>
        </div>
      )}

      {/* Discussion list */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {discussions.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">
            No discussions yet. Be the first to ask a question!
          </p>
        ) : (
          discussions.map((d) => (
            <div key={d.id} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {d.pinned && <span className="mr-1 text-xs text-amber-600 font-medium">📌 Pinned</span>}
                  <button
                    onClick={() => { setActiveDiscussion(activeDiscussion === d.id ? null : d.id); }}
                    className="text-left font-medium text-slate-800 hover:text-indigo-600"
                  >
                    {d.title}
                  </button>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{d.content}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                    <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                    <span>💬 {d.replyCount} {d.replyCount === 1 ? "reply" : "replies"}</span>
                    {canModerate && (
                      <button onClick={() => pinDiscussion(d.id)} className="text-amber-600 hover:underline">
                        {d.pinned ? "Unpin" : "Pin"}
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => upvoteDiscussion(d.id)}
                  className={`flex flex-col items-center rounded-lg px-2 py-1 text-xs ${d.userUpvoted ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}
                  aria-label="Upvote"
                >
                  ▲ {d.upvotes.length}
                </button>
              </div>

              {/* Replies */}
              {activeDiscussion === d.id && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {replies.map((r) => (
                    <div key={r.id} className={`rounded-lg p-2.5 ${r.isVerifiedAnswer ? "bg-green-50 border border-green-200" : "bg-slate-50"}`}>
                      {r.isVerifiedAnswer && (
                        <span className="mb-1 inline-block rounded bg-green-600 px-1.5 py-0.5 text-xs text-white">✓ Verified Answer</span>
                      )}
                      <p className="text-sm text-slate-700">{r.content}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={() => upvoteReply(r.id)}
                          className={`${r.userUpvoted ? "text-indigo-600" : "text-slate-400"} hover:underline`}
                        >
                          ▲ {r.upvotes.length}
                        </button>
                        {canModerate && !r.isVerifiedAnswer && (
                          <button onClick={() => verifyReply(r.id)} className="text-green-600 hover:underline">
                            ✓ Verify
                          </button>
                        )}
                        {canModerate && r.isVerifiedAnswer && (
                          <button onClick={() => verifyReply(r.id)} className="text-slate-400 hover:underline">
                            Unverify
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Reply input */}
                  <div className="flex gap-2">
                    <input
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
                      aria-label="Reply input"
                      onKeyDown={(e) => { if (e.key === "Enter") addReply(d.id); }}
                    />
                    <button
                      onClick={() => addReply(d.id)}
                      disabled={!replyContent.trim()}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
