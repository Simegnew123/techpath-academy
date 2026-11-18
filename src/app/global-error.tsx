"use client";

/**
 * global-error.tsx — Root-level error boundary
 *
 * This catches errors that error.tsx can't — specifically errors thrown
 * inside the root layout itself (e.g., layout.tsx crashes).
 *
 * IMPORTANT: This component replaces the ENTIRE document, so it must
 * include <html> and <body> tags. It does NOT inherit any layout,
 * styling, or providers from layout.tsx.
 *
 * Sentry (when configured) auto-captures the error that triggered this.
 */
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          color: "#1e293b",
          padding: "1rem",
        }}>
          <div style={{ maxWidth: 400, textAlign: "center" }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.732 0 2.815-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Application Error
            </h1>
            <p style={{ color: "#64748b", marginBottom: 24 }}>
              A critical error occurred. Our team has been notified
              {process.env.NEXT_PUBLIC_SENTRY_DSN ? " via Sentry" : ""} and is working on it.
            </p>

            {error.digest && (
              <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 24, fontFamily: "monospace" }}>
                Error ID: {error.digest}
              </p>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={reset}
                style={{
                  padding: "10px 20px",
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
