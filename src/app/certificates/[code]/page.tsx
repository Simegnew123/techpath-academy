import Link from "next/link";
import { notFound } from "next/navigation";
import { readDB, getCertificateByCode, verifyCertificate } from "@/lib/store";
import { getCourseById } from "@/lib/courses";
import QRCode from "qrcode";
import PrintButton from "./PrintButton";
import LinkedInButton from "@/components/LinkedInButton";

export const revalidate = 0;

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cert = getCertificateByCode(code);
  if (!cert) notFound();

  const db = readDB();
  const user = db.users.find((u) => u.id === cert.userId);
  const course = getCourseById(cert.courseId);
  if (!course || !user) notFound();

  const issueDate = new Date(cert.issuedAt);
  const formattedDate = issueDate.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const expiryDate = cert.expiresAt ? new Date(cert.expiresAt) : null;
  const formattedExpiry = expiryDate
    ? expiryDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const isExpired = expiryDate && expiryDate < new Date();

  const instructorName = course.instructorId
    ? db.users.find((u) => u.id === course.instructorId)?.name || "Instructor"
    : "Instructor";

  // Generate QR code linking to the verification URL
  const verifyUrl = `${process.env.NEXT_PUBLIC_URL || "https://techpath-academy.onrender.com"}/certificates/${cert.code}?verify=true`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 160,
    margin: 1,
    color: { dark: "#1e293b", light: "#ffffff" },
  });

  // Verify hash
  const hashValid = cert.hash ? verifyCertificate(cert.code, cert.hash) !== null : false;
  const shortHash = cert.hash ? cert.hash.substring(0, 16) + "..." : "";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-10">
      <div className="mx-auto max-w-4xl px-4">
        {/* Action bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <LinkedInButton
              certificateName={course.title}
              issueDate={cert.issuedAt}
              verificationUrl={verifyUrl}
              certificateId={cert.code}
            />
            <PrintButton />
          </div>
        </div>

        {/* Verification banner */}
        {hashValid && (
          <div className={`mb-4 rounded-xl border p-3 text-center text-sm ${isExpired ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"}`}>
            {isExpired ? "⚠️ This certificate has expired" : "✅ Cryptographically Verified — Authentic Certificate"}
            <span className="ml-2 font-mono text-xs">Hash: {shortHash}</span>
          </div>
        )}

        {/* Certificate */}
        <div id="certificate" className="relative overflow-hidden rounded-3xl border-4 border-amber-300 bg-white p-10 shadow-2xl sm:p-14">
          <div className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-amber-200"></div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-[120px] opacity-[0.04]">🏆</span>
          </div>

          <div className="relative text-center">
            {/* Brand */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">🎓</span>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">TechPath Academy</span>
            </div>
            <div className="mt-1 text-sm font-medium uppercase tracking-widest text-amber-600">
              Certificate of Completion
            </div>
            <div className="mx-auto mt-6 h-px w-48 bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>

            {/* Recipient */}
            <p className="mt-8 text-sm text-slate-500">This certifies that</p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">{user.name}</h1>

            {/* Course */}
            <p className="mt-6 text-sm text-slate-500">has successfully completed the course</p>
            <h2 className="mt-2 text-2xl font-bold text-indigo-700 sm:text-3xl">{course.title}</h2>

            {/* Skills mastered */}
            {cert.skills && cert.skills.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-slate-500 mb-2">Skills Mastered:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {cert.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-600">
              <div><span className="font-medium">Level:</span> {course.level}</div>
              <div><span className="font-medium">Completed:</span> {formattedDate}</div>
              {formattedExpiry && (
                <div className={isExpired ? "text-red-600 font-medium" : ""}>
                  <span className="font-medium">Valid Until:</span> {formattedExpiry}
                </div>
              )}
            </div>

            {/* QR Code + Verification */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="rounded-lg border-2 border-slate-200 p-2 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Verification QR Code" width={120} height={120} />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-slate-500">Scan to verify</p>
                <p className="font-mono text-xs font-bold text-slate-700">{cert.code}</p>
                {cert.hash && (
                  <p className="font-mono text-[10px] text-slate-400 mt-1">SHA-256: {shortHash}</p>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-10 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-24">
              <div className="text-center">
                <div className="border-b border-slate-300 pb-1 font-serif text-lg italic text-slate-700">{instructorName}</div>
                <div className="mt-1 text-xs text-slate-500">Instructor</div>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-300 pb-1 font-serif text-lg italic text-slate-700">Simegnew</div>
                <div className="mt-1 text-xs text-slate-500">Director, TechPath Academy</div>
              </div>
            </div>

            <div className="mt-8 text-xs text-slate-400">
              This certificate is cryptographically verified · TechPath Academy
            </div>
          </div>
        </div>

        {/* Verification info */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
          🔐 <strong>Verifiable Credential</strong> — This certificate contains a SHA-256 cryptographic hash.
          <br />
          Employers can scan the QR code or verify at{" "}
          <span className="font-mono font-bold text-slate-700">/certificates/{cert.code}</span>
          {" "}to confirm authenticity.
        </div>
      </div>
    </div>
  );
}
