"use client";

import { useState, useEffect } from "react";
import QuizRenderer from "./QuizRenderer";
import QuizBuilder from "./QuizBuilder";

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

export default function QuizPlayer({
  lessonId,
  courseId,
  lessonTitle,
  userRole,
  onComplete,
}: {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  userRole: string;
  onComplete?: (passed: boolean, score: number) => void;
}) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const isStaff = userRole === "admin" || userRole === "instructor" || userRole === "teaching_assistant";

  useEffect(() => {
    fetch(`/api/quizzes?lessonId=${lessonId}`)
      .then((r) => r.json())
      .then((data) => {
        setQuiz(data.quiz);
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lessonId]);

  const handleSaveQuiz = async (quizData: any) => {
    const res = await fetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...quizData, lessonId, courseId, replaceExisting: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setBuilding(false);
      // Reload quiz
      const reloadRes = await fetch(`/api/quizzes?lessonId=${lessonId}`);
      const reloadData = await reloadRes.json();
      setQuiz(reloadData.quiz);
      setQuestions(reloadData.questions || []);
    } else {
      alert("Failed to save quiz");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading quiz...</div>
      </div>
    );
  }

  // Staff: show builder if no quiz exists or building mode
  if (isStaff && (!quiz || building)) {
    return (
      <QuizBuilder
        lessonId={lessonId}
        courseId={courseId}
        onSave={handleSaveQuiz}
        onCancel={() => setBuilding(false)}
      />
    );
  }

  // Staff with existing quiz: show quiz + edit option
  if (isStaff && quiz) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => setBuilding(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            ✏️ Edit Quiz
          </button>
        </div>
        <QuizRenderer quiz={quiz} questions={questions} lessonId={lessonId} onComplete={onComplete} />
      </div>
    );
  }

  // Student: no quiz configured yet
  if (!quiz) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-2">📝</div>
        <p className="text-gray-500">Quiz is not yet available for this lesson.</p>
      </div>
    );
  }

  // Student: render quiz
  return <QuizRenderer quiz={quiz} questions={questions} lessonId={lessonId} onComplete={onComplete} />;
}
