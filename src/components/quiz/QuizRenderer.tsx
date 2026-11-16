"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Question = {
  id: string;
  text: string;
  type: "mcq" | "true_false" | "short_answer";
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  order: number;
};

type Quiz = {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  timeLimit: number;
};

type GradedAnswer = {
  questionId: string;
  answer: string;
  correct: boolean;
};

type SubmitResponse = {
  score: number;
  passed: boolean;
  passingScore: number;
  gradedAnswers: GradedAnswer[];
  questions: { id: string; text: string; correctAnswer: string; explanation: string; type: string }[];
  attemptsRemaining: number;
  attemptId: string;
};

export default function QuizRenderer({
  quiz,
  questions,
  lessonId,
  onComplete,
}: {
  quiz: Quiz;
  questions: Question[];
  lessonId: string;
  onComplete?: (passed: boolean, score: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit > 0 ? quiz.timeLimit * 60 : 0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ---- Anti-cheating: detect tab switching & copy/paste ----
  useEffect(() => {
  const handleVisibility = () => {
      if (document.hidden && !result) {
        setViolations((v) => {
          const nv = v + 1;
          setShowViolationWarning(true);
          setTimeout(() => setShowViolationWarning(false), 3000);
          return nv;
        });
      }
    };
    const handleCopy = (e: ClipboardEvent) => {
      if (!result) {
        e.preventDefault();
        setViolations((v) => v + 1);
      }
    };
    const handlePaste = (e: ClipboardEvent) => {
      if (!result) {
        e.preventDefault();
        setViolations((v) => {
          const nv = v + 1;
          setShowViolationWarning(true);
          setTimeout(() => setShowViolationWarning(false), 3000);
          return nv;
        });
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      if (!result) e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [result]);

  // ---- Timer ----
  useEffect(() => {
    if (timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const timeTakenSec = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, timeTakenSec, violations }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        onComplete?.(data.passed, data.score);
      } else {
        alert(data.error || "Failed to submit quiz");
      }
    } catch {
      alert("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }, [answers, quiz.id, startTime, violations, submitting, onComplete]);

  const allAnswered = questions.every((q) => (answers[q.id] || "").trim().length > 0);
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ---- Result View ----
  if (result) {
    return (
      <div className="space-y-6">
        <div className={`rounded-xl p-6 text-center ${result.passed ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"}`}>
          <div className="text-5xl mb-2">{result.passed ? "🎉" : "📚"}</div>
          <h3 className="text-2xl font-bold mb-1">
            {result.passed ? "Passed!" : "Keep Practicing!"}
          </h3>
          <p className="text-lg">
            Score: <span className="font-bold">{result.score}%</span> / {result.passingScore}% required
          </p>
          {result.attemptsRemaining > 0 && !result.passed && (
            <p className="text-sm text-gray-600 mt-2">
              {result.attemptsRemaining} attempt{result.attemptsRemaining !== 1 ? "s" : ""} remaining
            </p>
          )}
          {result.attemptsRemaining === -1 && !result.passed && (
            <p className="text-sm text-gray-600 mt-2">Unlimited attempts — try again!</p>
          )}
        </div>

        {/* Review answers */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Review Your Answers</h4>
          {result.questions.map((q, i) => {
            const graded = result.gradedAnswers.find((a) => a.questionId === q.id);
            const isCorrect = graded?.correct;
            return (
              <div key={q.id} className={`rounded-lg p-4 border ${isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">{isCorrect ? "✅" : "❌"}</span>
                  <p className="font-medium">{i + 1}. {q.text}</p>
                </div>
                <div className="text-sm text-gray-700 space-y-1 ml-7">
                  <p><span className="font-semibold">Your answer:</span> {graded?.answer || "(no answer)"}</p>
                  {!isCorrect && <p><span className="font-semibold">Correct answer:</span> {q.correctAnswer}</p>}
                  {q.explanation && <p className="text-gray-500 italic mt-1">💡 {q.explanation}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {!result.passed && result.attemptsRemaining !== 0 && (
          <button
            onClick={() => {
              setResult(null);
              setAnswers({});
              setViolations(0);
            }}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // ---- Quiz Taking View ----
  return (
    <div ref={containerRef} className="space-y-6" onCopy={(e) => e.preventDefault()}>
      {/* Header */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">{quiz.title}</h3>
          {timeLeft > 0 && (
            <span className={`px-3 py-1 rounded-full text-sm font-mono font-bold ${timeLeft < 60 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
              ⏱ {formatTime(timeLeft)}
            </span>
          )}
        </div>
        {quiz.description && <p className="text-sm text-gray-600">{quiz.description}</p>}
        <div className="flex gap-4 text-sm text-gray-500 mt-2">
          <span>📝 {questions.length} questions</span>
          <span>✅ {quiz.passingScore}% to pass</span>
          {quiz.maxAttempts > 0 && <span>🔄 {quiz.maxAttempts} max attempts</span>}
        </div>
      </div>

      {/* Anti-cheating warning */}
      {showViolationWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded animate-pulse">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Warning:</strong> Tab switching / copy-paste is detected. Repeated violations may flag your attempt.
            ({violations} violation{violations !== 1 ? "s" : ""})
          </p>
        </div>
      )}

      {/* Questions */}
      {questions.map((q, i) => (
        <div key={q.id} className="bg-white border rounded-lg p-5">
          <p className="font-semibold mb-3">
            {i + 1}. {q.text}
            <span className="text-xs text-gray-400 ml-2">({q.points} pt{q.points !== 1 ? "s" : ""})</span>
          </p>

          {q.type === "mcq" && (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${answers[q.id] === opt ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50 border-gray-200"}`}>
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "true_false" && (
            <div className="flex gap-3">
              {["True", "False"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  className={`flex-1 py-3 rounded-lg border font-medium transition ${answers[q.id] === opt ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "short_answer" && (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              onPaste={(e) => e.preventDefault()}
              placeholder="Type your answer here..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
              rows={3}
            />
          )}
        </div>
      ))}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className={`w-full py-3 rounded-lg font-semibold transition ${allAnswered && !submitting ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
      >
        {submitting ? "Submitting..." : allAnswered ? "Submit Quiz" : `Answer all questions (${Object.keys(answers).length}/${questions.length})`}
      </button>
    </div>
  );
}
