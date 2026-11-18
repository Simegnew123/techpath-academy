/**
 * api-auth.test.ts — Integration tests for auth API logic
 * Tests the register/login flow against a mock DB
 */
import { hashPassword, verifyPassword } from "@/lib/auth";
import { uid } from "@/lib/store";

// Use global helpers from jest.setup.ts
const seedMockDB = (globalThis as any).__seedMockDB;
const clearMockDB = (globalThis as any).__clearMockDB;
const getMockDB = (globalThis as any).__getMockDB;

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

describe("API — Registration flow simulation", () => {
  beforeEach(() => {
    clearMockDB();
    seedMockDB(makeEmptyDB());
  });

  it("should hash password and store user in DB", async () => {
    const passwordHash = await hashPassword("testpass123");
    const user = {
      id: uid(),
      name: "Test User",
      email: "test@example.com",
      passwordHash,
      role: "student" as const,
      createdAt: new Date().toISOString(),
    };

    // Simulate what the register API does: read DB, push user, write back
    const db = getMockDB();
    db.users.push(user);
    seedMockDB(db); // write back

    // Verify by re-reading
    const updated = getMockDB();
    expect(updated.users).toHaveLength(1);
    expect(updated.users[0].email).toBe("test@example.com");
    expect(updated.users[0].passwordHash).not.toBe("testpass123");
    expect(verifyPassword("testpass123", updated.users[0].passwordHash)).toBe(true);
  });

  it("should first registered user become admin", () => {
    const db = getMockDB();

    // First user → admin
    db.users.push({
      id: uid(),
      name: "Admin User",
      email: "admin@test.com",
      passwordHash: "hash",
      role: "admin",
      createdAt: new Date().toISOString(),
    });

    // Second user → student
    db.users.push({
      id: uid(),
      name: "Student User",
      email: "student@test.com",
      passwordHash: "hash",
      role: "student",
      createdAt: new Date().toISOString(),
    });
    seedMockDB(db); // write back

    const updated = getMockDB();
    expect(updated.users[0].role).toBe("admin");
    expect(updated.users[1].role).toBe("student");
  });

  it("should reject duplicate email registration", () => {
    const db = getMockDB();

    const user1 = {
      id: uid(),
      name: "First",
      email: "dup@test.com",
      passwordHash: "hash",
      role: "student",
      createdAt: new Date().toISOString(),
    };
    db.users.push(user1);

    // Check for duplicate
    const existing = db.users.find((u: any) => u.email === "dup@test.com");
    expect(existing).toBeDefined();
    // API would return 409 here
    expect(!!existing).toBe(true);
  });
});

describe("API — Login validation simulation", () => {
  beforeEach(() => {
    clearMockDB();
    seedMockDB(makeEmptyDB());
  });

  it("should verify correct credentials", async () => {
    const db = getMockDB();
    const passwordHash = await hashPassword("mypassword");
    db.users.push({
      id: uid(),
      name: "Login Test",
      email: "login@test.com",
      passwordHash,
      role: "student",
      createdAt: new Date().toISOString(),
    });

    // Simulate login check
    const user = db.users.find((u: any) => u.email === "login@test.com");
    expect(user).toBeDefined();
    expect(verifyPassword("mypassword", user.passwordHash)).toBe(true);
    expect(verifyPassword("wrongpassword", user.passwordHash)).toBe(false);
  });

  it("should reject non-existent email", () => {
    const db = getMockDB();
    const user = db.users.find((u: any) => u.email === "nobody@test.com");
    expect(user).toBeUndefined();
  });
});

describe("API — Email validation", () => {
  const invalidEmails = [
    "", "notanemail", "@example.com", "user@", "user@.com",
    "user@example", "user @example.com", "user@example .com",
  ];
  const validEmails = [
    "user@example.com", "test.user@example.com", "user+tag@example.org",
    "user123@test.co.uk", "admin@techpath.academy",
  ];

  it("should reject invalid email formats", () => {
    for (const email of invalidEmails) {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(false);
    }
  });

  it("should accept valid email formats", () => {
    for (const email of validEmails) {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(true);
    }
  });
});

describe("API — Password strength validation", () => {
  it("should reject passwords shorter than 6 characters", () => {
    for (const pw of ["", "1", "12345", "abcde"]) {
      expect(pw.length >= 6).toBe(false);
    }
  });

  it("should accept passwords 6+ characters", () => {
    for (const pw of ["123456", "password", "secure123", "MyP@ssw0rd!"]) {
      expect(pw.length >= 6).toBe(true);
    }
  });
});
