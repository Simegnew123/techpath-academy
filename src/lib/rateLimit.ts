// Simple in-memory rate limiter — no external dependencies.
// Tracks requests per IP + endpoint. Resets every window.
// Suitable for single-instance deployments (Render free tier).

type RateEntry = { count: number; resetAt: number };

const store = new Map<string, RateEntry>();

// Clean up expired entries every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export interface RateLimitConfig {
  windowMs: number;   // time window in milliseconds
  maxRequests: number; // max requests in that window
}

// Pre-configured limits for different endpoint types
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },    // 10 auth attempts per 15 min
  search: { windowMs: 60 * 1000, maxRequests: 30 },        // 30 searches per minute
  api: { windowMs: 60 * 1000, maxRequests: 60 },           // 60 API calls per minute
  register: { windowMs: 60 * 60 * 1000, maxRequests: 5 },  // 5 registrations per hour
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfter: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // First request or window expired — start fresh
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, retryAfter: 0 };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000), // seconds
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    retryAfter: 0,
  };
}

// Helper to extract IP from request headers (works behind Render's proxy)
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP.trim();
  return "unknown";
}
