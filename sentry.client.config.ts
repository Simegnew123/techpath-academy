/**
 * sentry.client.config.ts — Browser-side Sentry initialization
 *
 * Captures client-side errors (React crashes, unhandled promise rejections,
 * fetch failures, etc.) and sends them to Sentry.
 *
 * When NEXT_PUBLIC_SENTRY_DSN is not set, Sentry is a no-op (enabled: false).
 * This means dev/preview environments without Sentry configured won't error.
 */
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,

  // Adjust sample rate in production to control performance monitoring cost.
  // 0.1 = 10% of transactions are traced (keeps free tier quota healthy)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Capture 100% of errors (not sampled)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Don't send PII
  sendDefaultPii: false,

  // Environment tag
  environment: process.env.NODE_ENV || "development",

  // Ignore noisy browser extensions / common non-actionable errors
  ignoreErrors: [
    // Browser extensions injecting scripts
    "top.GLOBALS",
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Network errors (user went offline, etc.)
    "Network request failed",
    "Failed to fetch",
    "Load failed",
    // Hydration warnings (non-critical)
    "Hydration failed",
  ],

  // Filter out errors from browser extensions
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /moz-extension:\//i,
  ],
});
