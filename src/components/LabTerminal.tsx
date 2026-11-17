"use client";

import { useState, useEffect, useRef } from "react";

type LabStep = {
  instruction: string;
  expectedCommand: string;
  hint: string;
  completed: boolean;
};

type LabCommand = {
  command: string;
  output: string;
  success?: boolean;
};

type LabData = {
  type: string;
  title: string;
  description: string;
  environment: string;
  steps: LabStep[];
  commands: LabCommand[];
};

export default function LabTerminal({ lessonId }: { lessonId: string }) {
  const [lab, setLab] = useState<LabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ cmd: string; output: string; type: "cmd" | "output" | "success" | "error" | "system" }[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch lab config for this lesson
    fetch(`/api/labs/complete?lessonId=${lessonId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.lab) {
          setLab(data.lab);
          setHistory([
            { cmd: `Lab: ${data.lab.title}`, output: "", type: "system" },
            { cmd: data.lab.description, output: "", type: "system" },
            { cmd: `Environment: ${data.lab.environment}`, output: "", type: "system" },
            { cmd: "", output: "", type: "system" },
            { cmd: `Step 1: ${data.lab.steps[0]?.instruction || "Follow the instructions below."}`, output: "", type: "system" },
            { cmd: "", output: "", type: "system" },
          ]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lessonId]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const findCommand = (cmd: string): LabCommand | undefined => {
    const trimmed = cmd.trim();
    // Match command prefix (e.g., "nmap -sV 192.168.1.1" matches "nmap")
    const baseCmd = trimmed.split(" ")[0];
    // Try exact match first, then prefix match
    return lab?.commands.find(
      (c) => c.command === trimmed || c.command === baseCmd || trimmed.startsWith(c.command + " ")
    );
  };

  const executeCommand = () => {
    const cmd = input.trim();
    if (!cmd) return;

    // Add command to history
    const newHistory = [...history, { cmd: `$ ${cmd}`, output: "", type: "cmd" as const }];

    // Built-in commands
    if (cmd === "clear") {
      setHistory([]);
      setInput("");
      return;
    }

    if (cmd === "help" || cmd === "?") {
      newHistory.push({
        cmd: "Available commands: " + (lab?.commands.map((c) => c.command.split(" ")[0]).join(", ") || ""),
        output: "",
        type: "system" as const,
      });
      setHistory(newHistory);
      setInput("");
      return;
    }

    // Check if command matches expected step
    const step = lab?.steps[currentStep];
    if (step && cmd === step.expectedCommand) {
      // Correct command for this step
      const cmdConfig = findCommand(cmd);
      newHistory.push({
        cmd: cmdConfig?.output || "✓ Command executed successfully.",
        output: "",
        type: "success" as const,
      });
      newHistory.push({
        cmd: `✅ Step ${currentStep + 1} complete!`,
        output: "",
        type: "success" as const,
      });

      const nextStep = currentStep + 1;
      if (nextStep < (lab?.steps.length || 0)) {
        newHistory.push({
          cmd: `Step ${nextStep + 1}: ${lab!.steps[nextStep].instruction}`,
          output: "",
          type: "system" as const,
        });
      } else {
        // All steps complete!
        newHistory.push({
          cmd: "🎉 Lab complete! All steps finished. Submitting...",
          output: "",
          type: "success" as const,
        });
        setCompleted(true);
        submitLab();
      }

      setHistory(newHistory);
      setCurrentStep(nextStep);
      setInput("");
      return;
    }

    // Check if command is a known command (but not the expected one)
    const knownCmd = findCommand(cmd);
    if (knownCmd) {
      newHistory.push({
        cmd: knownCmd.output,
        output: "",
        type: "output" as const,
      });
      setHistory(newHistory);
      setInput("");
      return;
    }

    // Unknown command
    newHistory.push({
      cmd: `command not found: ${cmd.split(" ")[0]}. Type 'help' for available commands.`,
      output: "",
      type: "error" as const,
    });
    setHistory(newHistory);
    setInput("");
  };

  const showHint = () => {
    const step = lab?.steps[currentStep];
    if (step) {
      setHistory((prev) => [...prev, { cmd: `💡 Hint: ${step.hint}`, output: "", type: "system" }]);
    }
  };

  const submitLab = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/labs/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          stepsCompleted: lab?.steps.length || 0,
          totalSteps: lab?.steps.length || 0,
          completed: true,
        }),
      });
    } catch {
      // Silently fail — lab completion is best-effort
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="animate-pulse rounded-xl bg-slate-100 p-6 dark:bg-slate-800">Loading lab environment...</div>;
  }

  if (!lab) {
    return null; // No lab for this lesson
  }

  return (
    <div className="mt-8">
      {/* Lab header */}
      <div className="flex items-center justify-between rounded-t-xl bg-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Terminal dots */}
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <span className="ml-3 text-sm font-medium text-slate-300">
            {lab.type === "network_sim" ? "🌐" : lab.type === "packet_capture" ? "📦" : "🐧"} {lab.title}
          </span>
        </div>
        <div className="text-xs text-slate-400">{lab.environment}</div>
      </div>

      {/* Terminal body */}
      <div
        ref={terminalRef}
        className="h-80 overflow-y-auto rounded-b-xl border border-t-0 border-slate-700 bg-slate-900 p-4 font-mono text-sm"
      >
        {history.map((line, i) => (
          <div
            key={i}
            className={
              line.type === "cmd"
                ? "text-green-400"
                : line.type === "success"
                ? "text-green-300 font-semibold"
                : line.type === "error"
                ? "text-red-400"
                : line.type === "system"
                ? "text-slate-400"
                : "text-slate-300"
            }
          >
            {line.cmd || "\u00A0"}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center gap-1">
          <span className="text-green-400">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && executeCommand()}
            className="flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
            placeholder="Type a command and press Enter..."
            spellCheck={false}
            autoFocus
          />
        </div>
      </div>

      {/* Lab controls */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Step {Math.min(currentStep + 1, lab.steps.length)} of {lab.steps.length}
          {completed && <span className="ml-2 font-semibold text-green-600 dark:text-green-400">✓ Completed</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={showHint}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            💡 Hint
          </button>
          <button
            onClick={() => { setHistory([]); setCurrentStep(0); setCompleted(false); }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${(currentStep / lab.steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
