import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — TechPath Academy",
  description: "Get in touch with TechPath Academy.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Contact Us</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Questions, feedback, or partnership inquiries? We&apos;d love to hear from you.
      </p>

      <div className="mt-8 space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">📧 Email</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            <a href="mailto:ademezerihun2013@gmail.com" className="text-indigo-600 hover:underline dark:text-indigo-400">
              ademezerihun2013@gmail.com
            </a>
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            We typically respond within 24–48 hours.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">📚 What can we help with?</h2>
          <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-400">
            <li>• Course enrollment and payment issues</li>
            <li>• Certificate verification</li>
            <li>• Refund requests (within 7 days, &lt;25% completed)</li>
            <li>• Account or password problems</li>
            <li>• Instructor partnerships</li>
            <li>• Bug reports and feature suggestions</li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">🏢 About TechPath Academy</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            TechPath Academy is an online learning platform focused on practical IT skills —
            networking, cybersecurity, database administration, and artificial intelligence.
            We believe quality tech education should be accessible to everyone.
          </p>
        </div>
      </div>
    </div>
  );
}
