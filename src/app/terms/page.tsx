import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — TechPath Academy",
  description: "The terms and conditions for using TechPath Academy.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: November 17, 2026</p>

      <div className="prose prose-slate mt-8 max-w-none dark:prose-invert">
        <h2 className="text-slate-800 dark:text-slate-200">1. Acceptance of Terms</h2>
        <p className="text-slate-600 dark:text-slate-400">
          By creating an account or using TechPath Academy, you agree to these terms. If you do not agree, do not use the platform.
        </p>

        <h2 className="text-slate-800 dark:text-slate-200">2. Your Account</h2>
        <ul className="text-slate-600 dark:text-slate-400">
          <li>You must provide accurate information when registering.</li>
          <li>You are responsible for keeping your password secure.</li>
          <li>You may not share your account with others.</li>
          <li>We encourage enabling two-factor authentication (2FA).</li>
        </ul>

        <h2 className="text-slate-800 dark:text-slate-200">3. Courses &amp; Certificates</h2>
        <ul className="text-slate-600 dark:text-slate-400">
          <li>Free tutorials are available to all registered users.</li>
          <li>Paid courses grant lifetime access to the purchased course content.</li>
          <li>Certificates are issued upon meeting completion criteria (passing the final exam).</li>
          <li>Certificates contain a unique verification code and QR link for authenticity.</li>
          <li>Certificate fraud or falsification results in account termination.</li>
        </ul>

        <h2 className="text-slate-800 dark:text-slate-200">4. Payments &amp; Refunds</h2>
        <ul className="text-slate-600 dark:text-slate-400">
          <li>We support Telebirr, CBE, PayPal, Card, and M-Pesa payments.</li>
          <li>Refund requests must be made within 7 days of purchase if you have completed less than 25% of the course.</li>
          <li>Contact <a href="mailto:ademezerihun2013@gmail.com" className="text-indigo-600 hover:underline dark:text-indigo-400">ademezerihun2013@gmail.com</a> for refund requests.</li>
        </ul>

        <h2 className="text-slate-800 dark:text-slate-200">5. Acceptable Use</h2>
        <ul className="text-slate-600 dark:text-slate-400">
          <li>Do not attempt to hack, disrupt, or reverse-engineer the platform.</li>
          <li>Do not post malicious code, spam, or illegal content.</li>
          <li>Do not use automated scripts to scrape content.</li>
          <li>Violations may result in account suspension or termination.</li>
        </ul>

        <h2 className="text-slate-800 dark:text-slate-200">6. Intellectual Property</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Course content, videos, quizzes, and certificates are the property of TechPath Academy and its instructors.
          You may not redistribute, resell, or republish course materials without written permission.
        </p>

        <h2 className="text-slate-800 dark:text-slate-200">7. Disclaimer</h2>
        <p className="text-slate-600 dark:text-slate-400">
          TechPath Academy is an educational platform. While we strive for accuracy, we do not guarantee that course
          content will lead to employment or certification by third parties. Learning outcomes depend on individual effort.
        </p>

        <h2 className="text-slate-800 dark:text-slate-200">8. Changes to Terms</h2>
        <p className="text-slate-600 dark:text-slate-400">
          We may update these terms periodically. Continued use after changes constitutes acceptance.
        </p>

        <h2 className="text-slate-800 dark:text-slate-200">9. Contact</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Email <a href="mailto:ademezerihun2013@gmail.com" className="text-indigo-600 hover:underline dark:text-indigo-400">ademezerihun2013@gmail.com</a> with any questions.
        </p>
      </div>
    </div>
  );
}
