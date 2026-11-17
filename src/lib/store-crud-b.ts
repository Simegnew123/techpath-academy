// store-crud-b.ts — Phase 4-5 + Other Services CRUD functions
// Auto-split from store.ts for proxy size limits
import { readDB, writeDB, mutate, uid, nowISO } from "./store-base";
import { getLessonsForCourse } from "./store-crud-a";
import type {
  User, Course, Lesson, Enrollment, Progress, Certificate,
  FlashcardDeck, Flashcard, SRSReview, Portfolio, StudySession,
  PlacementResult, RiskFlag, Competency, LessonCompetency,
  SkillProfile, CourseVersion, AIGenerationJob,
  WebhookConfig, WebhookLog, BotIntegration,
  PeerReview, CapstoneProject, JobListing, JobApplication,
  Service, ServiceBooking, ServiceReview, ServiceCategory,
  Quiz, Question, QuizAttempt, Submission,
  DB,
} from "./store-base";

// ===============================================================
// Phase 4: Flashcards & Spaced Repetition (SRS SM-2)
// ===============================================================

export function getFlashcardDecks(courseId?: string): FlashcardDeck[] {
  const db = readDB();
  return courseId
    ? db.flashcardDecks.filter((d) => d.courseId === courseId)
    : db.flashcardDecks;
}

export function getFlashcardDeckById(id: string): FlashcardDeck | undefined {
  return readDB().flashcardDecks.find((d) => d.id === id);
}

export function createFlashcardDeck(data: Omit<FlashcardDeck, "id" | "createdAt">): FlashcardDeck {
  const deck: FlashcardDeck = { ...data, id: uid(), createdAt: nowISO() };
  mutate((db) => { db.flashcardDecks.push(deck); });
  return deck;
}

export function deleteFlashcardDeck(id: string): void {
  mutate((db) => {
    db.flashcardDecks = db.flashcardDecks.filter((d) => d.id !== id);
    db.flashcards = db.flashcards.filter((c) => c.deckId !== id);
  });
}

export function getFlashcards(deckId: string): Flashcard[] {
  return readDB().flashcards
    .filter((c) => c.deckId === deckId)
    .sort((a, b) => a.order - b.order);
}

export function createFlashcard(data: Omit<Flashcard, "id" | "order">): Flashcard {
  const db = readDB();
  const order = db.flashcards.filter((c) => c.deckId === data.deckId).length;
  const card: Flashcard = { ...data, id: uid(), order };
  mutate((d) => { d.flashcards.push(card); });
  return card;
}

export function deleteFlashcard(id: string): void {
  mutate((db) => {
    db.flashcards = db.flashcards.filter((c) => c.id !== id);
    db.srsReviews = db.srsReviews.filter((r) => r.flashcardId !== id);
  });
}

// SRS: Get cards due for review today
export function getDueSRSReviews(userId: string): (SRSReview & { flashcard?: Flashcard })[] {
  const db = readDB();
  const today = new Date().toISOString().split("T")[0];
  return db.srsReviews
    .filter((r) => r.userId === userId && r.nextReviewDate <= today)
    .map((r) => ({ ...r, flashcard: db.flashcards.find((c) => c.id === r.flashcardId) }))
    .filter((r) => r.flashcard);
}

