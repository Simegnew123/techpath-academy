import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB } from "@/lib/store";
import { getCourseById, getLessons } from "@/lib/courses";

// POST /api/tutor — AI tutor that answers questions based on course materials
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { question, courseId, lessonId, history = [] } = body;

  if (!question || !courseId) {
    return NextResponse.json({ error: "question and courseId required" }, { status: 400 });
  }

  const course = getCourseById(courseId);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // ---- Step 1: Retrieve relevant course content (RAG) ----
  const db = readDB();
  const allLessons = getLessons(courseId);
  const quizzes = db.quizzes.filter(q => q.courseId === courseId);
  const questions = db.questions.filter(qq => quizzes.some(q => q.id === qq.quizId));

  // Extract keywords from the question
  const stopwords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "what", "how", "why", "when", "where", "who", "which", "can", "could",
    "would", "should", "do", "does", "did", "will", "shall", "may", "might",
    "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us",
    "to", "of", "in", "on", "at", "for", "with", "by", "from", "about",
    "into", "through", "during", "before", "after", "above", "below",
    "and", "or", "but", "not", "no", "if", "then", "else", "so", "than",
    "this", "that", "these", "those", "my", "your", "his", "its", "our",
    "tell", "explain", "help", "understand", "know", "need", "want",
  ]);

  const keywords = question.toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w: string) => w.length > 2 && !stopwords.has(w));

  // Score each lesson by keyword matches
  type ScoredItem = { type: string; title: string; content: string; score: number };
  const scored: ScoredItem[] = [];

  for (const lesson of allLessons) {
    const text = `${lesson.title} ${lesson.content}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += text.split(kw).length - 1;
    }
    if (score > 0) {
      const content = lesson.content.length > 800
        ? lesson.content.substring(0, 800) + "..."
        : lesson.content;
      scored.push({ type: "lesson", title: lesson.title, content, score });
    }
  }

  // Score quiz questions
  for (const q of questions) {
    const text = `${q.text} ${q.correctAnswer} ${q.explanation}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += (text.split(kw).length - 1) * 2;
    }
    if (score > 0) {
      scored.push({
        type: "quiz",
        title: `Quiz: ${q.text}`,
        content: `Answer: ${q.correctAnswer}. ${q.explanation}`,
        score,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const relevantContent = scored.slice(0, 5);

  const contextStr = relevantContent.length > 0
    ? relevantContent.map((r, i) =>
        `[${i + 1}] From ${r.type} "${r.title}":\n${r.content}`
      ).join("\n\n")
    : "No directly relevant content found in course materials.";

  // ---- Step 2: Generate answer ----
  const hasApiKey = !!process.env.OPENAI_API_KEY;

  if (hasApiKey) {
    try {
      const systemPrompt = `You are an AI tutor for the course "${course.title}" (category: ${course.categoryId}, level: ${course.level}).
Your role is to help students understand the course material. Use the provided course context to answer questions.
If the context doesn't contain the answer, say so and suggest which lesson might help.
Be encouraging, clear, and educational. Use examples when helpful.
Keep responses concise (3-5 paragraphs max). Use markdown formatting.

COURSE CONTEXT:
${contextStr}`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...history.map((h: { role: string; content: string }) => ({
          role: h.role === "student" ? "user" : "assistant",
          content: h.content,
        })),
        { role: "user", content: question },
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages,
          max_tokens: 600,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

      return NextResponse.json({
        answer,
        mode: "ai",
        sources: relevantContent.map(r => r.title),
      });
    } catch (err: any) {
      console.error("AI Tutor OpenAI error:", err.message);
    }
  }

  // ---- Fallback mode (no API key or OpenAI failed) ----
  let answer = "";

  if (relevantContent.length > 0) {
    answer = `## 📚 Study Assistant (Offline Mode)\n\n`;
    answer += `I found **${relevantContent.length} relevant section(s)** in your course materials that may answer your question:\n\n`;

    for (const r of relevantContent) {
      answer += `### ${r.type === "lesson" ? "📖" : "❓"} ${r.title}\n`;
      answer += `${r.content}\n\n`;
    }

    answer += `---\n`;
    answer += `💡 **Tip:** Try rephrasing your question with specific terms from the lesson, or review the sections above. `;
    answer += `If your instructor enables the full AI tutor (with an OpenAI API key), you'll get personalized explanations!`;
  } else {
    answer = `## 📚 Study Assistant (Offline Mode)\n\n`;
    answer += `I couldn't find content directly matching your question in the course materials.\n\n`;
    answer += `Here are all the lessons in **${course.title}** — try browsing them:\n\n`;
    for (const lesson of allLessons.slice(0, 10)) {
      answer += `- 📖 ${lesson.title}\n`;
    }
    if (allLessons.length > 10) {
      answer += `- ...and ${allLessons.length - 10} more lessons\n`;
    }
    answer += `\n💡 **Tip:** Ask about a specific topic, e.g., *"How does TCP/IP work?"* or *"What is SQL injection?"*`;
  }

  return NextResponse.json({
    answer,
    mode: "offline",
    sources: relevantContent.map(r => r.title),
  });
}
