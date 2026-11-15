"use client";

export default function CertificatePrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
    >
      🖨 Print / Save PDF
    </button>
  );
}