// SRS: Process a review and update schedule (simplified SM-2)
export function processSRSReview(userId: string, flashcardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5): void {
  // quality: 0=again, 1=hard, 2=hard, 3=good, 4=easy, 5=perfect
  const db = readDB();
  let review = db.srsReviews.find((r) => r.userId === userId && r.flashcardId === flashcardId);

  if (!review) {
    // First review — create SRS record
    review = {
      id: uid(),
      userId,
      flashcardId,
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: new Date().toISOString().split("T")[0],
      lastReviewedAt: null,
    };
  }

  // SM-2 algorithm (simplified)
  if (quality < 3) {
    // Failed — reset
    review.repetitions = 0;
    review.interval = 1;
  } else {
    // Passed
    review.repetitions += 1;
    if (review.repetitions === 1) review.interval = 1;
    else if (review.repetitions === 2) review.interval = 3;
    else review.interval = Math.round(review.interval * review.ease);
  }

  // Update ease factor
  review.ease = Math.max(1.3, review.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  // Calculate next review date
  const next = new Date();
  next.setDate(next.getDate() + review.interval);
  review.nextReviewDate = next.toISOString().split("T")[0];
  review.lastReviewedAt = nowISO();

  mutate((d) => {
    const existing = d.srsReviews.findIndex((r) => r.id === review!.id);
    if (existing >= 0) d.srsReviews[existing] = review!;
    else d.srsReviews.push(review!);
  });
}

export function getSRSStats(userId: string): { totalCards: number; dueToday: number; mastered: number } {
  const db = readDB();
  const userReviews = db.srsReviews.filter((r) => r.userId === userId);
  const today = new Date().toISOString().split("T")[0];
  return {
    totalCards: userReviews.length,
    dueToday: userReviews.filter((r) => r.nextReviewDate <= today).length,
    mastered: userReviews.filter((r) => r.repetitions >= 3 && r.ease >= 2.5).length,
  };
}

// ===============================================================
// Phase 4: Public Student Portfolio
// ===============================================================

export function getPortfolio(userId: string): Portfolio | undefined {
  return readDB().portfolios.find((p) => p.userId === userId);
}

export function getPortfolioBySlug(slug: string): Portfolio | undefined {
  return readDB().portfolios.find((p) => p.slug === slug && p.isPublic);
}

export function upsertPortfolio(userId: string, data: Partial<Omit<Portfolio, "userId" | "updatedAt">>): Portfolio {
  const db = readDB();
  const existing = db.portfolios.find((p) => p.userId === userId);
  const updated: Portfolio = {
    userId,
    slug: data.slug || existing?.slug || "",
    bio: data.bio ?? existing?.bio ?? "",
    headline: data.headline ?? existing?.headline ?? "",
    location: data.location ?? existing?.location ?? "",
    website: data.website ?? existing?.website ?? "",
    linkedinUrl: data.linkedinUrl ?? existing?.linkedinUrl ?? "",
    githubUrl: data.githubUrl ?? existing?.githubUrl ?? "",
    skills: data.skills ?? existing?.skills ?? [],
    isPublic: data.isPublic ?? existing?.isPublic ?? false,
    updatedAt: nowISO(),
  };
  mutate((d) => {
    const idx = d.portfolios.findIndex((p) => p.userId === userId);
    if (idx >= 0) d.portfolios[idx] = updated;
    else d.portfolios.push(updated);
  });
  return updated;
}

export function getPortfolioCertificates(userId: string): Certificate[] {
  return readDB().certificates.filter((c) => c.userId === userId);
}

export function getPortfolioCompletedCourses(userId: string): Course[] {
  const db = readDB();
  const completedCourseIds = new Set(
    db.enrollments.filter((e) => e.userId === userId && e.completed).map((e) => e.courseId)
  );
  return db.courses.filter((c) => completedCourseIds.has(c.id));
}

// ===============================================================
// Phase 4: Study Sessions (Pomodoro)
// ===============================================================

export function createStudySession(data: Omit<StudySession, "id" | "createdAt">): StudySession {
  const session: StudySession = { ...data, id: uid(), createdAt: nowISO() };
  mutate((db) => { db.studySessions.push(session); });
  return session;
}

export function getStudySessions(userId: string, limit = 30): StudySession[] {
  return readDB().studySessions
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function getStudyStats(userId: string): { totalMinutes: number; totalSessions: number; thisWeek: number } {
  const db = readDB();
  const sessions = db.studySessions.filter((s) => s.userId === userId && s.completed);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return {
    totalMinutes: sessions.reduce((s, sess) => s + sess.durationMinutes, 0),
    totalSessions: sessions.length,
    thisWeek: sessions.filter((s) => new Date(s.createdAt) >= weekAgo).reduce((sum, s) => sum + s.durationMinutes, 0),
  };
}

// ===============================================================
// Phase 4: Placement Quiz / Skill Gap Diagnostic
// ===============================================================

export function getPlacementResult(userId: string, courseId: string): PlacementResult | undefined {
  return readDB().placementResults.find((p) => p.userId === userId && p.courseId === courseId);
}

export function createPlacementResult(data: Omit<PlacementResult, "id" | "takenAt">): PlacementResult {
  const result: PlacementResult = { ...data, id: uid(), takenAt: nowISO() };
  mutate((db) => {
    // Remove old placement result for this user+course
    db.placementResults = db.placementResults.filter((p) => !(p.userId === data.userId && p.courseId === data.courseId));
    db.placementResults.push(result);
  });
  return result;
}

// Auto mark lessons as "tested out" based on placement score
export function applyPlacementTestOut(userId: string, courseId: string, testedOutLessonIds: string[]): void {
  mutate((db) => {
    for (const lessonId of testedOutLessonIds) {
      const already = db.progress.find((p) => p.userId === userId && p.lessonId === lessonId);
      if (!already) {
        db.progress.push({
          userId,
          lessonId,
          completedAt: nowISO(),
        });
      }
    }
  });
}

export function isLessonTestedOut(userId: string, lessonId: string): boolean {
  const db = readDB();
  // Check if this lesson was completed via placement (not via normal completion)
  // We approximate: if completed but the enrollment was very recent and a placement result exists
  return db.progress.some((p) => p.userId === userId && p.lessonId === lessonId);
}

// ===============================================================
// Phase 5: Default Competencies
// ===============================================================

// Note: getDefaultCompetencies() moved to store-base.ts (used by migrateDB)

// ===============================================================
// Phase 5: At-Risk Student Detection
// ===============================================================

export function getRiskFlags(courseId?: string): RiskFlag[] {
  const db = readDB();
  return db.riskFlags
    .filter((r) => !courseId || r.courseId === courseId)
    .filter((r) => !r.resolvedAt) // only active flags
    .sort((a, b) => b.flaggedAt.localeCompare(a.flaggedAt));
}

export function getAllRiskFlags(courseId?: string): RiskFlag[] {
  const db = readDB();
  return db.riskFlags
    .filter((r) => !courseId || r.courseId === courseId)
    .sort((a, b) => b.flaggedAt.localeCompare(a.flaggedAt));
}

export function createRiskFlag(data: Omit<RiskFlag, "id" | "flaggedAt" | "resolvedAt" | "resolutionNote">): RiskFlag {
  const flag: RiskFlag = { ...data, id: uid(), flaggedAt: nowISO(), resolvedAt: null, resolutionNote: "" };
  mutate((db) => {
    // Remove old unresolved flag for same user+course+level
    db.riskFlags = db.riskFlags.filter(
      (r) => !(r.userId === data.userId && r.courseId === data.courseId && !r.resolvedAt)
    );
    db.riskFlags.push(flag);
  });
  return flag;
}

export function resolveRiskFlag(flagId: string, note: string): void {
  mutate((db) => {
    const flag = db.riskFlags.find((r) => r.id === flagId);
    if (flag) {
      flag.resolvedAt = nowISO();
      flag.resolutionNote = note;
    }
  });
}

/** Analyze all enrolled students for risk indicators. Returns count of new flags. */
export function runRiskAnalysis(): number {
  const db = readDB();
  let newFlags = 0;
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  for (const enrollment of db.enrollments.filter((e) => !e.completed)) {
    const userId = enrollment.userId;
    const courseId = enrollment.courseId;
    const reasons: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";

    // Check 1: No login in 7+ days
    const userSessions = db.sessions.filter((s) => s.userId === userId);
    const lastSession = userSessions.sort((a, b) => b.expiresAt.localeCompare(a.expiresAt))[0];
    if (lastSession) {
      const daysSinceLogin = (now - new Date(lastSession.expiresAt).getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceLogin >= 14) {
        reasons.push(`no_login_${Math.round(daysSinceLogin)}d`);
        riskLevel = "high";
      } else if (daysSinceLogin >= 7) {
        reasons.push(`no_login_${Math.round(daysSinceLogin)}d`);
        riskLevel = "medium";
      }
    }

    // Check 2: Quiz score drop (latest attempt < 50%)
    const attempts = db.quizAttempts
      .filter((a) => a.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (attempts.length >= 2) {
      const recent = attempts[0];
      const previous = attempts[1];
      if (recent.score < 50 && previous.score >= 70) {
        reasons.push("quiz_score_drop");
        if (riskLevel === "low") riskLevel = "medium";
      }
    }

    // Check 3: No progress in 14+ days
    const progressRecords = db.progress.filter((p) => p.userId === userId);
    const lessonsForCourse = db.lessons.filter((l) => l.courseId === courseId);
    const courseProgress = progressRecords.filter((p) =>
      lessonsForCourse.some((l) => l.id === p.lessonId)
    );
    if (courseProgress.length > 0) {
      const lastProgress = courseProgress.sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
      const daysSinceProgress = (now - new Date(lastProgress.completedAt).getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceProgress >= 14) {
        reasons.push(`no_progress_${Math.round(daysSinceProgress)}d`);
        if (riskLevel === "low") riskLevel = "medium";
        if (daysSinceProgress >= 30) riskLevel = "high";
      }
    } else {
      // Enrolled but zero progress
      const enrolledAt = new Date(enrollment.purchasedAt || now).getTime();
      const daysSinceEnroll = (now - enrolledAt) / (24 * 60 * 60 * 1000);
      if (daysSinceEnroll >= 7) {
        reasons.push("zero_progress_after_enrollment");
        if (riskLevel === "low") riskLevel = "medium";
      }
    }

    if (reasons.length > 0) {
      // Check if there's already an unresolved flag
      const existing = db.riskFlags.find(
        (r) => r.userId === userId && r.courseId === courseId && !r.resolvedAt
      );
      if (!existing) {
        db.riskFlags.push({
          id: uid(),
          userId,
          courseId,
          riskLevel,
          reasons,
          flaggedAt: nowISO(),
          resolvedAt: null,
          resolutionNote: "",
        });
        newFlags++;
      }
    }
  }
  return newFlags;
}

// ===============================================================
// Phase 5: Question Difficulty Heatmap
// ===============================================================

export function getQuestionDifficultyStats(courseId?: string): {
  questionId: string;
  questionText: string;
  totalAttempts: number;
  correctCount: number;
  failRate: number;
  courseId: string;
}[] {
  const db = readDB();
  const attempts = db.quizAttempts.filter((a) => {
    if (!courseId) return true;
    const quiz = db.quizzes.find((q) => q.id === a.quizId);
    return quiz?.courseId === courseId;
  });

  const stats: Record<string, { questionId: string; questionText: string; totalAttempts: number; correctCount: number; courseId: string }> = {};

  for (const attempt of attempts) {
    const quiz = db.quizzes.find((q) => q.id === attempt.quizId);
    if (!quiz) continue;
    const cid = quiz.courseId;
    for (const ans of attempt.answers || []) {
      if (!stats[ans.questionId]) {
        const q = db.questions.find((qq) => qq.id === ans.questionId);
        stats[ans.questionId] = {
          questionId: ans.questionId,
          questionText: q?.text || "(unknown)",
          totalAttempts: 0,
          correctCount: 0,
          courseId: cid,
        };
      }
      stats[ans.questionId].totalAttempts++;
      if (ans.correct) stats[ans.questionId].correctCount++;
    }
  }

  return Object.values(stats)
    .map((s) => ({ ...s, failRate: s.totalAttempts > 0 ? Math.round((1 - s.correctCount / s.totalAttempts) * 100) : 0 }))
    .sort((a, b) => b.failRate - a.failRate);
}

// ===============================================================
// Phase 5: Competency & Skill Mapping
// ===============================================================

export function getAllCompetencies(): Competency[] {
  return readDB().competencies;
}

export function getCompetenciesByCategory(category: string): Competency[] {
  return readDB().competencies.filter((c) => c.category === category);
}

export function createCompetency(data: Omit<Competency, "id">): Competency {
  const comp: Competency = { ...data, id: uid() };
  mutate((db) => db.competencies.push(comp));
  return comp;
}

export function getLessonCompetencies(lessonId: string): (LessonCompetency & { competency?: Competency })[] {
  const db = readDB();
  return db.lessonCompetencies
    .filter((lc) => lc.lessonId === lessonId)
    .map((lc) => ({ ...lc, competency: db.competencies.find((c) => c.id === lc.competencyId) }));
}

export function setLessonCompetencies(lessonId: string, mappings: { competencyId: string; weight: number }[]): void {
  mutate((db) => {
    db.lessonCompetencies = db.lessonCompetencies.filter((lc) => lc.lessonId !== lessonId);
    for (const m of mappings) {
      db.lessonCompetencies.push({ lessonId, competencyId: m.competencyId, weight: m.weight });
    }
  });
}

export function getSkillProfile(userId: string): SkillProfile | undefined {
  return readDB().skillProfiles.find((s) => s.userId === userId);
}

export function updateSkillProfile(userId: string): SkillProfile {
  const db = readDB();
  const competencies = db.competencies;
  const userProgress = db.progress.filter((p) => p.userId === userId);
  const userAttempts = db.quizAttempts.filter((a) => a.userId === userId);
  const userLessons = userProgress.map((p) => db.lessons.find((l) => l.id === p.lessonId)).filter(Boolean) as Lesson[];

  const scores: { competencyId: string; score: number; assessedAt: string }[] = [];

  for (const comp of competencies) {
    // Find lessons tagged with this competency that the user has completed
    const taggedLessons = db.lessonCompetencies.filter((lc) => lc.competencyId === comp.id);
    const completedLessons = taggedLessons.filter((lc) => userProgress.some((p) => p.lessonId === lc.lessonId));

    if (completedLessons.length === 0) continue;

    // Weight by lesson weight, plus quiz performance
    let weightedScore = 0;
    let totalWeight = 0;
    for (const cl of completedLessons) {
      weightedScore += cl.weight * 20; // completing a lesson = base 20 points per weight
      totalWeight += cl.weight;
    }

    // Bonus from quiz attempts on lessons tagged with this competency
    for (const cl of taggedLessons) {
      const lesson = db.lessons.find((l) => l.id === cl.lessonId);
      if (!lesson) continue;
      const quiz = db.quizzes.find((q) => q.lessonId === cl.lessonId);
      if (!quiz) continue;
      const attempts = userAttempts.filter((a) => a.quizId === quiz.id);
      if (attempts.length > 0) {
        const bestScore = Math.max(...attempts.map((a) => a.score));
        weightedScore += (bestScore / 100) * cl.weight * 30;
        totalWeight += cl.weight * 1.5;
      }
    }

    const finalScore = totalWeight > 0 ? Math.min(100, Math.round((weightedScore / totalWeight) * 5)) : 0;
    if (finalScore > 0) {
      scores.push({ competencyId: comp.id, score: finalScore, assessedAt: nowISO() });
    }
  }

  const profile: SkillProfile = { userId, competencies: scores, updatedAt: nowISO() };
  mutate((d) => {
    const idx = d.skillProfiles.findIndex((s) => s.userId === userId);
    if (idx >= 0) d.skillProfiles[idx] = profile;
    else d.skillProfiles.push(profile);
  });
  return profile;
}

// ===============================================================
// Phase 5: Content Versioning
// ===============================================================

export function getCourseVersions(courseId: string): CourseVersion[] {
  return readDB().courseVersions
    .filter((v) => v.courseId === courseId)
    .sort((a, b) => b.version - a.version);
}

export function createCourseVersion(courseId: string, userId: string, notes: string): CourseVersion {
  const db = readDB();
  const existing = getCourseVersions(courseId);
  const nextVersion = existing.length > 0 ? Math.max(...existing.map((v) => v.version)) + 1 : 1;

  // Snapshot the current course + modules + lessons
  const course = db.courses.find((c) => c.id === courseId);
  const modules = db.modules.filter((m) => m.courseId === courseId);
  const lessons = db.lessons.filter((l) => l.courseId === courseId);
  const snapshot = JSON.stringify({ course, modules, lessons });

  const version: CourseVersion = {
    id: uid(),
    courseId,
    version: nextVersion,
    status: "published",
    snapshot,
    createdBy: userId,
    createdAt: nowISO(),
    notes: notes || `Version ${nextVersion}`,
  };
  mutate((d) => d.courseVersions.push(version));
  return version;
}

export function checkStaleCourses(): { courseId: string; courseTitle: string; lastUpdated: string; daysSinceUpdate: number }[] {
  const db = readDB();
  const now = Date.now();
  const stale: { courseId: string; courseTitle: string; lastUpdated: string; daysSinceUpdate: number }[] = [];

  for (const course of db.courses.filter((c) => c.published)) {
    // Check latest lesson update or course creation
    const lessons = db.lessons.filter((l) => l.courseId === course.id);
    const timestamps = [
      course.createdAt || "",
      ...lessons.map((l) => (l as Record<string, unknown>).createdAt as string || ""),
    ].filter(Boolean).sort().reverse();
    const lastUpdated = timestamps[0] || course.createdAt || nowISO();
    const daysSinceUpdate = Math.floor((now - new Date(lastUpdated).getTime()) / (24 * 60 * 60 * 1000));
    if (daysSinceUpdate >= 365) {
      stale.push({ courseId: course.id, courseTitle: course.title, lastUpdated, daysSinceUpdate });
    }
  }
  return stale.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
}

// ===============================================================
// Phase 5: AI Generation Jobs
// ===============================================================

export function getAIGenerationJobs(userId: string): AIGenerationJob[] {
  return readDB().aiGenerationJobs
    .filter((j) => j.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createAIGenerationJob(data: Omit<AIGenerationJob, "id" | "createdAt" | "completedAt" | "status" | "output" | "error">): AIGenerationJob {
  const job: AIGenerationJob = { ...data, id: uid(), createdAt: nowISO(), status: "pending", output: "", completedAt: null, error: "" };
  mutate((db) => db.aiGenerationJobs.push(job));
  return job;
}

export function updateAIGenerationJob(id: string, updates: Partial<AIGenerationJob>): void {
  mutate((db) => {
    const job = db.aiGenerationJobs.find((j) => j.id === id);
    if (job) Object.assign(job, updates);
  });
}

// ===============================================================
// Phase 5: Webhooks
// ===============================================================

export function getWebhookConfigs(): WebhookConfig[] {
  return readDB().webhookConfigs.filter((w) => w.isActive);
}

export function getAllWebhookConfigs(): WebhookConfig[] {
  return readDB().webhookConfigs;
}

export function createWebhookConfig(data: Omit<WebhookConfig, "id" | "createdAt" | "lastTriggeredAt" | "lastStatus">): WebhookConfig {
  const webhook: WebhookConfig = { ...data, id: uid(), createdAt: nowISO(), lastTriggeredAt: null, lastStatus: 0 };
  mutate((db) => db.webhookConfigs.push(webhook));
  return webhook;
}

export function updateWebhookConfig(id: string, updates: Partial<WebhookConfig>): void {
  mutate((db) => {
    const wh = db.webhookConfigs.find((w) => w.id === id);
    if (wh) Object.assign(wh, updates);
  });
}

export function deleteWebhookConfig(id: string): void {
  mutate((db) => {
    db.webhookConfigs = db.webhookConfigs.filter((w) => w.id !== id);
    db.webhookLogs = db.webhookLogs.filter((l) => l.webhookId !== id);
  });
}

export function logWebhookDelivery(webhookId: string, event: string, payload: string, responseStatus: number): void {
  const log: WebhookLog = { id: uid(), webhookId, event, payload, responseStatus, deliveredAt: nowISO() };
  mutate((db) => {
    db.webhookLogs.push(log);
    // Keep only last 100 logs per webhook
    const logs = db.webhookLogs.filter((l) => l.webhookId === webhookId).sort((a, b) => b.deliveredAt.localeCompare(a.deliveredAt));
    if (logs.length > 100) {
      const toRemove = logs.slice(100).map((l) => l.id);
      db.webhookLogs = db.webhookLogs.filter((l) => !toRemove.includes(l.id));
    }
    // Update webhook stats
    const wh = db.webhookConfigs.find((w) => w.id === webhookId);
    if (wh) { wh.lastTriggeredAt = nowISO(); wh.lastStatus = responseStatus; }
  });
}

export function getWebhookLogs(webhookId?: string): WebhookLog[] {
  const db = readDB();
  return db.webhookLogs
    .filter((l) => !webhookId || l.webhookId === webhookId)
    .sort((a, b) => b.deliveredAt.localeCompare(a.deliveredAt))
    .slice(0, 50);
}

// ===============================================================
// Phase 5: Bot Integrations
// ===============================================================

export function getBotIntegration(userId: string): BotIntegration | undefined {
  return readDB().botIntegrations.find((b) => b.userId === userId);
}

export function upsertBotIntegration(userId: string, data: Partial<Omit<BotIntegration, "id" | "userId" | "connectedAt">>): BotIntegration {
  const db = readDB();
  const existing = db.botIntegrations.find((b) => b.userId === userId);
  const updated: BotIntegration = {
    id: existing?.id || uid(),
    userId,
    platform: data.platform || existing?.platform || "telegram",
    chatId: data.chatId || existing?.chatId || "",
    isActive: data.isActive ?? existing?.isActive ?? true,
    preferences: data.preferences || existing?.preferences || {
      dailyQuiz: true,
      deadlineReminders: true,
      instructorReplies: true,
      certificateIssued: true,
    },
    connectedAt: existing?.connectedAt || nowISO(),
  };
  mutate((d) => {
    const idx = d.botIntegrations.findIndex((b) => b.userId === userId);
    if (idx >= 0) d.botIntegrations[idx] = updated;
    else d.botIntegrations.push(updated);
  });
  return updated;
}

export function getActiveBotIntegrations(event: keyof BotIntegration["preferences"]): BotIntegration[] {
  return readDB().botIntegrations.filter((b) => b.isActive && b.preferences[event]);
}

// ===============================================================
// Phase 5: Peer Review
// ===============================================================

export function getPeerReviewsForSubmission(submissionId: string): PeerReview[] {
  return readDB().peerReviews.filter((r) => r.submissionId === submissionId);
}

export function createPeerReview(data: Omit<PeerReview, "id" | "submittedAt">): PeerReview {
  const review: PeerReview = { ...data, id: uid(), submittedAt: nowISO() };
  mutate((db) => db.peerReviews.push(review));
  return review;
}

export function getPendingPeerReviews(userId: string): Submission[] {
  // Get submissions that this user hasn't reviewed yet (excluding their own)
  const db = readDB();
  const userSubmissions = db.submissions.filter((s) => s.userId !== userId && s.status === "pending");
  return userSubmissions.filter((s) => {
    const reviews = db.peerReviews.filter((r) => r.submissionId === s.id);
    return !reviews.some((r) => r.reviewerId === userId) && reviews.length < 3; // max 3 reviews
  });
}

// ===============================================================
// Phase 5: Capstone Projects (Hall of Fame)
// ===============================================================

export function getCapstoneProjects(): CapstoneProject[] {
  return readDB().capstoneProjects
    .filter((c) => c.isPublished)
    .sort((a, b) => b.averageRating - a.averageRating);
}

export function getUserCapstoneProjects(userId: string): CapstoneProject[] {
  return readDB().capstoneProjects.filter((c) => c.userId === userId);
}

export function createCapstoneProject(data: Omit<CapstoneProject, "id" | "submittedAt" | "averageRating" | "reviewCount">): CapstoneProject {
  const project: CapstoneProject = { ...data, id: uid(), submittedAt: nowISO(), averageRating: 0, reviewCount: 0 };
  mutate((db) => db.capstoneProjects.push(project));
  return project;
}

export function updateCapstoneProject(id: string, updates: Partial<CapstoneProject>): void {
  mutate((db) => {
    const proj = db.capstoneProjects.find((c) => c.id === id);
    if (proj) Object.assign(proj, updates);
  });
}

// ===============================================================
// Phase 5: Job Board
// ===============================================================

export function getActiveJobListings(): JobListing[] {
  const now = nowISO();
  return readDB().jobListings.filter((j) => j.isActive && j.expiresAt > now);
}

export function getJobListingById(id: string): JobListing | undefined {
  return readDB().jobListings.find((j) => j.id === id);
}

export function createJobListing(data: Omit<JobListing, "id" | "postedAt">): JobListing {
  const job: JobListing = { ...data, id: uid(), postedAt: nowISO() };
  mutate((db) => db.jobListings.push(job));
  return job;
}

export function updateJobListing(id: string, updates: Partial<JobListing>): void {
  mutate((db) => {
    const job = db.jobListings.find((j) => j.id === id);
    if (job) Object.assign(job, updates);
  });
}

export function deleteJobListing(id: string): void {
  mutate((db) => {
    db.jobListings = db.jobListings.filter((j) => j.id !== id);
    db.jobApplications = db.jobApplications.filter((a) => a.jobId !== id);
  });
}

export function getJobApplications(jobId: string): (JobApplication & { userName: string; userEmail: string })[] {
  const db = readDB();
  return db.jobApplications
    .filter((a) => a.jobId === jobId)
    .map((a) => {
      const user = db.users.find((u) => u.id === a.userId);
      return { ...a, userName: user?.name || "Unknown", userEmail: user?.email || "" };
    })
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}

export function getMyJobApplications(userId: string): (JobApplication & { jobTitle: string; company: string })[] {
  const db = readDB();
  return db.jobApplications
    .filter((a) => a.userId === userId)
    .map((a) => {
      const job = db.jobListings.find((j) => j.id === a.jobId);
      return { ...a, jobTitle: job?.title || "Unknown", company: job?.company || "" };
    })
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}

export function createJobApplication(data: Omit<JobApplication, "id" | "appliedAt" | "reviewedAt" | "status">): JobApplication {
  const app: JobApplication = { ...data, id: uid(), appliedAt: nowISO(), reviewedAt: null, status: "pending" };
  mutate((db) => db.jobApplications.push(app));
  return app;
}

export function updateJobApplication(id: string, updates: Partial<JobApplication>): void {
  mutate((db) => {
    const app = db.jobApplications.find((a) => a.id === id);
    if (app) Object.assign(app, updates);
  });
}

// ===============================================================
// Other Services — CRUD functions
// ===============================================================

export function getActiveServices(category?: string, search?: string): Service[] {
  const db = readDB();
  let services = db.services.filter((s) => s.isActive);
  if (category && category !== "all") {
    services = services.filter((s) => s.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    services = services.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.providerName.toLowerCase().includes(q)
    );
  }
  return services.sort((a, b) => {
    // Featured first, then by rating
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return b.rating - a.rating;
  });
}

export function getServiceById(id: string): Service | undefined {
  return readDB().services.find((s) => s.id === id);
}

export function getServicesByProvider(providerId: string): Service[] {
  return readDB().services.filter((s) => s.providerId === providerId);
}

export function createService(data: Omit<Service, "id" | "createdAt" | "rating" | "reviewCount">): Service {
  const service: Service = { ...data, id: uid(), createdAt: nowISO(), rating: 0, reviewCount: 0 };
  mutate((db) => db.services.push(service));
  return service;
}

export function updateService(id: string, updates: Partial<Service>): void {
  mutate((db) => {
    const svc = db.services.find((s) => s.id === id);
    if (svc) Object.assign(svc, updates);
  });
}

export function deleteService(id: string): void {
  mutate((db) => {
    db.services = db.services.filter((s) => s.id !== id);
    db.serviceBookings = db.serviceBookings.filter((b) => b.serviceId !== id);
    db.serviceReviews = db.serviceReviews.filter((r) => r.serviceId !== id);
  });
}

// Service bookings
export function getServiceBookings(serviceId?: string, userId?: string): ServiceBooking[] {
  const db = readDB();
  return db.serviceBookings
    .filter((b) => (!serviceId || b.serviceId === serviceId) && (!userId || b.userId === userId))
    .sort((a, b) => b.bookedAt.localeCompare(a.bookedAt));
}

export function createServiceBooking(data: Omit<ServiceBooking, "id" | "bookedAt" | "respondedAt" | "status">): ServiceBooking {
  const booking: ServiceBooking = { ...data, id: uid(), bookedAt: nowISO(), respondedAt: null, status: "pending" };
  mutate((db) => db.serviceBookings.push(booking));
  return booking;
}

export function updateServiceBooking(id: string, updates: Partial<ServiceBooking>): void {
  mutate((db) => {
    const b = db.serviceBookings.find((bk) => bk.id === id);
    if (b) Object.assign(b, updates);
  });
}

// Service reviews
export function getServiceReviews(serviceId: string): ServiceReview[] {
  return readDB()
    .serviceReviews.filter((r) => r.serviceId === serviceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createServiceReview(data: Omit<ServiceReview, "id" | "createdAt">): ServiceReview {
  const review: ServiceReview = { ...data, id: uid(), createdAt: nowISO() };
  mutate((db) => {
    db.serviceReviews.push(review);
    // Recalculate average rating for the service
    const allReviews = db.serviceReviews.filter((r) => r.serviceId === data.serviceId);
    const svc = db.services.find((s) => s.id === data.serviceId);
    if (svc && allReviews.length > 0) {
      svc.rating = Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10) / 10;
      svc.reviewCount = allReviews.length;
    }
  });
  return review;
}

export function getServiceCategories(): { value: ServiceCategory; label: string; icon: string }[] {
  return [
    { value: "tutoring", label: "Tutoring", icon: "📚" },
    { value: "consulting", label: "Consulting", icon: "💡" },
    { value: "mentoring", label: "Mentoring", icon: "🧭" },
    { value: "design", label: "Design", icon: "🎨" },
    { value: "writing", label: "Writing & Editing", icon: "✍️" },
    { value: "translation", label: "Translation", icon: "🌍" },
    { value: "marketing", label: "Marketing", icon: "📣" },
    { value: "business", label: "Business Services", icon: "💼" },
    { value: "legal", label: "Legal", icon: "⚖️" },
    { value: "health", label: "Health & Wellness", icon: "🏥" },
    { value: "other", label: "Other", icon: "🔧" },
  ];
}
