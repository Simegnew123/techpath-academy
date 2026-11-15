import Link from "next/link";
import { notFound } from "next/navigation";
import { readDB } from "@/lib/store";
import { getCourseById } from "@/lib/courses";
import PrintButton from "./PrintButton";

export const revalidate = 0;

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const db = readDB();
  const cert = db.certificates.find((c) => c.code === code);
  if (!cert) notFound();

  const user = db.users.find((u) => u.id === cert.userId);
  const course = getCourseById(cert.courseId);
  if (!course || !user) notFound();

  const issueDate = new Date(cert.issuedAt);
  const formattedDate = issueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const instructorName = course.instructorId
    ? db.users.find((u) => u.id === course.instructorId)?.name || "Instructor"
    : "Instructor";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-10">
      <div className="mx-auto max-w-4xl px-4">
        {/* Action bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Dashboard
          </Link>
          <PrintButton />
        </div>

        {/* Certificate */}
        <div
          id="certificate"
          className="relative overflow-hidden rounded-3xl border-4 border-amber-300 bg-white p-10 shadow-2xl sm:p-14"
        >
          {/* Decorative border */}
          <div className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-amber-200"></div>

          {/* Watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-[120px] opacity-[0.04]">🏆</span>
          </div>

          {/* Content */}
          <div className="relative text-center">
            {/* Logo / Brand */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">🎓</span>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                TechPath Academy
              </span>
            </div>

            <div className="mt-1 text-sm font-medium uppercase tracking-widest text-amber-600">
              Certificate of Completion
            </div>

            {/* Divider */}
            <div className="mx-auto mt-6 h-px w-48 bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>

            {/* Recipient */}
            <p className="mt-8 text-sm text-slate-500">This certifies that</p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              {user.name}
            </h1>

            {/* Course */}
            <p className="mt-6 text-sm text-slate-500">
              has successfully completed the course
            </p>
            <h2 className="mt-2 text-2xl font-bold text-indigo-700 sm:text-3xl">
              {course.title}
            </h2>

            {/* Meta */}
            <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-600">
              <div>
                <span className="font-medium">Level:</span> {course.level}
              </div>
              <div>
                <span className="font-medium">Completed:</span> {formattedDate}
              </div>
            </div>

            {/* Verification code */}
            <div className="mt-8 inline-block rounded-lg bg-slate-50 px-4 py-2">
              <span className="text-xs text-slate-400">Verification Code: </span>
              <span className="font-mono text-sm font-bold text-slate-700">
                {cert.code}
              </span>
            </div>

            {/* Signatures */}
            <div className="mt-12 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-24">
              <div className="text-center">
                <div className="border-b border-slate-300 pb-1 font-serif text-lg italic text-slate-700">
                  {instructorName}
                </div>
                <div className="mt-1 text-xs text-slate-500">Instructor</div>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-300 pb-1 font-serif text-lg italic text-slate-700">
                  Simegnew
                </div>
                <div className="mt-1 text-xs text-slate-500">Director, TechPath Academy</div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 text-xs text-slate-400">
              This certificate can be verified at TechPath Academy · Code: {cert.code}
            </div>
          </div>
        </div>

        {/* Verification note */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
          ✅ This is a verified certificate issued by TechPath Academy.
          <br />
          Anyone can verify authenticity using the code{" "}
          <span className="font-mono font-bold text-slate-700">{cert.code}</span>.
        </div>
      </div>
    </div>
  );
}
