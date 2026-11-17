"use client";

import { useState, useEffect, useRef } from "react";

type Mode = "focus" | "break";

export default function PomodoroTimer({
  courseId,
  lessonId,
}: {
  courseId: string;
  lessonId?: string;
}) {
  const [mode, setMode] = useState<Mode>("focus");
  const [duration, setDuration] = useState(25); // minutes
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            // Session complete
            setRunning(false);
            if (mode === "focus") {
              setSessionsCompleted((c) => c + 1);
              // Log session
              fetch("/api/study-sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  courseId,
                  lessonId: lessonId || null,
                  durationMinutes: duration,
                  sessionType: "pomodoro",
                  completed: true,
                }),
              }).catch(() => {});
              // Switch to break
              setMode("break");
              const breakDur = 5;
              setDuration(breakDur);
              return breakDur * 60;
            } else {
              setMode("focus");
              const focusDur = 25;
              setDuration(focusDur);
              return focusDur * 60;
            }
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, duration, courseId, lessonId]);

  function changeMode(newMode: Mode) {
    setRunning(false);
    setMode(newMode);
    const dur = newMode === "focus" ? 25 : 5;
    setDuration(dur);
    setSecondsLeft(dur * 60);
  }

  function adjustTime(delta: number) {
    const newDur = Math.max(1, Math.min(60, duration + delta));
    setDuration(newDur);
    if (!running) setSecondsLeft(newDur * 60);
  }

  function toggle() {
    if (running) {
      setRunning(false);
    } else {
      setRunning(true);
    }
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(duration * 60);
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = ((duration * 60 - secondsLeft) / (duration * 60)) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">🍅 Pomodoro Timer</h3>
        <div className="flex gap-1">
          <button
            onClick={() => changeMode("focus")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              mode === "focus"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => changeMode("break")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              mode === "break"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            Break
          </button>
        </div>
      </div>

      {/* Circular progress */}
      <div className="flex flex-col items-center">
        <div className="relative h-40 w-40">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 144 144">
            <circle cx="72" cy="72" r="64" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-700" />
            <circle
              cx="72" cy="72" r="64" fill="none" stroke="currentColor" strokeWidth="6"
              strokeLinecap="round"
              className={mode === "focus" ? "text-indigo-500" : "text-emerald-500"}
              strokeDasharray={`${2 * Math.PI * 64}`}
              strokeDashoffset={`${2 * Math.PI * 64 * (1 - progress / 100)}`}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums text-slate-800 dark:text-slate-100">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <span className="text-xs text-slate-400">{mode === "focus" ? "Focus time" : "Break time"}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center gap-3">
          {!running && (
            <button
              onClick={() => adjustTime(-5)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
            >
              -5m
            </button>
          )}
          <button
            onClick={toggle}
            className={`rounded-xl px-6 py-2.5 font-semibold text-white transition ${
              running
                ? "bg-red-500 hover:bg-red-600"
                : mode === "focus"
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {running ? "⏸ Pause" : "▶ Start"}
          </button>
          {!running && (
            <button
              onClick={() => adjustTime(5)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
            >
              +5m
            </button>
          )}
          <button
            onClick={reset}
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
          >
            ↻
          </button>
        </div>

        {sessionsCompleted > 0 && (
          <p className="mt-3 text-xs text-slate-400">
            🍅 {sessionsCompleted} session{sessionsCompleted > 1 ? "s" : ""} completed
          </p>
        )}
      </div>
    </div>
  );
}
