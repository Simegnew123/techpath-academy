"use client";

import { useState } from "react";

type QuestionInput = {
  text: string;
  type: "mcq" | "true_false" | "short_answer";
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
};

export default function QuizBuilder({
  lessonId,
  courseId,
  onSave,
  onCancel,
}: {
  lessonId: string;
  courseId: string;
  onSave: (quizData: {
    title: string;
    description: string;
    passingScore: number;
    maxAttempts: number;
    timeLimit: number;
    shuffleQuestions: boolean;
    questions: QuestionInput[];
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [timeLimit, setTimeLimit] = useState(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { text: "", type: "mcq", options: ["", "", "", ""], correctAnswer: "", explanation: "", points: 1 },
  ]);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", type: "mcq", options: ["", "", "", ""], correctAnswer: "", explanation: "", points: 1 },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, updates: Partial<QuestionInput>) => {
    setQuestions(questions.map((q, i) => {
      if (i !== idx) return q;
      const updated = { ...q, ...updates };
      // Reset options/correctAnswer when type changes
      if (updates.type) {
        if (updates.type === "true_false") {
          updated.options = ["True", "False"];
          updated.correctAnswer = "";
        } else if (updates.type === "short_answer") {
          updated.options = [];
          updated.correctAnswer = "";
        } else {
          updated.options = ["", "", "", ""];
          updated.correctAnswer = "";
        }
      }
      return updated;
    }));
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions(questions.map((q, i) => {
      if (i !== qIdx) return q;
      const options = [...q.options];
      options[optIdx] = value;
      return { ...q, options };
    }));
  };

  const addOption = (qIdx: number) => {
    setQuestions(questions.map((q, i) => i === qIdx ? { ...q, options: [...q.options, ""] } : q));
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    setQuestions(questions.map((q, i) => {
      if (i !== qIdx) return q;
      const options = q.options.filter((_, oi) => oi !== optIdx);
      const correctAnswer = q.correctAnswer === q.options[optIdx] ? "" : q.correctAnswer;
      return { ...q, options, correctAnswer };
    }));
  };

  const handleSave = async () => {
    if (!title.trim()) { alert("Quiz title is required"); return; }
    if (questions.some((q) => !q.text.trim())) { alert("All questions must have text"); return; }
    if (questions.some((q) => (q.type === "mcq" || q.type === "true_false") && !q.correctAnswer)) {
      alert("All MCQ and True/False questions must have a correct answer selected");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title, description, passingScore, maxAttempts, timeLimit, shuffleQuestions,
        questions: questions.filter((q) => q.text.trim()),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-1">📝 Quiz Builder</h3>
        <p className="text-sm text-gray-600">Create an auto-graded assessment for this lesson</p>
      </div>

      {/* Quiz Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Quiz Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Module 1 Knowledge Check"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the quiz"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Passing Score (%)</label>
          <input type="number" min={0} max={100} value={passingScore}
            onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Attempts (0 = unlimited)</label>
          <input type="number" min={0} value={maxAttempts}
            onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 0)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time Limit (minutes, 0 = none)</label>
          <input type="number" min={0} value={timeLimit}
            onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
        </div>
        <div className="flex items-center gap-2 pt-7">
          <input type="checkbox" id="shuffle" checked={shuffleQuestions}
            onChange={(e) => setShuffleQuestions(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="shuffle" className="text-sm font-medium">Shuffle questions for each attempt</label>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Questions ({questions.length})</h4>
          <button onClick={addQuestion} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
            + Add Question
          </button>
        </div>

        {questions.map((q, qIdx) => (
          <div key={qIdx} className="border-2 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-gray-500">Q{qIdx + 1}</span>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(qIdx)} className="text-red-500 text-sm hover:text-red-700">
                  ✕ Remove
                </button>
              )}
            </div>

            <input value={q.text} onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
              placeholder="Enter your question..."
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none font-medium" />

            <div className="flex gap-3">
              <select value={q.type} onChange={(e) => updateQuestion(qIdx, { type: e.target.value as any })}
                className="p-2 border rounded-lg text-sm">
                <option value="mcq">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
              </select>
              <select value={q.points} onChange={(e) => updateQuestion(qIdx, { points: parseInt(e.target.value) })}
                className="p-2 border rounded-lg text-sm">
                {[1, 2, 3, 5].map((p) => <option key={p} value={p}>{p} point{p !== 1 ? "s" : ""}</option>)}
              </select>
            </div>

            {/* MCQ Options */}
            {q.type === "mcq" && (
              <div className="space-y-2 ml-4">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${qIdx}`} checked={q.correctAnswer === opt}
                      onChange={() => updateQuestion(qIdx, { correctAnswer: opt })} className="w-4 h-4" />
                    <input value={opt} onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                      placeholder={`Option ${optIdx + 1}`}
                      className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                    {q.options.length > 2 && (
                      <button onClick={() => removeOption(qIdx, optIdx)} className="text-red-400 hover:text-red-600">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addOption(qIdx)} className="text-sm text-blue-600 hover:underline ml-6">
                  + Add option
                </button>
                <p className="text-xs text-gray-400 ml-6">Select the radio button for the correct answer</p>
              </div>
            )}

            {/* True/False */}
            {q.type === "true_false" && (
              <div className="flex gap-3 ml-4">
                {["True", "False"].map((opt) => (
                  <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${q.correctAnswer === opt ? "bg-green-50 border-green-400" : "border-gray-300"}`}>
                    <input type="radio" name={`correct-tf-${qIdx}`} checked={q.correctAnswer === opt}
                      onChange={() => updateQuestion(qIdx, { correctAnswer: opt })} className="w-4 h-4" />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {/* Short Answer */}
            {q.type === "short_answer" && (
              <div className="ml-4">
                <input value={q.correctAnswer} onChange={(e) => updateQuestion(qIdx, { correctAnswer: e.target.value })}
                  placeholder="Model answer / key terms (auto-graded by keyword matching)"
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                <p className="text-xs text-gray-400 mt-1">The system checks if the student's answer contains 60%+ of the key words (4+ chars)</p>
              </div>
            )}

            {/* Explanation */}
            <input value={q.explanation} onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
              placeholder="Explanation shown after answering (optional)"
              className="w-full p-2 border rounded-lg text-sm italic text-gray-600 focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Quiz"}
        </button>
        <button onClick={onCancel}
          className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  );
}
