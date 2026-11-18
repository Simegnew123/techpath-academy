/**
 * sentry.server.config.ts — Server-side Sentry initialization
 *
 * Captures server-side errors (API route crashes, server component errors,
 * unhandled rejections in the Node.js process) and sends them to Sentry.
 *
 * When SENTRY_DSN is not set, Sentry is a no-op (enabled: false).
 */
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,

  // 10% of server transactions traced in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Don't send PII (student emails, passwords, etc.)
  sendDefaultPii: false,

  // Environment tag
  environment: process.env.NODE_ENV || "development",

  // Ignore noisy non-actionable errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ENOENT: no such file or directory",
  ],
});
