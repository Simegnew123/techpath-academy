/**
 * sentry.edge.config.ts — Edge runtime Sentry initialization
 *
 * Captures errors in Edge runtime (middleware, edge API routes).
 * Same DSN as server-side (SENTRY_DSN).
 *
 * When SENTRY_DSN is not set, Sentry is a no-op (enabled: false).
 */
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  sendDefaultPii: false,
  environment: process.env.NODE_ENV || "development",
});
