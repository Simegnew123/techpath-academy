/**
 * categories.test.ts — Tests for category definitions
 * Ensures all 7 categories exist with correct slugs and icons
 */
import { CATEGORIES, getCategoryById, getCategoryByName, CATEGORY_NAMES, CATEGORY_ICONS } from "@/lib/categories";

describe("Categories", () => {
  describe("CATEGORIES array", () => {
    it("should have 7 categories", () => {
      expect(CATEGORIES).toHaveLength(7);
    });

    it("should include all expected category names", () => {
      const names = CATEGORIES.map(c => c.name);
      expect(names).toContain("IT Support");
      expect(names).toContain("Networking");
      expect(names).toContain("Database Administration");
      expect(names).toContain("Cyber Security");
      expect(names).toContain("Ethical Hacking");
      expect(names).toContain("Artificial Intelligence");
      expect(names).toContain("Other");
    });

    it("should have unique ids", () => {
      const ids = CATEGORIES.map(c => c.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it("should have unique slugs", () => {
      const slugs = CATEGORIES.map(c => c.slug);
      const unique = new Set(slugs);
      expect(unique.size).toBe(slugs.length);
    });

    it("should have all required fields", () => {
      for (const cat of CATEGORIES) {
        expect(cat.id).toBeTruthy();
        expect(cat.name).toBeTruthy();
        expect(cat.slug).toBeTruthy();
        expect(cat.description).toBeTruthy();
        expect(cat.icon).toBeTruthy();
      }
    });
  });

  describe("getCategoryById", () => {
    it("should find a category by id", () => {
      const cat = getCategoryById("cat-it-support");
      expect(cat).toBeDefined();
      expect(cat!.name).toBe("IT Support");
    });

    it("should return undefined for unknown id", () => {
      expect(getCategoryById("nonexistent")).toBeUndefined();
    });
  });

  describe("getCategoryByName", () => {
    it("should find a category by name", () => {
      const cat = getCategoryByName("Networking");
      expect(cat).toBeDefined();
      expect(cat!.id).toBe("cat-networking");
    });

    it("should be case-sensitive", () => {
      expect(getCategoryByName("networking")).toBeUndefined();
    });

    it("should return undefined for unknown name", () => {
      expect(getCategoryByName("Cooking")).toBeUndefined();
    });
  });

  describe("CATEGORY_NAMES", () => {
    it("should be an array of strings", () => {
      expect(Array.isArray(CATEGORY_NAMES)).toBe(true);
      for (const n of CATEGORY_NAMES) {
        expect(typeof n).toBe("string");
      }
    });

    it("should have same length as CATEGORIES", () => {
      expect(CATEGORY_NAMES).toHaveLength(CATEGORIES.length);
    });
  });

  describe("CATEGORY_ICONS", () => {
    it("should map category names to icons", () => {
      expect(CATEGORY_ICONS["IT Support"]).toBe("🖥️");
      expect(CATEGORY_ICONS["Networking"]).toBe("🌐");
      expect(CATEGORY_ICONS["Cyber Security"]).toBe("🔐");
    });
  });
});
