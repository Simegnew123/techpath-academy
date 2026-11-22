"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Line = { type: "input" | "output" | "system"; text: string };

const BANNER = `TechPath Virtual Lab v2.0 — type "help" to get started.
Try: ping 8.8.8.8 · nmap scanme.example.com · ifconfig`;

const COMMANDS: Record<string, (args: string[]) => string> = {
  help: () =>
    `Available commands:
  help       Show this help message
  ping       Ping a host — e.g. ping 8.8.8.8
  nmap       Scan a target for open ports — e.g. nmap 10.0.0.1
  ifconfig   Show network interface configuration
  whoami     Display current lab user
  ls         List files in the working directory
  cat        Read a file — e.g. cat README.txt
  echo       Print text to stdout
  clear      Clear the terminal screen`,
  ping: (args) => {
    const target = args[0] || "8.8.8.8";
    return `PING ${target} 56(84) bytes of data.
64 bytes from ${target}: icmp_seq=1 ttl=117 time=14.2 ms
64 bytes from ${target}: icmp_seq=2 ttl=117 time=13.8 ms
64 bytes from ${target}: icmp_seq=3 ttl=117 time=15.1 ms
64 bytes from ${target}: icmp_seq=4 ttl=117 time=14.5 ms

--- ${target} ping statistics ---
4 packets transmitted, 4 received, 0% packet loss
rtt min/avg/max/mdev = 13.8/14.4/15.1/0.5 ms`;
  },
  nmap: (args) => {
    const target = args[0] || "scanme.example.com";
    return `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString().split("T")[1].slice(0, 8)} UTC
Nmap scan report for ${target}
Host is up (0.045s latency).
Not shown: 996 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh      OpenSSH 8.9p1
80/tcp   open  http     nginx 1.24.0
443/tcp  open  https    nginx 1.24.0
3306/tcp open  mysql    MySQL 8.0.35

Nmap done: 1 IP address (1 host up) scanned in 1.23 seconds`;
  },
  ifconfig: () =>
    `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255
        inet6 fe80::a00:27ff:fea4:c3e1  prefixlen 64  scopeid 0x20<link>
        ether 08:00:27:a4:c3:e1  txqueuelen 1000  (Ethernet)
        RX packets 1284  bytes 892431 (892.4 KB)
        TX packets 742  bytes 98213 (98.2 KB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)`,
  whoami: () => "guest@techpath-lab",
  ls: () => "courses/  labs/  scripts/  notes.md  README.txt",
  cat: (args) => {
    const file = args[0] || "";
    if (file === "README.txt")
      return "Welcome to TechPath Academy Virtual Lab!\nType 'help' to see available commands.\nTry: ping 8.8.8.8 | nmap scanme.example.com | ifconfig";
    if (file === "notes.md")
      return "# My Lab Notes\n- Practice ping and nmap commands\n- Review OSI model layers\n- Set up a local VM for testing\n- Complete the Network+ module";
    return `cat: ${file}: No such file or directory`;
  },
  echo: (args) => args.join(" ") || "",
};

export default function TerminalDemo() {
  const [lines, setLines] = useState<Line[]>([
    { type: "system", text: BANNER },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const runCommand = useCallback((raw: string) => {
    const trimmed = raw.trim();
    const newLines: Line[] = [{ type: "input", text: trimmed }];

    if (trimmed === "clear") {
      setLines([{ type: "system", text: BANNER }]);
      return;
    }

    const [cmd, ...args] = trimmed.split(/\s+/);
    const handler = COMMANDS[cmd.toLowerCase()];
    if (handler) {
      newLines.push({ type: "output", text: handler(args) });
    } else if (trimmed) {
      newLines.push({
        type: "output",
        text: `command not found: ${cmd}. Type "help" for available commands.`,
      });
    }

    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setHistory((prev) => [...prev, input]);
      runCommand(input);
    }
    setInput("");
    setHistoryIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(newIdx);
      setInput(history[newIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === -1) return;
      const newIdx = historyIdx + 1;
      if (newIdx >= history.length) {
        setHistoryIdx(-1);
        setInput("");
      } else {
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.focus()}
        className="overflow-hidden rounded-xl border border-slate-700 bg-[#0f172a] shadow-[0_20px_60px_-15px_rgba(37,99,235,0.4)] ring-1 ring-indigo-500/20"
      >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-500" />
        <span className="h-3 w-3 rounded-full bg-yellow-500" />
        <span className="h-3 w-3 rounded-full bg-green-500" />
        <span className="ml-2 font-mono text-xs text-slate-400">guest@techpath-lab: ~</span>
      </div>

      {/* Terminal body */}
      <div className="h-56 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {line.type === "system" && (
              <span className="text-slate-500">{line.text}</span>
            )}
            {line.type === "input" && (
              <div>
                <span className="text-green-400">guest@techpath-lab</span>
                <span className="text-slate-500">:</span>
                <span className="text-blue-400">~</span>
                <span className="text-slate-500">$ </span>
                <span className="text-slate-200">{line.text}</span>
              </div>
            )}
            {line.type === "output" && (
              <span className="text-slate-300">{line.text}</span>
            )}
          </div>
        ))}

        {/* Input line */}
        <form onSubmit={handleSubmit} className="mt-0 flex items-center">
          <span className="text-green-400">guest@techpath-lab</span>
          <span className="text-slate-500">:</span>
          <span className="text-blue-400">~</span>
          <span className="text-slate-500">$&nbsp;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            className="flex-1 border-none bg-transparent font-mono text-[13px] text-slate-200 caret-green-400 outline-none"
            placeholder="type a command..."
          />
        </form>
        <div ref={endRef} />
      </div>
    </div>

      {/* Quick command chips — tap instead of type on mobile */}
      <div className="flex flex-wrap gap-1.5">
        {[
          "ping 8.8.8.8",
          "nmap scanme",
          "ifconfig",
          "whoami",
          "ls",
          "cat README.txt",
        ].map((cmd) => (
          <button
            key={cmd}
            onClick={() => runCommand(cmd === "nmap scanme" ? "nmap scanme.example.com" : cmd)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
