"use client";

/**
 * LinkedIn "Add to Profile" button for certificates.
 * Uses LinkedIn's official credential URL format.
 *
 * When clicked, it opens LinkedIn's profile/add page with the certificate
 * details pre-filled. The user can then save it to their LinkedIn profile.
 */

type Props = {
  certificateName: string;    // e.g. "Ethical Hacking Fundamentals"
  issueDate: string;          // ISO date string
  verificationUrl: string;    // public URL to verify the certificate
  certificateId?: string;     // unique certificate code
};

export default function LinkedInButton({
  certificateName,
  issueDate,
  verificationUrl,
  certificateId,
}: Props) {
  const date = new Date(issueDate);
  const issueYear = date.getFullYear();
  const issueMonth = date.getMonth() + 1; // LinkedIn expects 1-12

  // LinkedIn's official "Add to Profile" URL format
  const linkedInUrl = new URL("https://www.linkedin.com/profile/add");
  linkedInUrl.searchParams.set("startTask", "CERTIFICATION_NAME");
  linkedInUrl.searchParams.set("name", certificateName);
  linkedInUrl.searchParams.set("organizationName", "TechPath Academy");
  linkedInUrl.searchParams.set("organizationId", "10931702"); // TechPath Academy LinkedIn org ID (placeholder)
  linkedInUrl.searchParams.set("issueYear", String(issueYear));
  linkedInUrl.searchParams.set("issueMonth", String(issueMonth));
  if (certificateId) linkedInUrl.searchParams.set("certId", certificateId);
  linkedInUrl.searchParams.set("certUrl", verificationUrl);

  return (
    <a
      href={linkedInUrl.toString()}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-[#0A66C2] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004182]"
    >
      {/* LinkedIn icon */}
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
      </svg>
      Add to LinkedIn Profile
    </a>
  );
}
