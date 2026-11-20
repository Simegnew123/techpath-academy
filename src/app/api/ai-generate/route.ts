import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAIGenerationJob, updateAIGenerationJob, getAIGenerationJobs } from "@/lib/store";
import https from "https";

// GET /api/ai-generate — list user's AI generation jobs
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const jobs = getAIGenerationJobs(user.id);
  return NextResponse.json({ jobs });
}

// POST /api/ai-generate — generate course content from text
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const { type, inputText, inputFileName, categoryId, courseTitle } = body;

  if (!type || !inputText) {
    return NextResponse.json({ error: "type and inputText required" }, { status: 400 });
  }

  // Create a job record
  const job = createAIGenerationJob({
    userId: user.id,
    type,
    inputText: inputText.substring(0, 50000), // cap at 50k chars
    inputFileName: inputFileName || "input.txt",
    provider: process.env.GROQ_API_KEY ? "groq" : process.env.GEMINI_API_KEY ? "gemini" : "none",
  });

  // Build the prompt based on type
  let prompt = "";
  if (type === "course_outline") {
    prompt = `You are an expert instructional designer. Based on the following raw notes/content, generate a structured course outline. Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "title": "Course Title",
  "description": "1-2 sentence course description",
  "modules": [
    {
      "title": "Module Title",
      "lessons": [
        { "title": "Lesson Title", "type": "text", "duration": 10, "contentSummary": "2-3 sentence summary of what this lesson covers" }
      ]
    }
  ]
}

Raw content:
${inputText.substring(0, 8000)}`;
  } else if (type === "quiz") {
    prompt = `You are an expert assessment designer. Based on the following content, generate 10 multiple-choice questions. Return ONLY valid JSON (no markdown, no code fences) with this structure:
{
  "questions": [
    {
      "text": "Question text?",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct",
      "points": 1
    }
  ]
}

Content:
${inputText.substring(0, 8000)}`;
  } else if (type === "flashcards") {
    prompt = `You are an expert educator. Based on the following content, generate 15 flashcards. Return ONLY valid JSON (no markdown, no code fences) with this structure:
{
  "cards": [
    { "front": "Question or term", "back": "Answer or definition" }
  ]
}

Content:
${inputText.substring(0, 8000)}`;
  } else {
    return NextResponse.json({ error: "Invalid type. Use: course_outline, quiz, or flashcards" }, { status: 400 });
  }

  // Try AI providers
  let output = "";
  let provider = "none";

  // Trim API keys to remove accidental whitespace/newlines from copy-paste
  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();

  try {
    if (groqKey) {
      provider = "groq";
      output = await callGroq(prompt, groqKey);
    } else if (geminiKey) {
      provider = "gemini";
      output = await callGemini(prompt, geminiKey);
    } else {
      // No API key — return a helpful message
      updateAIGenerationJob(job.id, {
        status: "failed",
        error: "No AI API key configured. Set GROQ_API_KEY or GEMINI_API_KEY environment variable.",
        completedAt: new Date().toISOString(),
      });
      return NextResponse.json({
        jobId: job.id,
        error: "No AI API key configured. Set GROQ_API_KEY or GEMINI_API_KEY in your Render environment variables.",
      }, { status: 400 });
    }

    // Try to parse the output as JSON
    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = output.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { raw: output };
    }

    updateAIGenerationJob(job.id, {
      status: "completed",
      output: JSON.stringify(parsed),
      provider,
      completedAt: new Date().toISOString(),
    });

    return NextResponse.json({ jobId: job.id, result: parsed, provider });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    updateAIGenerationJob(job.id, {
      status: "failed",
      error: message,
      completedAt: new Date().toISOString(),
    });
    return NextResponse.json({ jobId: job.id, error: message }, { status: 500 });
  }
}

// --- AI Provider helpers ---

// Groq models in priority order — falls back if a model is unavailable
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-70b-8192",
  "llama3-8b-8192",
];

function callGroq(prompt: string, apiKey: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let lastError = "";

    for (const model of GROQ_MODELS) {
      try {
        const result = await callGroqWithModel(prompt, apiKey, model);
        resolve(result);
        return;
      } catch (err) {
        lastError = (err as Error).message;
        // If it's not a model-not-found error, stop trying
        if (!lastError.includes("does not exist") && !lastError.includes("model")) {
          break;
        }
      }
    }

    reject(new Error(lastError || "All Groq models failed"));
  });
}

function callGroqWithModel(prompt: string, apiKey: string, model: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are an expert instructional designer. Always return valid JSON only, no markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const options = {
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`Groq API error: ${json.error.message || json.error}`));
            return;
          }
          resolve(json.choices?.[0]?.message?.content || "");
        } catch {
          reject(new Error(`Groq API returned unexpected response (status ${res.statusCode}): ${data.substring(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function callGemini(prompt: string, apiKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4000 },
    });

    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`Gemini API error: ${json.error.message || json.error}`));
            return;
          }
          resolve(json.candidates?.[0]?.content?.parts?.[0]?.text || "");
        } catch {
          reject(new Error(`Gemini API returned unexpected response (status ${res.statusCode}): ${data.substring(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
