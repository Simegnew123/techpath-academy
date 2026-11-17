import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Top section: brand + links */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
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

          {/* Legal + Contact */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Legal &amp; Support</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact</Link></li>
              <li><a href="mailto:ademezerihun2013@gmail.com" className="hover:text-indigo-600 dark:hover:text-indigo-400">Email Support</a></li>
            </ul>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <span>Bcrypt Password Hashing</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            <span>2FA / TOTP Supported</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" clipRule="evenodd" /></svg>
            <span>CSP &amp; HSTS Headers</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M13 7H7v6h6V7z" /><path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h1a2 2 0 012 2v1h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v1a2 2 0 01-2 2h-1v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H6a2 2 0 01-2-2v-1H3a1 1 0 110-2h1V9H3a1 1 0 010-2h1V6a2 2 0 012-2h1V2zM5 6v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H6a1 1 0 00-1 1z" clipRule="evenodd" /></svg>
            <span>Verifiable QR Certificates</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 9.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 011.414-1.414L10 8.586l2.293-2.293a1 1 0 011.414 1.414L11.414 10l2.293 2.293z" /></svg>
            <span>Rate-Limited APIs</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} TechPath Academy. All rights reserved.</p>
          <p>Built with Next.js &amp; TypeScript. Hosted on Render.</p>
        </div>
      </div>
    </footer>
  );
}
