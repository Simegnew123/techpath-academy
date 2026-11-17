import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — TechPath Academy",
  description: "How TechPath Academy collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: November 17, 2026</p>

      <div className="prose prose-slate mt-8 max-w-none dark:prose-invert">
        <h2 className="text-slate-800 dark:text-slate-200">1. Overview</h2>
        <p className="text-slate-600 dark:text-slate-400">
          TechPath Academy (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is an online learning platform that provides IT, networking,
          cybersecurity, and AI courses. We respect your privacy and are committed to protecting your personal data.
        </p>

        <h2 className="text-slate-800 dark:text-slate-200">2. Data We Collect</h2>
        <ul className="text-slate-600 dark:text-slate-400">
          <li><strong>Account data:</strong> Name, email address, and hashed password.</li>
          <li><strong>Learning data:</strong> Course progress, quiz results, certificates earned, study notes, bookmarks.</li>
          <li><strong>Security data:</strong> Security question (stored as a hash), two-factor authentication secret (encrypted).</li>
          <li><strong>Payment data:</strong> Payment method selected and transaction status. We do <strong>not</strong> store full card numbers or banking credentials.</li>
          <li><strong>Usage data:</strong> Pages visited, search queries, and approximate IP address for rate-limiting and abuse prevention.</li>
        </ul>

        <h2 className="text-slate-800 dark:text-slate-200">3. How We Use Your Data</h2>
        <ul className="text-slate-600 dark:text-slate-400">
          <li>To provide and manage your account and courses.</li>
          <li>To issue verifiable certificates upon course completion.</li>
          <li>To prevent fraud, spam, and abuse via rate limiting.</li>
          <li>To improve course content and platform features.</li>
        </ul>

        <h2 className="text-slate-800 dark:text-slate-200">4. Data We Do NOT Collect</h2>
        <ul className="text-slate-600 dark:text-slate-400">
          <li>We do not sell or rent your data to third parties.</li>
          <li>We do not use third-party advertising trackers.</li>
          <li>We do not store payment card numbers or banking PINs.</li>
        </ul>

        <h2 className="text-slate-800 dark:text-slate-200">5. Data Storage</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Your data is stored on secured servers. Passwords are hashed using bcrypt. Security answers are hashed.
          Two-factor secrets are stored server-side and never shared. Session cookies are marked <code>HttpOnly</code>,
          <code>Secure</code>, and <code>SameSite=Strict</code>.
        </p>

        <h2 className="text-slate-800 dark:text-slate-200">6. Your Rights</h2>
        <ul className="text-slate-600 dark:text-slate-400">
          <li><strong>Access:</strong> You can view your data in your dashboard and settings.</li>
          <li><strong>Correction:</strong> You can update your name, email, and password in settings.</li>
          <li><strong>Deletion:</strong> Contact us to request account deletion.</li>
        </ul>

        <h2 className="text-slate-800 dark:text-slate-200">7. Security Measures</h2>
        <ul className="text-slate-600 dark:text-slate-400">
          <li>Content Security Policy (CSP), HSTS, X-Frame-Options headers enforced.</li>
          <li>Rate limiting on authentication and search endpoints.</li>
          <li>Server-side role-based access control (RBAC) for admin areas.</li>
          <li>Optional two-factor authentication (TOTP) for all users.</li>
        </ul>

        <h2 className="text-slate-800 dark:text-slate-200">8. Contact</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Questions about this policy? Email us at{" "}
          <a href="mailto:ademezerihun2013@gmail.com" className="text-indigo-600 hover:underline dark:text-indigo-400">
            ademezerihun2013@gmail.com
          </a>.
        </p>
      </div>
    </div>
  );
}
