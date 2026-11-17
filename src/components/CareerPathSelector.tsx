"use client";

import { useState } from "react";
import Link from "next/link";

type Path = {
  id: string;
  title: string;
  icon: string;
  tagline: string;
  duration: string;
  difficulty: string;
  skills: string[];
  tools: string[];
  roadmap: { phase: string; modules: string[] }[];
  courseSlug: string;
};

const PATHS: Path[] = [
  {
    id: "network-engineer",
    title: "Network Engineer",
    icon: "🌐",
    tagline: "Design, configure, and troubleshoot enterprise networks",
    duration: "4–6 months",
    difficulty: "Beginner → Intermediate",
    skills: ["OSI Model", "TCP/IP", "Subnetting (VLSM)", "Routing Protocols", "VLANs & Trunking", "Network Security"],
    tools: ["Cisco IOS", "Wireshark", "GNS3", "nmap", "ping / traceroute"],
    roadmap: [
      { phase: "Phase 1 — Fundamentals", modules: ["Networking Essentials", "OSI Model & TCP/IP Suite", "IP Addressing & Subnetting"] },
      { phase: "Phase 2 — Routing & Switching", modules: ["Static & Dynamic Routing", "VLANs, STP & Inter-VLAN Routing", "Access Control Lists (ACLs)"] },
      { phase: "Phase 3 — Advanced", modules: ["Network Security & VPNs", "Wireless Networking", "Troubleshooting Methodology"] },
    ],
    courseSlug: "networking",
  },
  {
    id: "soc-analyst",
    title: "SOC Analyst",
    icon: "🔐",
    tagline: "Monitor, detect, and respond to security threats in real time",
    duration: "3–5 months",
    difficulty: "Intermediate",
    skills: ["Threat Intelligence", "SIEM Operations", "Log Analysis", "Incident Response", "Malware Analysis", "IDS/IPS"],
    tools: ["Splunk", "Wireshark", "Snort/Suricata", "MITRE ATT&CK", "VirusTotal"],
    roadmap: [
      { phase: "Phase 1 — Security Foundations", modules: ["Cyber Security Fundamentals", "Threat Landscapes & Attack Vectors", "Security Policies & Frameworks"] },
      { phase: "Phase 2 — Detection & Monitoring", modules: ["SIEM & Log Analysis", "Network Traffic Analysis", "Intrusion Detection Systems"] },
      { phase: "Phase 3 — Response", modules: ["Incident Response Playbooks", "Digital Forensics Basics", "Threat Hunting Techniques"] },
    ],
    courseSlug: "cyber-security",
  },
  {
    id: "pentester",
    title: "Penetration Tester",
    icon: "🛡️",
    tagline: "Think like an attacker to find and fix vulnerabilities",
    duration: "5–8 months",
    difficulty: "Intermediate → Advanced",
    skills: ["Reconnaissance", "Vulnerability Scanning", "Exploitation", "Privilege Escalation", "Post-Exploitation", "Reporting"],
    tools: ["Kali Linux", "Metasploit", "Burp Suite", "Nmap", "Hydra", "sqlmap"],
    roadmap: [
      { phase: "Phase 1 — Hacking Fundamentals", modules: ["Ethical Hacking Overview & Legal Framework", "Information Gathering & OSINT", "Scanning & Enumeration"] },
      { phase: "Phase 2 — Exploitation", modules: ["Vulnerability Assessment", "Network & Web App Exploitation", "Privilege Escalation Techniques"] },
      { phase: "Phase 3 — Professional Practice", modules: ["Post-Exploitation & Persistence", "Writing Penetration Test Reports", "CTF Practice & Skill Building"] },
    ],
    courseSlug: "ethical-hacking",
  },
  {
    id: "db-admin",
    title: "Database Administrator",
    icon: "🗄️",
    tagline: "Manage, optimize, and secure mission-critical databases",
    duration: "3–5 months",
    difficulty: "Beginner → Intermediate",
    skills: ["SQL (DDL/DML/DCL)", "Database Design", "Performance Tuning", "Backup & Recovery", "High Availability", "Security"],
    tools: ["MySQL", "PostgreSQL", "MongoDB", "Redis", "pgAdmin", "DBeaver"],
    roadmap: [
      { phase: "Phase 1 — SQL & Design", modules: ["Relational Database Concepts", "SQL Fundamentals — SELECT, JOIN, Aggregation", "Database Design & Normalization"] },
      { phase: "Phase 2 — Administration", modules: ["Installation & Configuration", "User Management & Access Control", "Backup, Restore & Recovery Strategies"] },
      { phase: "Phase 3 — Advanced Ops", modules: ["Performance Tuning & Query Optimization", "Replication & High Availability", "Database Security Best Practices"] },
    ],
    courseSlug: "database-administration",
  },
  {
    id: "it-support",
    title: "IT Support Specialist",
    icon: "🖥️",
    tagline: "Be the go-to problem solver for hardware, OS, and network issues",
    duration: "2–4 months",
    difficulty: "Beginner",
    skills: ["Hardware Troubleshooting", "Windows & Linux Admin", "Ticketing Systems", "Network Basics", "Scripting & Automation", "Customer Service"],
    tools: ["Active Directory", "PowerShell", "Bash", "Remote Desktop", "Ticketing (Jira/RT)"],
    roadmap: [
      { phase: "Phase 1 — Foundations", modules: ["Computer Hardware & Peripherals", "Operating System Fundamentals (Windows & Linux)", "IT Service Management & Ticketing"] },
      { phase: "Phase 2 — Hands-On Support", modules: ["Network Troubleshooting Basics", "User & Permission Management", "Scripting for Automation (PowerShell/Bash)"] },
      { phase: "Phase 3 — Professional Skills", modules: ["Security Awareness for Support", "Cloud Services Basics (M365/AWS)", "Career Prep & Certifications"] },
    ],
    courseSlug: "it-support",
  },
  {
    id: "ai-engineer",
    title: "AI Engineer",
    icon: "🤖",
    tagline: "Build and deploy machine learning and AI-powered solutions",
    duration: "6–10 months",
    difficulty: "Intermediate → Advanced",
    skills: ["Python Programming", "Data Preprocessing", "ML Algorithms", "Deep Learning", "NLP", "Model Deployment"],
    tools: ["Python", "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "Jupyter"],
    roadmap: [
      { phase: "Phase 1 — Programming & Data", modules: ["Python for Data Science", "Statistics & Probability for ML", "Data Cleaning & Visualization"] },
      { phase: "Phase 2 — Machine Learning", modules: ["Supervised Learning Algorithms", "Unsupervised Learning & Clustering", "Model Evaluation & Hyperparameter Tuning"] },
      { phase: "Phase 3 — Deep Learning & Deployment", modules: ["Neural Networks & Deep Learning", "NLP & Large Language Models", "Deploying ML Models to Production"] },
    ],
    courseSlug: "artificial-intelligence",
  },
];

export default function CareerPathSelector() {
  const [active, setActive] = useState(0);
  const path = PATHS[active];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {PATHS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActive(i)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              i === active
                ? "bg-indigo-600 text-white shadow-md"
                : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <span className="text-base">{p.icon}</span>
            {p.title}
          </button>
        ))}
      </div>

      {/* Active path detail */}
      <div
        key={path.id}
        className="mt-6 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:grid-cols-3"
      >
        {/* Left: overview */}
        <div className="lg:col-span-1">
          <div className="text-4xl">{path.icon}</div>
          <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">{path.title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{path.tagline}</p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-xs font-medium text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                {path.duration}
              </span>
              <span className="text-slate-400 dark:text-slate-500">·</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{path.difficulty}</span>
            </div>
          </div>

          <div className="mt-5">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">Key Skills</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {path.skills.map((s) => (
                <span key={s} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">Tools You'll Use</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {path.tools.map((t) => (
                <span key={t} className="rounded-md border border-slate-200 px-2 py-1 font-mono text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <Link
            href={`/courses?category=${path.courseSlug}`}
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Browse {path.title} Courses →
          </Link>
        </div>

        {/* Right: roadmap */}
        <div className="lg:col-span-2">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">Curriculum Roadmap</h4>
          <div className="space-y-5">
            {path.roadmap.map((phase, idx) => (
              <div key={idx} className="relative pl-8">
                {/* Vertical line */}
                {idx < path.roadmap.length - 1 && (
                  <div className="absolute left-3 top-8 h-full w-px bg-slate-200 dark:bg-slate-700" />
                )}
                {/* Dot */}
                <div className={`absolute left-0 top-1.5 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}>
                  {idx + 1}
                </div>
                <h5 className="font-semibold text-slate-800 dark:text-slate-200">{phase.phase}</h5>
                <ul className="mt-1.5 space-y-1">
                  {phase.modules.map((m) => (
                    <li key={m} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
