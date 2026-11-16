"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type Quiz = {
  id: string;
  title: string;
  passingScore: number;
  maxAttempts: number;
  timeLimit: number;
  shuffleQuestions: boolean;
};

type Question = {
  id: string;
  text: string;
  type: "mcq" | "true_false" | "short_answer";
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
};

export default function FinalExamPlayer({
  quiz,
  questions,
  isStaff,
}: {
  quiz: Quiz;
  questions: Question[];
  isStaff: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "exam" | "loading" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60);
  const [violations, setViolations] = useState(0);
  const [violationMsg, setViolationMsg] = useState("");
  const [result, setResult] = useState<any>(null);
  const [startTime, setStartTime] = useState(0);
  const examContainerRef = useRef<HTMLDivElement>(null);
  const wasFullscreenRef = useRef(false);

  const q = questions[currentQ];

  // ---- Anti-cheating ----
  useEffect(() => {
    if (phase !== "exam") return;

    const handleVisibility = () => {
      if (document.hidden) {
        setViolations(v => v + 1);
        setViolationMsg("⚠️ Tab switch detected! This has been recorded.");
        setTimeout(() => setViolationMsg(""), 3000);
      }
    };

    const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); setViolations(v => v + 1); setViolationMsg("⚠️ Copy attempt blocked!"); setTimeout(() => setViolationMsg(""), 2000); };
    const handlePaste = (e: ClipboardEvent) => { e.preventDefault(); };
    const handleContext = (e: MouseEvent) => { e.preventDefault(); setViolations(v => v + 1); };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContext);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContext);
    };
  }, [phase]);

  // ---- Timer ----
  useEffect(() => {
    if (phase !== "exam" || quiz.timeLimit === 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          submitExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, quiz.timeLimit]);

  // ---- Start exam ----
  const startExam = () => {
    setPhase("exam");
    setStartTime(Date.now());
    setCurrentQ(0);
    setAnswers({});
    setViolations(0);
    setTimeLeft(quiz.timeLimit * 60);
    // Try fullscreen
    if (examContainerRef.current?.requestFullscreen) {
      examContainerRef.current.requestFullscreen().catch(() => {});
    }
  };

  // ---- Navigation ----
  const next = () => { if (currentQ < questions.length - 1) setCurrentQ(c => c + 1); };
  const prev = () => { if (currentQ > 0) setCurrentQ(c => c - 1); };

  // ---- Submit ----
  const submitExam = async () => {
    setPhase("loading");
    const timeTakenSec = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, timeTakenSec, violations }),
      });
      const data = await res.json();
      setResult(data);
      setPhase("result");
      if (document.fullscreenElement) document.exitFullscreen();
    } catch {
      setPhase("exam");
      alert("Submission failed. Please try again.");
    }
  };

  const answeredCount = Object.keys(answers).length;
  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ---- INTRO PHASE ----
  if (phase === "intro") {
    return (
      <div ref={examContainerRef} className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-8 text-center">
        <div className="text-5xl">📋</div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Ready to Start the Final Exam?</h2>
        <div className="mt-6 grid max-w-md mx-auto gap-2 text-left text-sm text-slate-700">
          <p>📊 You need <strong>{quiz.passingScore}%</strong> to pass</p>
          <p>❓ <strong>{questions.length}</strong> questions</p>
          {quiz.timeLimit > 0 && <p>⏱ Time limit: <strong>{quiz.timeLimit} minutes</strong></p>}
          {quiz.maxAttempts > 0 && <p>🔄 Limited attempts — make it count!</p>}
          <p>🛡 Anti-cheating is enabled: don't switch tabs, copy, or right-click</p>
          <p>🔒 The exam will open in fullscreen mode</p>
        </div>
        <button
          onClick={startExam}
          className="mt-8 rounded-xl bg-amber-600 px-8 py-3 text-lg font-bold text-white transition hover:bg-amber-700"
        >
          Start Exam →
        </button>
      </div>
    );
  }

  // ---- LOADING PHASE ----
  if (phase === "loading") {
    return (
      <div className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-12 text-center">
        <div className="text-4xl animate-pulse">📝</div>
        <p className="mt-4 text-lg font-medium text-slate-700">Grading your exam...</p>
      </div>
    );
  }

  // ---- RESULT PHASE ----
  if (phase === "result" && result) {
    const passed = result.passed;
    return (
      <div className={`rounded-2xl border-2 p-8 text-center ${passed ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
        <div className="text-6xl">{passed ? "🎉" : "😔"}</div>
        <h2 className={`mt-4 text-2xl font-bold ${passed ? "text-green-900" : "text-red-900"}`}>
          {passed ? "Congratulations! You Passed!" : "You Didn't Pass This Time"}
        </h2>
        <div className="mt-4 text-4xl font-bold text-slate-900">{result.score}%</div>
        <p className="text-sm text-slate-600">Passing score: {result.passingScore}%</p>

        {result.certificateIssued && (
          <div className="mt-4 inline-block rounded-xl bg-amber-100 border border-amber-300 px-4 py-2">
            🏅 Certificate issued! Check your dashboard.
          </div>
        )}

        {result.attemptsRemaining > 0 && !passed && (
          <p className="mt-4 text-sm text-slate-600">
            You have <strong>{result.attemptsRemaining}</strong> attempt(s) remaining.
          </p>
        )}
        {result.attemptsRemaining === 0 && !passed && (
          <p className="mt-4 text-sm text-red-600">
            No attempts remaining. Please contact your instructor.
          </p>
        )}

        {/* Answer review */}
        {result.gradedAnswers && (
          <div className="mt-8 max-w-2xl mx-auto text-left">
            <h3 className="font-bold text-slate-900 mb-3">Answer Review</h3>
            <div className="space-y-3">
              {result.questions.map((rq: any, i: number) => {
                const ga = result.gradedAnswers.find((g: any) => g.questionId === rq.id);
                return (
                  <div key={rq.id} className={`rounded-lg border p-3 ${ga?.correct ? "border-green-200 bg-white" : "border-red-200 bg-white"}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{ga?.correct ? "✅" : "❌"}</span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{i + 1}. {rq.text}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Your answer: <span className={ga?.correct ? "text-green-600" : "text-red-600"}>{ga?.answer || "(no answer)"}</span>
                        </p>
                        {!ga?.correct && (
                          <p className="text-sm text-green-600">Correct: {rq.correctAnswer}</p>
                        )}
                        {rq.explanation && (
                          <p className="mt-1 text-xs text-slate-500 italic">💡 {rq.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => router.refresh()}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            {passed ? "View Dashboard →" : "Try Again"}
          </button>
          <a
            href={`/courses`}
            className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Courses
          </a>
        </div>
      </div>
    );
  }

  // ---- EXAM PHASE ----
  return (
    <div ref={examContainerRef} className="rounded-2xl border-2 border-slate-300 bg-white p-6">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{quiz.title}</h2>
          <p className="text-sm text-slate-500">Question {currentQ + 1} of {questions.length}</p>
        </div>
        {quiz.timeLimit > 0 && (
          <div className={`rounded-lg px-4 py-2 font-mono font-bold text-lg ${
            timeLeft < 60 ? "bg-red-100 text-red-700 animate-pulse" : "bg-slate-100 text-slate-700"
          }`}>
            ⏱ {fmtTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Violation warning */}
      {violationMsg && (
        <div className="mt-3 rounded-lg bg-red-100 border border-red-300 px-4 py-2 text-sm text-red-700 font-medium">
          {violationMsg} (Total violations: {violations})
        </div>
      )}

      {/* Progress */}
      <div className="mt-4 flex gap-1">
        {questions.map((qq, i) => (
          <div
            key={qq.id}
            className={`h-2 flex-1 rounded-full ${
              answers[qq.id] ? "bg-green-500" : i === currentQ ? "bg-blue-500" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="mt-6">
        <p className="text-lg font-medium text-slate-900">{currentQ + 1}. {q.text}</p>

        {/* MCQ or True/False */}
        {(q.type === "mcq" || q.type === "true_false") && (
          <div className="mt-4 space-y-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                className={`w-full text-left p-4 rounded-xl border-2 transition ${
                  answers[q.id] === opt
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="font-medium text-slate-800">{opt}</span>
              </button>
            ))}
          </div>
        )}

        {/* Short answer */}
        {q.type === "short_answer" && (
          <textarea
            value={answers[q.id] || ""}
            onChange={(e) => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
            onPaste={(e) => e.preventDefault()}
            placeholder="Type your answer here..."
            className="mt-4 w-full rounded-xl border-2 border-slate-200 p-4 focus:border-blue-500 outline-none"
            rows={4}
          />
        )}
      </div>

      {/* Footer nav */}
      <div className="mt-8 flex items-center justify-between border-t pt-4">
        <button
          onClick={prev}
          disabled={currentQ === 0}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-30 hover:bg-slate-100"
        >
          ← Previous
        </button>

        <span className="text-sm text-slate-500">
          {answeredCount}/{questions.length} answered
        </span>

        {currentQ < questions.length - 1 ? (
          <button
            onClick={next}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => {
              if (answeredCount < questions.length) {
                if (!confirm(`You have ${questions.length - answeredCount} unanswered questions. Submit anyway?`)) return;
              }
              submitExam();
            }}
            className="rounded-lg bg-green-600 px-6 py-2 text-sm font-bold text-white hover:bg-green-700"
          >
            ✓ Submit Exam
          </button>
        )}
      </div>
    </div>
  );
}
