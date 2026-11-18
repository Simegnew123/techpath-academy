/**
 * store.test.ts — Tests for store core functions
 * Tests uid, nowISO, notification creation, certificate verification
 */
import {
  uid, nowISO, generateCertHash,
  createNotification, getNotifications, getUnreadCount,
  markNotificationRead, markAllNotificationsRead, deleteNotification,
} from "@/lib/store";

// Use global helpers from jest.setup.ts
const seedMockDB = (globalThis as any).__seedMockDB;
const clearMockDB = (globalThis as any).__clearMockDB;

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

describe("Store — uid & nowISO", () => {
  it("uid should return a string", () => {
    const id = uid();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("uid should return unique values (mock)", () => {
    const id1 = uid();
    const id2 = uid();
    expect(id1).not.toBe(id2);
  });

  it("nowISO should return valid ISO date string", () => {
    const iso = nowISO();
    expect(iso).toBeTruthy();
    // Should be parseable as a date
    const d = new Date(iso);
    expect(d.getTime()).not.toBeNaN();
  });
});

describe("Store — generateCertHash", () => {
  it("should return a 64-char hex string (SHA-256)", () => {
    const hash = generateCertHash("CERT-001", "user-1", "course-1", "2026-01-01T00:00:00.000Z");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("should be deterministic (same inputs → same hash)", () => {
    const h1 = generateCertHash("CERT-001", "u1", "c1", "2026-01-01");
    const h2 = generateCertHash("CERT-001", "u1", "c1", "2026-01-01");
    expect(h1).toBe(h2);
  });

  it("should differ for different inputs", () => {
    const h1 = generateCertHash("CERT-001", "u1", "c1", "2026-01-01");
    const h2 = generateCertHash("CERT-002", "u1", "c1", "2026-01-01");
    expect(h1).not.toBe(h2);
  });
});

describe("Store — Notifications", () => {
  beforeEach(() => {
    clearMockDB();
    seedMockDB(makeEmptyDB());
  });

  it("should create a notification", () => {
    const notif = createNotification({
      userId: "user-1",
      type: "test",
      title: "Test Notification",
      message: "This is a test",
    });
    expect(notif).toBeDefined();
    expect(notif.id).toBeTruthy();
    expect(notif.userId).toBe("user-1");
    expect(notif.title).toBe("Test Notification");
    expect(notif.read).toBe(false);
  });

  it("should create notification with optional link", () => {
    const notif = createNotification({
      userId: "user-1",
      type: "course",
      title: "New Course",
      message: "Check it out",
      link: "/courses/test",
    });
    expect(notif.link).toBe("/courses/test");
  });

  it("should default link to empty string", () => {
    const notif = createNotification({
      userId: "user-1",
      type: "test",
      title: "No Link",
      message: "No link here",
    });
    expect(notif.link).toBe("");
  });

  it("should get notifications for a user", () => {
    createNotification({ userId: "user-1", type: "a", title: "A", message: "msg" });
    createNotification({ userId: "user-1", type: "b", title: "B", message: "msg" });
    createNotification({ userId: "user-2", type: "c", title: "C", message: "msg" });

    const notifs = getNotifications("user-1");
    expect(notifs).toHaveLength(2);
  });

  it("should respect limit parameter", () => {
    for (let i = 0; i < 5; i++) {
      createNotification({ userId: "user-1", type: "t", title: `N${i}`, message: "m" });
    }
    const limited = getNotifications("user-1", 3);
    expect(limited).toHaveLength(3);
  });

  it("should count unread notifications", () => {
    createNotification({ userId: "user-1", type: "a", title: "A", message: "m" });
    createNotification({ userId: "user-1", type: "b", title: "B", message: "m" });
    expect(getUnreadCount("user-1")).toBe(2);
  });

  it("should mark a single notification as read", () => {
    const notif = createNotification({ userId: "user-1", type: "t", title: "T", message: "m" });
    markNotificationRead(notif.id);
    expect(getUnreadCount("user-1")).toBe(0);
  });

  it("should mark all notifications as read", () => {
    createNotification({ userId: "user-1", type: "a", title: "A", message: "m" });
    createNotification({ userId: "user-1", type: "b", title: "B", message: "m" });
    createNotification({ userId: "user-1", type: "c", title: "C", message: "m" });
    markAllNotificationsRead("user-1");
    expect(getUnreadCount("user-1")).toBe(0);
  });

  it("should only mark current user's notifications", () => {
    createNotification({ userId: "user-1", type: "a", title: "A", message: "m" });
    createNotification({ userId: "user-2", type: "b", title: "B", message: "m" });
    markAllNotificationsRead("user-1");
    expect(getUnreadCount("user-1")).toBe(0);
    expect(getUnreadCount("user-2")).toBe(1);
  });

  it("should delete a notification", () => {
    const notif = createNotification({ userId: "user-1", type: "t", title: "T", message: "m" });
    deleteNotification(notif.id);
    const remaining = getNotifications("user-1");
    expect(remaining).toHaveLength(0);
  });
});
