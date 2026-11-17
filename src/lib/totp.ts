// TOTP (Time-based One-Time Password) implementation
// RFC 6238 — no external dependencies, uses Node.js built-in crypto.
// Compatible with Google Authenticator, Microsoft Authenticator, Authy, etc.

import crypto from "crypto";

// --- Base32 encoding/decoding (RFC 4648) ---
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
  }
  return result;
}

export function base32Decode(str: string): Buffer {
  const clean = str.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

// --- TOTP core ---
function generateHOTP(secret: Buffer, counter: number): string {
  const counterBuf = Buffer.alloc(8);
  // Write counter as big-endian 64-bit integer
  counterBuf.writeBigInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac("sha1", secret).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;

  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1_000_000;
  return otp.toString().padStart(6, "0");
}

/** Generate a TOTP code for the current time (or a specific time). */
export function generateTOTP(secretBase32: string, forTime: Date = new Date()): string {
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(forTime.getTime() / 1000 / 30);
  return generateHOTP(secret, counter);
}

/** Verify a TOTP code — allows ±1 time step (30s window each direction) for clock drift. */
export function verifyTOTP(secretBase32: string, code: string): boolean {
  const cleanCode = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleanCode)) return false;

  const now = Math.floor(Date.now() / 1000 / 30);
  const secret = base32Decode(secretBase32);

  // Check current, previous, and next time steps
  for (const offset of [-1, 0, 1]) {
    const testCode = generateHOTP(secret, now + offset);
    if (testCode === cleanCode) return true;
  }
  return false;
}

/** Generate a new random TOTP secret (base32 encoded, 20 bytes = 160 bits). */
export function generateTOTPSecret(): string {
  const secretBytes = crypto.randomBytes(20);
  return base32Encode(secretBytes);
}

/** Build the otpauth:// URI for QR code generation. */
export function buildOTPAURI(email: string, secret: string, issuer = "TechPath Academy"): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
