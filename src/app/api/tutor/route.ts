import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB } from "@/lib/store";
import { getCourseById, getLessons } from "@/lib/courses";

// ============================================================
// AI Tutor API — supports multiple AI providers (pick one):
//   1. GROQ_API_KEY     → Groq (FREE, fast, Llama 3 models)
//   2. GEMINI_API_KEY   → Google Gemini (FREE tier)
//   3. OPENAI_API_KEY   → OpenAI (paid)
// If none set → offline "smart search" mode
// ============================================================

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
  const modules = db.modules.filter(m => m.courseId === courseId);

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
    "give", "show", "list", "describe", "them",
  ]);

  const keywords = question.toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w: string) => w.length > 2 && !stopwords.has(w));

  // ---- Score & extract relevant paragraphs ----
  type ScoredItem = { type: string; title: string; content: string; score: number };

  function scoreText(text: string): number {
    const lower = text.toLowerCase();
    let s = 0;
    for (const kw of keywords) {
      s += lower.split(kw).length - 1;
    }
    return s;
  }

  function extractRelevantParagraphs(content: string, maxChars: number = 700): string {
    const paragraphs = content.split(/\n\n+|\n#{1,6}\s/).filter(p => p.trim().length > 20);
    if (paragraphs.length <= 1) {
      return content.length > maxChars ? content.substring(0, maxChars) + "..." : content;
    }
    const scoredParas = paragraphs.map(p => ({ text: p.trim(), score: scoreText(p) }));
    scoredParas.sort((a, b) => b.score - a.score);
    let result = "";
    for (const sp of scoredParas) {
      if (result.length + sp.text.length > maxChars) break;
      result += sp.text + "\n\n";
    }
    if (!result) result = paragraphs.slice(0, 2).join("\n\n");
    return result.trim();
  }

  const scored: ScoredItem[] = [];

  for (const lesson of allLessons) {
    const score = scoreText(`${lesson.title} ${lesson.content}`) + scoreText(lesson.title) * 3;
    if (score > 0) {
      scored.push({
        type: "lesson",
        title: lesson.title,
        content: extractRelevantParagraphs(lesson.content || ""),
        score,
      });
    }
  }

  for (const q of questions) {
    const score = scoreText(`${q.text} ${q.correctAnswer} ${q.explanation}`) * 2;
    if (score > 0) {
      scored.push({
        type: "quiz",
        title: q.text,
        content: `**Answer:** ${q.correctAnswer}\n${q.explanation || ""}`,
        score,
      });
    }
  }

  for (const m of modules) {
    const score = scoreText(m.title) * 2;
    if (score > 0) {
      const moduleLessons = allLessons.filter(l => l.moduleId === m.id);
      scored.push({
        type: "module",
        title: m.title,
        content: `This module covers: ${moduleLessons.map(l => l.title).join(", ")}`,
        score,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const relevantContent = scored.slice(0, 6);

  const contextStr = relevantContent.length > 0
    ? relevantContent.map((r, i) => `[${i + 1}] Source: ${r.type} "${r.title}"\n${r.content}`).join("\n\n---\n\n")
    : "No directly relevant content found in course materials.";

  const courseSummary = `Course: "${course.title}" (Level: ${course.level})
Total lessons: ${allLessons.length}
Modules: ${modules.map(m => m.title).join(", ")}`;

  const systemPrompt = `You are an expert AI tutor for the course "${course.title}" (Level: ${course.level}).
Your job is to help students deeply understand the material.

COURSE OVERVIEW:
${courseSummary}

RELEVANT COURSE CONTENT (use this as your primary source):
${contextStr}

Instructions:
- Answer the student's question thoroughly using the course content above.
- If the content doesn't fully answer the question, supplement with your own knowledge.
- Use clear examples, analogies, and step-by-step explanations.
- Format with markdown (headers ##, bold **, lists -, code blocks where helpful).
- Keep it focused: 3-8 paragraphs depending on complexity.
- Be encouraging and educational. Break things down simply if the student seems confused.`;

  const chatHistory = history.map((h: { role: string; content: string }) => ({
    role: h.role === "student" ? "user" : "assistant",
    content: h.content,
  }));

  // ---- Step 2: Try AI providers (Groq → Gemini → OpenAI) ----

  // --- Provider 1: Groq (FREE) ---
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...chatHistory,
            { role: "user", content: question },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });
      if (!response.ok) throw new Error(`Groq error: ${response.status}`);
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
      return NextResponse.json({
        answer, mode: "ai", provider: "groq",
        sources: relevantContent.map(r => `${r.type}: ${r.title}`),
      });
    } catch (err: any) {
      console.error("Groq error:", err.message);
    }
  }

  // --- Provider 2: Google Gemini (FREE tier) ---
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiContents = [
        ...chatHistory.map((h: { role: string; content: string }) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: `${systemPrompt}\n\nStudent question: ${question}` }] },
      ];
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: geminiContents,
            generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
          }),
        }
      );
      if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";
      return NextResponse.json({
        answer, mode: "ai", provider: "gemini",
        sources: relevantContent.map(r => `${r.type}: ${r.title}`),
      });
    } catch (err: any) {
      console.error("Gemini error:", err.message);
    }
  }

  // --- Provider 3: OpenAI (paid) ---
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...chatHistory,
            { role: "user", content: question },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });
      if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
      return NextResponse.json({
        answer, mode: "ai", provider: "openai",
        sources: relevantContent.map(r => `${r.type}: ${r.title}`),
      });
    } catch (err: any) {
      console.error("OpenAI error:", err.message);
    }
  }

  // ---- Step 3: Offline "smart search" mode (no API key) ----
  let answer = "";

  if (relevantContent.length > 0) {
    answer = `## 📚 Course Content Results\n\n`;
    answer += `I found **${relevantContent.length} relevant section(s)** in **${course.title}** that relate to your question.\n\n`;

    for (const r of relevantContent) {
      const icon = r.type === "lesson" ? "📖" : r.type === "quiz" ? "❓" : "📦";
      answer += `### ${icon} ${r.title}\n\n`;
      answer += `${r.content}\n\n`;
    }

    answer += `---\n\n`;
    answer += `### 💡 Want more detailed explanations?\n\n`;
    answer += `To get **AI-powered personalized explanations** (not just course content), your instructor can enable a free AI key:\n\n`;
    answer += `- **Groq** (FREE, recommended) — Get a key at [console.groq.com](https://console.groq.com)\n`;
    answer += `- **Google Gemini** (FREE) — Get a key at [aistudio.google.com](https://aistudio.google.com)\n`;
    answer += `- **OpenAI** (paid) — Get a key at [platform.openai.com](https://platform.openai.com)\n\n`;
    answer += `Set the key as an environment variable (\`GROQ_API_KEY\`, \`GEMINI_API_KEY\`, or \`OPENAI_API_KEY\`) and the tutor will give you detailed, personalized answers!\n`;
  } else {
    answer = `## 📚 No matching content found\n\n`;
    answer += `I couldn't find content in **${course.title}** that directly matches your question.\n\n`;
    answer += `### Here's what this course covers:\n\n`;
    for (const m of modules) {
      const ml = allLessons.filter(l => l.moduleId === m.id);
      answer += `**${m.title}**\n`;
      for (const l of ml) {
        answer += `- ${l.title}\n`;
      }
      answer += `\n`;
    }
    answer += `### 💡 Tips:\n\n`;
    answer += `- Try rephrasing with specific terms from the lessons above\n`;
    answer += `- Ask about a specific topic like "What is ${allLessons[0]?.title || 'troubleshooting'}?"\n`;
    answer += `- To get **AI-powered answers**, your instructor can add a free Groq or Gemini API key\n`;
  }

  return NextResponse.json({
    answer,
    mode: "offline",
    provider: "search",
    sources: relevantContent.map(r => `${r.type}: ${r.title}`),
  });
}
