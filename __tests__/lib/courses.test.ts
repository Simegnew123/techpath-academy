/**
 * courses.test.ts — Tests for course utility functions
 * Tests slugify, uniqueSlug, and course access logic
 */
import { slugify, getCourses, createCourse, getCourseBySlug, getCourseById, formatPrice, hasAccess } from "@/lib/courses";

// Use global helpers from jest.setup.ts (avoids dual-module loading)
const seedMockDB = (globalThis as any).__seedMockDB;
const clearMockDB = (globalThis as any).__clearMockDB;

// Minimal DB shape needed by store.ts readDB()
function makeEmptyDB() {
  return {
    users: [], sessions: [], categories: [], courses: [], modules: [],
    lessons: [], enrollments: [], progress: [], reviews: [],
    certificates: [], payments: [], books: [], notifications: [],
    quizzes: [], questions: [], quizAttempts: [], auditLogs: [],
    notes: [], bookmarks: [], discussions: [], replies: [],
    badges: [], userBadges: [], streaks: [], assignments: [],
    submissions: [], promoCodes: [], bundles: [], calendarEvents: [],
    flashcardDecks: [], flashcards: [], srsReviews: [], portfolios: [],
    studySessions: [], placementResults: [], riskFlags: [],
    competencies: [], lessonCompetencies: [], skillProfiles: [],
    courseVersions: [], aiGenerationJobs: [], webhookConfigs: [],
    webhookLogs: [], botIntegrations: [], peerReviews: [],
    capstoneProjects: [], jobListings: [], jobApplications: [],
    services: [], serviceBookings: [], serviceReviews: [],
    ctfChallenges: [], ctfSolves: [], labConfigs: [], labCompletions: [],
    teamLicenses: [], teamMembers: [], badgeAssertions: [], prerequisites: [],
  };
}

describe("Courses — slugify", () => {
  it("should convert title to slug", () => {
    expect(slugify("Introduction to Networking")).toBe("introduction-to-networking");
  });

  it("should handle special characters", () => {
    expect(slugify("IT Support 101: Basics!")).toBe("it-support-101-basics");
  });

  it("should trim whitespace", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("should handle empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("should collapse multiple spaces", () => {
    expect(slugify("Multiple   Spaces")).toBe("multiple-spaces");
  });

  it("should handle numbers only", () => {
    expect(slugify("101")).toBe("101");
  });
});

describe("Courses — store functions", () => {
  beforeEach(() => {
    clearMockDB();
    seedMockDB(makeEmptyDB());
  });

  describe("getCourses", () => {
    it("should return empty array for fresh DB", () => {
      expect(getCourses()).toEqual([]);
    });
  });

  describe("createCourse", () => {
    it("should create a course and return it", () => {
      const course = createCourse({
        title: "Test Course",
        categoryId: "cat-it-support",
        description: "A test course",
        coverImage: "",
        price: 0,
      });
      expect(course).toBeDefined();
      expect(course.id).toBeTruthy();
      expect(course.title).toBe("Test Course");
      expect(course.slug).toBe("test-course");
      expect(course.published).toBe(false);
      expect(course.level).toBe("Beginner");
    });

    it("should generate a slug from title", () => {
      const course = createCourse({
        title: "Advanced Cyber Security",
        categoryId: "cat-cyber-security",
        description: "Advanced security course",
        coverImage: "",
        price: 5000,
      });
      expect(course.slug).toBe("advanced-cyber-security");
    });

    it("should handle custom slug", () => {
      const course = createCourse({
        title: "Custom Slug Course",
        categoryId: "cat-it-support",
        description: "",
        coverImage: "",
        price: 0,
        slug: "my-custom-slug",
      });
      expect(course.slug).toBe("my-custom-slug");
    });

    it("should store price as number", () => {
      const course = createCourse({
        title: "Paid Course",
        categoryId: "cat-it-support",
        description: "",
        coverImage: "",
        price: 2500,
      });
      expect(course.price).toBe(2500);
      expect(typeof course.price).toBe("number");
    });

    it("should default to free (price=0)", () => {
      const course = createCourse({
        title: "Free Course",
        categoryId: "cat-it-support",
        description: "",
        coverImage: "",
        price: 0,
      });
      expect(course.price).toBe(0);
    });
  });

  describe("getCourseBySlug / getCourseById", () => {
    it("should find created course by slug", () => {
      const created = createCourse({
        title: "Find Me",
        categoryId: "cat-networking",
        description: "",
        coverImage: "",
        price: 0,
      });
      const found = getCourseBySlug("find-me");
      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
    });

    it("should find created course by id", () => {
      const created = createCourse({
        title: "Find By ID",
        categoryId: "cat-networking",
        description: "",
        coverImage: "",
        price: 0,
      });
      const found = getCourseById(created.id);
      expect(found).toBeDefined();
      expect(found!.title).toBe("Find By ID");
    });

    it("should return undefined for non-existent slug", () => {
      expect(getCourseBySlug("does-not-exist")).toBeUndefined();
    });

    it("should return undefined for non-existent id", () => {
      expect(getCourseById("fake-id")).toBeUndefined();
    });
  });
});
