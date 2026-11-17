// inputSanitizer.ts — server-side input sanitization utilities.
// Strips HTML tags, control characters, and trims input.
// Prevents XSS in stored user content (course descriptions, reviews, forum posts, etc.)

/**
 * Strip HTML tags from a string. Removes <script>, <style>, and all other tags.
 * Also strips control characters and trims whitespace.
 */
export function sanitizeText(input: string | undefined | null, maxLength = 5000): string {
  if (!input) return "";
  return String(input)
    .replace(/<[^>]*>/g, "")        // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars (keep \t \n \r)
    .slice(0, maxLength)
    .trim();
}

/**
 * Sanitize text but preserve basic line breaks. Converts \n to <br> after sanitizing.
 * Use for user-generated content that should display with line breaks (reviews, bios, etc.)
 */
export function sanitizeRichText(input: string | undefined | null, maxLength = 5000): string {
  const clean = sanitizeText(input, maxLength);
  // Escape HTML entities first, then convert newlines to <br>
  return clean
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br>");
}

/**
 * Validate an email address format. Returns true if valid.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/**
 * Validate password strength. Returns an error message or null if OK.
 * Requires at least 8 characters, at least one letter and one number.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  return null;
}

/**
 * Sanitize a URL — only allow http/https URLs or relative paths.
 * Prevents javascript: or data: URLs in links.
 */
export function sanitizeURL(url: string | undefined | null): string {
  if (!url) return "";
  const clean = String(url).trim();
  if (clean.startsWith("/") || clean.startsWith("#")) return clean;
  if (/^https?:\/\//i.test(clean)) return clean;
  return ""; // reject anything else
}
