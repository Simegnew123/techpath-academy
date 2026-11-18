/**
 * auth.test.ts — Tests for authentication helpers
 * Tests password hashing/verification (pure functions, no cookies/DB needed)
 */
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("Auth — password hashing", () => {
  describe("hashPassword", () => {
    it("should return a bcrypt hash", async () => {
      const hash = await hashPassword("mypassword");
      expect(hash).toBeTruthy();
      expect(hash).not.toBe("mypassword");
      // bcryptjs uses $2a$ or $2b$ prefix
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
    });

    it("should produce different hashes for the same password (salt)", async () => {
      const hash1 = await hashPassword("samepass");
      const hash2 = await hashPassword("samepass");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should return true for correct password", async () => {
      const hash = await hashPassword("correct123");
      expect(verifyPassword("correct123", hash)).toBe(true);
    });

    it("should return false for wrong password", async () => {
      const hash = await hashPassword("correct123");
      expect(verifyPassword("wrongpassword", hash)).toBe(false);
    });

    it("should return false for empty password", async () => {
      const hash = await hashPassword("correct123");
      expect(verifyPassword("", hash)).toBe(false);
    });

    it("should be case-sensitive", async () => {
      const hash = await hashPassword("MyPassword");
      expect(verifyPassword("mypassword", hash)).toBe(false);
    });
  });
});
