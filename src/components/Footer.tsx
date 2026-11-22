"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";

export default function Footer() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(mql.matches || (window.navigator as any).standalone === true);
  }, []);

  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Top section: brand + links */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" aria-hidden="true" />
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200">TechPath Academy</span>
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Practical IT training for the next generation of tech professionals.
              Networking, security, databases, and AI — taught hands-on.
            </p>
          </div>

          {/* Courses */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Courses</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/courses" className="hover:text-indigo-600 dark:hover:text-indigo-400">All Courses</Link></li>
              <li><Link href="/courses?category=cyber-security" className="hover:text-indigo-600 dark:hover:text-indigo-400">Cyber Security</Link></li>
              <li><Link href="/courses?category=ethical-hacking" className="hover:text-indigo-600 dark:hover:text-indigo-400">Ethical Hacking</Link></li>
              <li><Link href="/courses?category=artificial-intelligence" className="hover:text-indigo-600 dark:hover:text-indigo-400">AI &amp; ML</Link></li>
              <li><Link href="/courses?category=networking" className="hover:text-indigo-600 dark:hover:text-indigo-400">Networking</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Resources</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/books" className="hover:text-indigo-600 dark:hover:text-indigo-400">Book Library</Link></li>
              <li><Link href="/flashcards" className="hover:text-indigo-600 dark:hover:text-indigo-400">Flashcards</Link></li>
              <li><Link href="/jobs" className="hover:text-indigo-600 dark:hover:text-indigo-400">Job Board</Link></li>
              <li><Link href="/hall-of-fame" className="hover:text-indigo-600 dark:hover:text-indigo-400">Hall of Fame</Link></li>
              <li><Link href="/services" className="hover:text-indigo-600 dark:hover:text-indigo-400">Other Services</Link></li>
            </ul>
          </div>

          {/* Legal + Support */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Legal &amp; Support</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/verify" className="hover:text-indigo-600 dark:hover:text-indigo-400">Verify Certificate</Link></li>
              <li><Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact</Link></li>
              {!isStandalone && (
                <li><Link href="/install" className="hover:text-indigo-600 dark:hover:text-indigo-400">📲 Install App</Link></li>
              )}
              <li><a href="mailto:ademezerihun2013@gmail.com" className="hover:text-indigo-600 dark:hover:text-indigo-400">Email Support</a></li>
            </ul>
          </div>
        </div>

        {/* Trust badges — user-facing, no internal implementation details */}
        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            <span>2FA / TOTP Supported</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 00-6 0V9h6z" clipRule="evenodd" /></svg>
            <span>End-to-End Encrypted Sessions</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v2H7V5zm0 4h6v2H7V9zm0 4h4v2H7v-2z" clipRule="evenodd" /></svg>
            <span>Isolated Lab Environments</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M13 7H7v6h6V7z" /><path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h1a2 2 0 012 2v1h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v1a2 2 0 01-2 2h-1v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H6a2 2 0 01-2-2v-1H3a1 1 0 110-2h1V9H3a1 1 0 010-2h1V6a2 2 0 012-2h1V2zm5 3a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2H7z" clipRule="evenodd" /></svg>
            <span>Verifiable QR Certificates</span>
          </div>
          <Link
            href="/verify"
            className="flex items-center gap-2 text-xs font-medium text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            Verify a Certificate →
          </Link>
        </div>

        {/* Bottom bar — aligned baseline, social icons instead of hosting info */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © 2026 TechPath Academy. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* Social icons */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 transition hover:text-red-600 dark:text-slate-500 dark:hover:text-red-500"
              aria-label="YouTube"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
            <a
              href="https://github.com/Simegnew123/techpath-academy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
              aria-label="GitHub"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
            </a>
            <a
              href="https://t.me/techpathacademy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 transition hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400"
              aria-label="Telegram"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.681-1.8-1.186-.78-.417-1.21.258-1.911.171-.177 3.155-2.889 3.213-3.131.008-.033.011-.154-.058-.218s-.168-.042-.24-.024c-.103.023-1.74 1.106-4.909 3.252-.465.319-.886.475-1.263.465-.416-.011-1.216-.235-1.812-.43-.729-.236-1.31-.362-1.26-.765.025-.207.31-.419.856-.636 3.353-1.461 5.587-2.426 6.703-2.894 3.19-1.327 3.854-1.559 4.286-1.567z" /></svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 transition hover:text-blue-700 dark:text-slate-500 dark:hover:text-blue-500"
              aria-label="LinkedIn"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" /></svg>
            </a>
            <span className="ml-2 hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">Built with Next.js &amp; TypeScript</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
