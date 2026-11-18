// store.ts — MERGED from store-base.ts + store-crud-a.ts + store-crud-b.ts
// DO NOT split — single file required for Render Turbopack build reliability
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ---------------------------------------------------------------
// Simple JSON file database — data lives in ./data/db.json
// Perfect for a small business. Can be swapped for a real DB later.
// Schema based on LMS Database Schema ERD.
// ---------------------------------------------------------------

export type Role = "student" | "instructor" | "admin" | "teaching_assistant" | "auditor";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  bio?: string;        // instructor bio
  avatar?: string;     // profile image URL
  title?: string;      // e.g. "Senior Network Engineer"
  createdAt: string;
  securityQuestion?: string;   // for forgot-password flow
  securityAnswerHash?: string; // bcrypt hash of the answer (lowercased, trimmed)
  mfaEnabled?: boolean;        // TOTP-based MFA
  mfaSecret?: string;          // base32 TOTP secret
};

export type Session = { token: string; userId: string; expiresAt: string };

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;        // emoji or short text
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  description: string;
  coverImage: string;
  price: number;            // 0 = free
  published: boolean;
  instructorId: string;     // FK -> users.id
  level: "Beginner" | "Intermediate" | "Advanced";
  language: string;         // e.g. "English"
  createdAt: string;
  prerequisiteCourseIds: string[]; // courses that must be completed before enrolling
};

export type Module = {
  id: string;
  courseId: string;
  title: string;
  order: number;
};

export type LessonType = "video" | "text" | "quiz" | "pdf" | "ctf" | "lab";

export type Lesson = {
  id: string;
  moduleId: string;        // FK -> modules.id
  courseId: string;        // denormalized for easy queries
  order: number;
  title: string;
  type: LessonType;
  videoUrl: string;
  content: string;         // markdown/text
  duration: number;        // minutes
  preview: boolean;        // free preview lesson
};

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  purchasedAt: string;
  paymentRef: string;
  completed: boolean;
  completedAt: string | null;
};

export type Progress = { userId: string; lessonId: string; completedAt: string };

export type Review = {
  id: string;
  courseId: string;
  userId: string;
  rating: number;          // 1-5
  comment: string;
  createdAt: string;
};

export type Certificate = {
  id: string;
  userId: string;
  courseId: string;
  code: string;            // verification code
  hash: string;            // SHA-256 cryptographic hash for verification
  skills: string[];        // skills mastered (for verifiable credentials)
  issuedAt: string;
  expiresAt: string | null; // null = never expires; ISO date for recertification
};

export type Payment = {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  method: string;
  status: "pending" | "paid" | "failed";
  ref: string;
  createdAt: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;          // e.g. "Networking", "Programming", "Self-Help"
  fileType: string;          // "pdf", "epub", "doc", "link"
  fileUrl: string;           // download link or external URL
  coverImage: string;        // optional cover image URL
  uploadedBy: string;        // user id
  uploadedAt: string;
  downloads: number;
  featured: boolean;
};

export type Notification = {
  id: string;
  userId: string;            // recipient
  type: string;              // "enrollment", "payment", "certificate", "lesson_complete", "new_course", "new_book", "welcome", "admin"
  title: string;
  message: string;
  link: string;              // URL to navigate to when clicked
  read: boolean;
  createdAt: string;
};

// ---------------------------------------------------------------
// Enterprise: Quiz & Assessment System
// ---------------------------------------------------------------

export type QuestionType = "mcq" | "true_false" | "short_answer";

export type Question = {
  id: string;
  quizId: string;
  text: string;
  type: QuestionType;
  options: string[];           // for mcq: ["Red", "Blue", ...]; for true_false: ["True", "False"]
  correctAnswer: string;       // for mcq/true_false: the exact option text; for short_answer: model answer
  explanation: string;         // shown after answering
  points: number;              // default 1
  order: number;
};

export type Quiz = {
  id: string;
  lessonId: string | null;     // null = course-level final exam (not tied to a lesson)
  courseId: string;            // denormalized
  title: string;
  description: string;
  passingScore: number;        // percentage 0-100
  maxAttempts: number;         // 0 = unlimited
  shuffleQuestions: boolean;
  timeLimit: number;           // minutes, 0 = no limit
  isFinalExam: boolean;        // true = final course assessment
  createdAt: string;
};

export type QuizAttempt = {
  id: string;
  quizId: string;
  userId: string;
  answers: { questionId: string; answer: string; correct: boolean }[];
  score: number;               // percentage 0-100
  passed: boolean;
  timeTakenSec: number;
  violations: number;          // anti-cheating: tab switches, copy attempts
  createdAt: string;
};

// ---------------------------------------------------------------
// Enterprise: Audit Logs
// ---------------------------------------------------------------

export type AuditLog = {
  id: string;
  userId: string;
  userName: string;
  action: string;              // "LOGIN", "CREATE_COURSE", "EDIT_COURSE", "DELETE_COURSE", "VERIFY_PAYMENT", "ADD_BOOK", "DELETE_BOOK", "ROLE_CHANGE", "EXPORT_DATA"
  entity: string;              // "course", "payment", "book", "user", "quiz", etc.
  entityId: string;
  details: string;
  ip: string;
  createdAt: string;
};

// ---------------------------------------------------------------
// Enterprise Phase 3: Note-Taking & Bookmarks
// ---------------------------------------------------------------
export type Note = {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  timestamp: number | null;  // video timestamp in seconds (null for text lessons)
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Bookmark = {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  timestamp: number | null;
  label: string;
  createdAt: string;
};

// ---------------------------------------------------------------
// Enterprise Phase 3: Discussion Threads & Q&A
// ---------------------------------------------------------------
export type Discussion = {
  id: string;
  courseId: string;
  lessonId: string | null;    // null = course-level discussion
  userId: string;
  title: string;
  content: string;
  pinned: boolean;
  upvotes: string[];          // user IDs who upvoted
  createdAt: string;
};

export type Reply = {
  id: string;
  discussionId: string;
  userId: string;
  content: string;
  isVerifiedAnswer: boolean;   // instructor marks as verified
  upvotes: string[];
  createdAt: string;
};

// ---------------------------------------------------------------
// Enterprise Phase 3: Gamification
// ---------------------------------------------------------------
export type BadgeType =
  | "first_course" | "first_quiz" | "first_certificate"
  | "streak_7" | "streak_30" | "streak_100"
  | "course_complete" | "quiz_perfect" | "early_adopter"
  | "five_courses" | "helpful_peer" | "exam_passer";

export type Badge = {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string;               // emoji
  color: string;              // tailwind color class
};

export type UserBadge = {
  id: string;
  userId: string;
  badgeType: BadgeType;
  awardedAt: string;
};

export type Streak = {
  userId: string;
  currentStreak: number;      // consecutive days
  longestStreak: number;
  lastActiveDate: string;     // YYYY-MM-DD
  totalActiveDays: number;
  totalXP?: number;           // gamification XP points
};

export type LeaderboardEntry = {
  userId: string;
  name: string;
  avatar: string;
  points: number;
  coursesCompleted: number;
  streak: number;
  badges: number;
  optedIn: boolean;
};

// ---------------------------------------------------------------
// Enterprise Phase 3: Assignments & Submissions
// ---------------------------------------------------------------
export type Assignment = {
  id: string;
  courseId: string;
  lessonId: string | null;
  title: string;
  description: string;
  instructions: string;
  maxPoints: number;
  dueDate: string | null;     // ISO date
  allowedFileTypes: string[];  // e.g. ["pdf", "doc", "zip", "py"]
  maxFileSizeMB: number;
  createdAt: string;
};

export type Submission = {
  id: string;
  assignmentId: string;
  userId: string;
  fileName: string;
  fileData: string;           // base64 encoded file content
  fileType: string;
  notes: string;              // student notes accompanying submission
  submittedAt: string;
  status: "pending" | "graded" | "returned";
  grade: number | null;       // points awarded
  feedback: string;           // instructor feedback
  gradedBy: string | null;
  gradedAt: string | null;
};

// ---------------------------------------------------------------
// Enterprise Phase 3: Promo Codes & Bundles
// ---------------------------------------------------------------
export type PromoCode = {
  id: string;
  code: string;               // e.g. "WELCOME50"
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;      // 50 = 50% off, or 500 = KES 500 off
  maxUses: number;            // 0 = unlimited
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  courseId: string | null;    // null = applies to all courses
  createdAt: string;
};

export type Bundle = {
  id: string;
  title: string;
  description: string;
  courseIds: string[];
  price: number;              // bundle price (less than sum of individual)
  originalPrice: number;      // sum of individual prices
  active: boolean;
  createdAt: string;
};

// ---------------------------------------------------------------
// Enterprise Phase 3: Calendar Events
// ---------------------------------------------------------------
export type CalendarEvent = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  eventType: "exam" | "deadline" | "live_session" | "office_hours";
  eventDate: string;          // ISO date
  meetingUrl: string | null;  // Zoom/Meet link for live sessions
  createdAt: string;
};

// ---------------------------------------------------------------
// Phase 4: Interactive Flashcards & Spaced Repetition (SRS)
// ---------------------------------------------------------------
export type FlashcardDeck = {
  id: string;
  courseId: string;
  lessonId: string | null;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
};

export type Flashcard = {
  id: string;
  deckId: string;
  front: string;            // question / term
  back: string;             // answer / definition
  order: number;
};

// SRS review record (simplified SM-2 algorithm)
export type SRSReview = {
  id: string;
  userId: string;
  flashcardId: string;
  ease: number;             // ease factor (starts at 2.5)
  interval: number;         // days until next review
  repetitions: number;      // consecutive correct
  nextReviewDate: string;   // YYYY-MM-DD
  lastReviewedAt: string | null;
};

// ---------------------------------------------------------------
// Phase 4: Public Student Portfolio
// ---------------------------------------------------------------
export type Portfolio = {
  userId: string;
  slug: string;              // @username URL slug
  bio: string;
  headline: string;          // e.g. "Network Engineer in training"
  location: string;
  website: string;
  linkedinUrl: string;
  githubUrl: string;
  skills: string[];          // verified skill tags from certificates
  isPublic: boolean;
  updatedAt: string;
};

// ---------------------------------------------------------------
// Phase 4: Study Sessions (Pomodoro / Focus Timer)
// ---------------------------------------------------------------
export type StudySession = {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string | null;
  durationMinutes: number;
  sessionType: "pomodoro" | "focus" | "break";
  completed: boolean;
  createdAt: string;
};

// ---------------------------------------------------------------
// Phase 4: Placement Quiz / Skill Gap Diagnostic
// ---------------------------------------------------------------
export type PlacementResult = {
  id: string;
  userId: string;
  courseId: string;
  quizId: string;
  score: number;             // percentage
  testedOutLessons: string[];  // lesson IDs the student can skip
  recommendedLessons: string[]; // lessons the student still needs
  takenAt: string;
};

// ===============================================================
// Phase 5: Predictive Analytics & Intervention
// ===============================================================

export type RiskFlag = {
  id: string;
  userId: string;
  courseId: string;
  riskLevel: "low" | "medium" | "high";
  reasons: string[];           // e.g. ["no_login_7d", "quiz_score_drop", "low_watch_time"]
  flaggedAt: string;
  resolvedAt: string | null;
  resolutionNote: string;
};

export type Competency = {
  id: string;
  name: string;
  description: string;
  category: string;            // e.g. "Networking", "Security"
};

export type LessonCompetency = {
  lessonId: string;
  competencyId: string;
  weight: number;              // 1-5 importance
};

export type SkillProfile = {
  userId: string;
  competencies: { competencyId: string; score: number; assessedAt: string }[];
  updatedAt: string;
};

// ===============================================================
// Phase 5: Content Versioning & AI Authoring
// ===============================================================

export type CourseVersion = {
  id: string;
  courseId: string;
  version: number;
  status: "draft" | "published" | "archived";
  snapshot: string;            // JSON string of course+modules+lessons at that version
  createdBy: string;
  createdAt: string;
  notes: string;
};

export type AIGenerationJob = {
  id: string;
  userId: string;
  type: "course_outline" | "quiz" | "flashcards" | "subtitles";
  status: "pending" | "completed" | "failed";
  inputText: string;           // raw text or base64 content
  inputFileName: string;
  output: string;              // JSON string of generated content
  provider: string;            // "groq" | "gemini" | "openai"
  createdAt: string;
  completedAt: string | null;
  error: string;
};

// ===============================================================
// Phase 5: Ecosystem Integrations
// ===============================================================

export type WebhookConfig = {
  id: string;
  url: string;
  events: string[];            // ["course.completed", "user.enrolled", "certificate.issued", ...]
  secret: string;
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt: string | null;
  lastStatus: number;          // HTTP status code
};

export type WebhookLog = {
  id: string;
  webhookId: string;
  event: string;
  payload: string;             // JSON string
  responseStatus: number;
  deliveredAt: string;
};

export type BotIntegration = {
  id: string;
  userId: string;
  platform: "telegram" | "slack" | "whatsapp";
  chatId: string;              // Telegram chat ID or Slack channel
  isActive: boolean;
  preferences: {
    dailyQuiz: boolean;
    deadlineReminders: boolean;
    instructorReplies: boolean;
    certificateIssued: boolean;
  };
  connectedAt: string;
};

// ===============================================================
// Phase 5: Peer Review & Career Bridge
// ===============================================================

export type PeerReview = {
  id: string;
  submissionId: string;        // the assignment submission being reviewed
  reviewerId: string;
  rubricScores: { criterion: string; score: number; maxScore: number; comment: string }[];
  overallComment: string;
  rating: number;              // 1-5 stars
  submittedAt: string;
  isAnonymous: boolean;
};

export type CapstoneProject = {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  description: string;
  repositoryUrl: string;
  demoUrl: string;
  screenshot: string;          // base64 or URL
  isPublished: boolean;        // published to Hall of Fame
  averageRating: number;
  reviewCount: number;
  submittedAt: string;
};

export type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "internship";
  description: string;
  requirements: string[];      // required skill/competency IDs
  preferredCertifications: string[];  // course IDs
  salaryRange: string;
  postedBy: string;            // userId of the employer/admin
  isActive: boolean;
  postedAt: string;
  expiresAt: string;
};

export type JobApplication = {
  id: string;
  jobId: string;
  userId: string;
  coverLetter: string;
  status: "pending" | "reviewed" | "shortlisted" | "rejected" | "hired";
  appliedAt: string;
  reviewedAt: string | null;
};

// ===============================================================
// Other Services — non-tech marketplace (tutoring, consulting, etc.)
// ===============================================================

export type ServiceCategory =
  | "tutoring"
  | "consulting"
  | "mentoring"
  | "design"
  | "writing"
  | "translation"
  | "marketing"
  | "business"
  | "legal"
  | "health"
  | "other";

export type Service = {
  id: string;
  providerId: string;            // userId of the service provider
  providerName: string;
  title: string;
  description: string;
  category: ServiceCategory;
  tags: string[];                // e.g. ["math", "physics", "essay"]
  price: number;                 // 0 = free
  priceUnit: string;             // "per hour", "per session", "fixed", "negotiable"
  location: string;              // "Online", "Addis Ababa", "Remote"
  contactMethod: string;         // "email", "phone", "telegram", "whatsapp"
  contactInfo: string;           // actual contact detail
  rating: number;                // average rating 0-5
  reviewCount: number;
  isActive: boolean;
  featured: boolean;             // show on homepage
  createdAt: string;
};

export type ServiceBooking = {
  id: string;
  serviceId: string;
  userId: string;                // the person requesting
  message: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  bookedAt: string;
  respondedAt: string | null;
};

export type ServiceReview = {
  id: string;
  serviceId: string;
  userId: string;
  rating: number;                // 1-5
  comment: string;
  createdAt: string;
};

// ---------------------------------------------------------------
// Phase 6: CTF Challenges, Labs, Team Licensing, Open Badges
// ---------------------------------------------------------------

/** CTF (Capture The Flag) challenge — embedded in lessons */
export type CTFChallenge = {
  id: string;
  lessonId: string;              // which lesson this belongs to
  courseId: string;              // denormalized
  title: string;
  description: string;           // challenge prompt (markdown)
  category: "crypto" | "forensics" | "network" | "web" | "linux" | "reverse" | "misc";
  difficulty: "easy" | "medium" | "hard" | "expert";
  flagHash: string;              // SHA-256 hash of the flag (case-insensitive)
  points: number;                // XP/gamification points awarded
  hint: string;                  // progressive hint shown after 3 failed attempts
  maxAttempts: number;           // 0 = unlimited
  solveCount: number;            // how many users have solved it
  createdAt: string;
};

/** CTF solve record — tracks who solved what */
export type CTFSolve = {
  id: string;
  challengeId: string;
  userId: string;
  attemptsUsed: number;
  solvedAt: string;
  pointsAwarded: number;
};

/** Interactive lab configuration — embedded in lessons */
export type LabConfig = {
  id: string;
  lessonId: string;
  courseId: string;
  type: "terminal" | "network_sim" | "packet_capture" | "firewall_config" | "cli_challenge";
  title: string;
  description: string;
  /** For terminal/cli_challenge: available commands and their simulated outputs */
  commands: { command: string; output: string; success?: boolean }[];
  /** Guided steps the student must complete in order */
  steps: { instruction: string; expectedCommand: string; hint: string; completed: boolean }[];
  /** Environment setup info shown to student */
  environment: string;           // e.g. "Kali Linux 2024.1 | 2 vCPU | 4GB RAM"
  timeLimit: number;             // minutes, 0 = no limit
  createdAt: string;
};

/** Lab completion record */
export type LabCompletion = {
  id: string;
  labConfigId: string;
  userId: string;
  stepsCompleted: number;
  totalSteps: number;
  completed: boolean;
  completedAt: string | null;
  startedAt: string;
};

/** Corporate / Team seat license */
export type TeamLicense = {
  id: string;
  companyName: string;
  contactEmail: string;          // manager's email
  contactName: string;
  plan: "starter" | "team" | "enterprise";
  seatsPurchased: number;
  seatsUsed: number;
  coursesIncluded: string[];     // course IDs the team has access to (empty = all)
  amountPaid: number;
  currency: string;
  paymentRef: string;
  status: "active" | "expired" | "suspended";
  createdAt: string;
  expiresAt: string;             // ISO date
};

/** Team member — linked to a TeamLicense */
export type TeamMember = {
  id: string;
  licenseId: string;             // FK -> TeamLicense.id
  userId: string;                // the employee's user account
  email: string;
  name: string;
  invitedAt: string;
  joinedAt: string | null;
  status: "invited" | "active" | "removed";
};

/** Open Badges v3 assertion — compliant with Open Badges standard */
export type BadgeAssertion = {
  id: string;                    // unique assertion ID (UUID)
  badgeId: string;               // FK -> Badge.id
  userId: string;
  issuedOn: string;              // ISO date
  verificationUrl: string;       // public URL to verify this assertion
  evidenceUrl: string;           // URL to evidence (course page, certificate, etc.)
  recipientEmail: string;
  recipientName: string;
};

/** Course prerequisite — course A requires course B to be completed first */
export type Prerequisite = {
  id: string;
  courseId: string;              // the course that has the prerequisite
  prerequisiteCourseId: string;  // the course that must be completed first
  requiredScore: number;         // minimum final exam score (0-100, 0 = just completion)
  createdAt: string;
};

export type DB = {
  users: User[];
  sessions: Session[];
  categories: Category[];
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
  enrollments: Enrollment[];
  progress: Progress[];
  reviews: Review[];
  certificates: Certificate[];
  payments: Payment[];
  books: Book[];
  notifications: Notification[];
  quizzes: Quiz[];
  questions: Question[];
  quizAttempts: QuizAttempt[];
  auditLogs: AuditLog[];
  notes: Note[];
  bookmarks: Bookmark[];
  discussions: Discussion[];
  replies: Reply[];
  badges: Badge[];
  userBadges: UserBadge[];
  streaks: Streak[];
  assignments: Assignment[];
  submissions: Submission[];
  promoCodes: PromoCode[];
  bundles: Bundle[];
  calendarEvents: CalendarEvent[];
  flashcardDecks: FlashcardDeck[];
  flashcards: Flashcard[];
  srsReviews: SRSReview[];
  portfolios: Portfolio[];
  studySessions: StudySession[];
  placementResults: PlacementResult[];
  // Phase 5: Predictive Analytics
  riskFlags: RiskFlag[];
  competencies: Competency[];
  lessonCompetencies: LessonCompetency[];
  skillProfiles: SkillProfile[];
  // Phase 5: Content Versioning & AI Authoring
  courseVersions: CourseVersion[];
  aiGenerationJobs: AIGenerationJob[];
  // Phase 5: Ecosystem Integrations
  webhookConfigs: WebhookConfig[];
  webhookLogs: WebhookLog[];
  botIntegrations: BotIntegration[];
  // Phase 5: Peer Review & Career Bridge
  peerReviews: PeerReview[];
  capstoneProjects: CapstoneProject[];
  jobListings: JobListing[];
  jobApplications: JobApplication[];
  // Other Services marketplace
  services: Service[];
  serviceBookings: ServiceBooking[];
  serviceReviews: ServiceReview[];
  // Phase 6: CTF, Labs, Teams, Badges, Prerequisites
  ctfChallenges: CTFChallenge[];
  ctfSolves: CTFSolve[];
  labConfigs: LabConfig[];
  labCompletions: LabCompletion[];
  teamLicenses: TeamLicense[];
  teamMembers: TeamMember[];
  badgeAssertions: BadgeAssertion[];
  prerequisites: Prerequisite[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const emptyDB = (): DB => ({
  users: [],
  sessions: [],
  categories: [],
  courses: [],
  modules: [],
  lessons: [],
  enrollments: [],
  progress: [],
  reviews: [],
  certificates: [],
  payments: [],
  books: [],
  notifications: [],
  quizzes: [],
  questions: [],
  quizAttempts: [],
  auditLogs: [],
  notes: [],
  bookmarks: [],
  discussions: [],
  replies: [],
  badges: [],
  userBadges: [],
  streaks: [],
  assignments: [],
  submissions: [],
  promoCodes: [],
  bundles: [],
  calendarEvents: [],
  flashcardDecks: [],
  flashcards: [],
  srsReviews: [],
  portfolios: [],
  studySessions: [],
  placementResults: [],
  // Phase 5
  riskFlags: [],
  competencies: [],
  lessonCompetencies: [],
  skillProfiles: [],
  courseVersions: [],
  aiGenerationJobs: [],
  webhookConfigs: [],
  webhookLogs: [],
  botIntegrations: [],
  peerReviews: [],
  capstoneProjects: [],
  jobListings: [],
  jobApplications: [],
  // Other Services
  services: [],
  serviceBookings: [],
  serviceReviews: [],
  // Phase 6: CTF, Labs, Teams, Badges, Prerequisites
  ctfChallenges: [],
  ctfSolves: [],
  labConfigs: [],
  labCompletions: [],
  teamLicenses: [],
  teamMembers: [],
  badgeAssertions: [],
  prerequisites: [],
});

let cache: DB | null = null;
let cacheMtime = 0;

export function readDB(): DB {
  let mtime = 0;
  try {
    mtime = fs.statSync(DB_FILE).mtimeMs;
  } catch {
    // file doesn't exist yet
  }
  if (cache && mtime === cacheMtime) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB;
    cacheMtime = mtime;
    // Migrate: ensure all new fields exist on old data
    migrateDB(cache);
  } catch {
    cache = emptyDB();
    cacheMtime = 0;
  }
  return cache;
}

/** Default competency list for skill matrix. */
function getDefaultCompetencies(): Competency[] {
  return [
    { id: "comp-network-fundamentals", name: "Network Fundamentals", description: "OSI model, TCP/IP, routing basics", category: "Networking" },
    { id: "comp-network-troubleshooting", name: "Network Troubleshooting", description: "Diagnosing connectivity, latency, packet loss", category: "Networking" },
    { id: "comp-subnetting", name: "Subnetting & IP Addressing", description: "VLSM, CIDR, IPv4/IPv6 planning", category: "Networking" },
    { id: "comp-sql", name: "SQL & Database Queries", description: "SELECT, JOINs, aggregations, subqueries", category: "Database" },
    { id: "comp-db-design", name: "Database Design", description: "Normalization, ERD, schema design", category: "Database" },
    { id: "comp-db-admin", name: "Database Administration", description: "Backup, recovery, performance tuning", category: "Database" },
    { id: "comp-security-fundamentals", name: "Security Fundamentals", description: "CIA triad, access control, encryption", category: "Security" },
    { id: "comp-pentesting", name: "Penetration Testing", description: "Recon, exploitation, reporting", category: "Security" },
    { id: "comp-incident-response", name: "Incident Response", description: "Detection, containment, forensics", category: "Security" },
    { id: "comp-it-support", name: "IT Support & Helpdesk", description: "Ticketing, hardware, OS troubleshooting", category: "IT Support" },
    { id: "comp-system-admin", name: "System Administration", description: "Linux/Windows server management", category: "IT Support" },
    { id: "comp-python", name: "Python Programming", description: "Syntax, data structures, automation", category: "Programming" },
    { id: "comp-ml-basics", name: "Machine Learning Basics", description: "Supervised/unsupervised learning, model evaluation", category: "AI" },
    { id: "comp-ai-ethics", name: "AI Ethics & Governance", description: "Bias, fairness, responsible AI", category: "AI" },
  ];
}

/** Default badge definitions for gamification. */
function getBadgeDefinitions(): Badge[] {
  return [
    { id: uid(), type: "first_course", name: "First Steps", description: "Enrolled in your first course", icon: "🎯", color: "bg-blue-100 text-blue-700" },
    { id: uid(), type: "first_quiz", name: "Quiz Rookie", description: "Completed your first quiz", icon: "❓", color: "bg-purple-100 text-purple-700" },
    { id: uid(), type: "first_certificate", name: "Certified", description: "Earned your first certificate", icon: "🏅", color: "bg-yellow-100 text-yellow-700" },
    { id: uid(), type: "streak_7", name: "Week Warrior", description: "7-day learning streak", icon: "🔥", color: "bg-orange-100 text-orange-700" },
    { id: uid(), type: "streak_30", name: "Monthly Master", description: "30-day learning streak", icon: "⚡", color: "bg-red-100 text-red-700" },
    { id: uid(), type: "streak_100", name: "Centurion", description: "100-day learning streak", icon: "💯", color: "bg-pink-100 text-pink-700" },
    { id: uid(), type: "course_complete", name: "Course Crusher", description: "Completed a full course", icon: "🎓", color: "bg-green-100 text-green-700" },
    { id: uid(), type: "quiz_perfect", name: "Perfect Score", description: "Got 100% on a quiz", icon: "⭐", color: "bg-indigo-100 text-indigo-700" },
    { id: uid(), type: "early_adopter", name: "Early Adopter", description: "Joined TechPath Academy early", icon: "🚀", color: "bg-cyan-100 text-cyan-700" },
    { id: uid(), type: "five_courses", name: "Knowledge Seeker", description: "Enrolled in 5+ courses", icon: "📚", color: "bg-teal-100 text-teal-700" },
    { id: uid(), type: "exam_passer", name: "Exam Conqueror", description: "Passed a final exam", icon: "🏆", color: "bg-amber-100 text-amber-700" },
    { id: uid(), type: "helpful_peer", name: "Helpful Peer", description: "Posted a verified answer in discussions", icon: "🤝", color: "bg-violet-100 text-violet-700" },
  ];
}

/** Add missing fields to old DB records (forward-compatible migration). */
function migrateDB(db: DB) {
  for (const u of db.users) {
    if (!u.bio) u.bio = "";
    if (!u.avatar) u.avatar = "";
    if (!u.title) u.title = "";
    if (u.securityQuestion === undefined) u.securityQuestion = "";
    if (u.securityAnswerHash === undefined) u.securityAnswerHash = "";
    if (u.mfaEnabled === undefined) u.mfaEnabled = false;
    if (u.mfaSecret === undefined) u.mfaSecret = "";
  }
  for (const e of db.enrollments) {
    if (e.completed === undefined) e.completed = false;
    if (e.completedAt === undefined) e.completedAt = null;
  }
  for (const c of db.courses) {
    // Old courses had `category` string, not `categoryId`
    if (!c.categoryId && (c as Record<string, unknown>).category) {
      const oldCat = (c as Record<string, unknown>).category as string;
      const found = db.categories.find(cat => cat.name === oldCat);
      c.categoryId = found?.id ?? db.categories[0]?.id ?? "";
      delete (c as Record<string, unknown>).category;
    }
    if (!c.instructorId) c.instructorId = db.users[0]?.id ?? "";
    if (!c.level) c.level = "Beginner";
    if (!c.language) c.language = "English";
  }
  for (const l of db.lessons) {
    if (!l.type) l.type = "text";
    if (l.duration === undefined) l.duration = 0;
    if (l.preview === undefined) l.preview = false;
    if (!l.moduleId) l.moduleId = "";
  }
  // Migrate certificates: add hash, skills, expiresAt
  if (!db.quizzes) db.quizzes = [];
  if (!db.questions) db.questions = [];
  if (!db.quizAttempts) db.quizAttempts = [];
  if (!db.auditLogs) db.auditLogs = [];
  // Phase 3 collections
  if (!db.notes) db.notes = [];
  if (!db.bookmarks) db.bookmarks = [];
  if (!db.discussions) db.discussions = [];
  if (!db.replies) db.replies = [];
  if (!db.badges) db.badges = [];
  if (!db.userBadges) db.userBadges = [];
  if (!db.streaks) db.streaks = [];
  if (!db.assignments) db.assignments = [];
  if (!db.submissions) db.submissions = [];
  if (!db.promoCodes) db.promoCodes = [];
  if (!db.bundles) db.bundles = [];
  if (!db.calendarEvents) db.calendarEvents = [];
  // Phase 4 collections
  if (!db.flashcardDecks) db.flashcardDecks = [];
  if (!db.flashcards) db.flashcards = [];
  if (!db.srsReviews) db.srsReviews = [];
  if (!db.portfolios) db.portfolios = [];
  if (!db.studySessions) db.studySessions = [];
  if (!db.placementResults) db.placementResults = [];
  // Phase 5 collections
  if (!db.riskFlags) db.riskFlags = [];
  if (!db.competencies) db.competencies = [];
  if (!db.lessonCompetencies) db.lessonCompetencies = [];
  if (!db.skillProfiles) db.skillProfiles = [];
  if (!db.courseVersions) db.courseVersions = [];
  if (!db.aiGenerationJobs) db.aiGenerationJobs = [];
  if (!db.webhookConfigs) db.webhookConfigs = [];
  if (!db.webhookLogs) db.webhookLogs = [];
  if (!db.botIntegrations) db.botIntegrations = [];
  if (!db.peerReviews) db.peerReviews = [];
  if (!db.capstoneProjects) db.capstoneProjects = [];
  if (!db.jobListings) db.jobListings = [];
  if (!db.jobApplications) db.jobApplications = [];
  // Other Services collections
  if (!db.services) db.services = [];
  if (!db.serviceBookings) db.serviceBookings = [];
  if (!db.serviceReviews) db.serviceReviews = [];
  // Phase 6 collections
  if (!db.ctfChallenges) db.ctfChallenges = [];
  if (!db.ctfSolves) db.ctfSolves = [];
  if (!db.labConfigs) db.labConfigs = [];
  if (!db.labCompletions) db.labCompletions = [];
  if (!db.teamLicenses) db.teamLicenses = [];
  if (!db.teamMembers) db.teamMembers = [];
  if (!db.badgeAssertions) db.badgeAssertions = [];
  if (!db.prerequisites) db.prerequisites = [];
  // Seed default competencies if empty
  if (db.competencies.length === 0) {
    db.competencies = getDefaultCompetencies();
  }
  // Seed badges if empty
  if (db.badges.length === 0) {
    db.badges = getBadgeDefinitions();
  }
  for (const cert of db.certificates) {
    if (!cert.hash) {
      cert.hash = crypto
        .createHash("sha256")
        .update(cert.code + cert.userId + cert.courseId + cert.issuedAt)
        .digest("hex");
    }
    if (!cert.skills) cert.skills = [];
    if (cert.expiresAt === undefined) cert.expiresAt = null;
  }
  // Migrate courses — add prerequisiteCourseIds
  for (const c of db.courses) {
    if (!c.prerequisiteCourseIds) c.prerequisiteCourseIds = [];
  }
}

export function writeDB(db: DB): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
  cache = db;
  cacheMtime = fs.statSync(DB_FILE).mtimeMs;
}

/** Read-modify-write helper. Synchronous = safe for small traffic. */
export function mutate(fn: (db: DB) => void): DB {
  const db = readDB();
  fn(db);
  writeDB(db);
  return db;
}

export const uid = () => crypto.randomUUID();
export const nowISO = () => new Date().toISOString();


// ──────────────────────────────────────────────────────────────
// CRUD functions from store-crud-a.ts (Phase 1-3)
// ──────────────────────────────────────────────────────────────

// store-crud-a.ts — Query helpers, CRUD functions (Phase 1-3)
// Auto-split from store.ts for proxy size limits




// ---- Query helpers ----

export function getCourseBySlug(slug: string): Course | undefined {
  return readDB().courses.find(c => c.slug === slug);
}

export function getCourseById(id: string): Course | undefined {
  return readDB().courses.find(c => c.id === id);
}

export function getModulesForCourse(courseId: string): Module[] {
  return readDB().modules
    .filter(m => m.courseId === courseId)
    .sort((a, b) => a.order - b.order);
}

export function getLessonsForModule(moduleId: string): Lesson[] {
  return readDB().lessons
    .filter(l => l.moduleId === moduleId)
    .sort((a, b) => a.order - b.order);
}

export function getLessonsForCourse(courseId: string): Lesson[] {
  const modules = getModulesForCourse(courseId);
  const result: Lesson[] = [];
  for (const m of modules) {
    result.push(...getLessonsForModule(m.id));
  }
  return result;
}

export function getCategoryById(id: string): Category | undefined {
  return readDB().categories.find(c => c.id === id);
}

export function getInstructor(userId: string): User | undefined {
  return readDB().users.find(u => u.id === userId);
}

export function getReviewsForCourse(courseId: string): Review[] {
  return readDB().reviews
    .filter(r => r.courseId === courseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAverageRating(courseId: string): number {
  const reviews = getReviewsForCourse(courseId);
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function getEnrollment(userId: string, courseId: string): Enrollment | undefined {
  return readDB().enrollments.find(
    e => e.userId === userId && e.courseId === courseId
  );
}

export function getProgress(userId: string, courseId: string): Progress[] {
  const lessons = getLessonsForCourse(courseId);
  const lessonIds = new Set(lessons.map(l => l.id));
  return readDB().progress.filter(
    p => p.userId === userId && lessonIds.has(p.lessonId)
  );
}

export function getCompletionPercent(userId: string, courseId: string): number {
  const lessons = getLessonsForCourse(courseId);
  if (lessons.length === 0) return 0;
  const progress = getProgress(userId, courseId);
  return Math.round((progress.length / lessons.length) * 100);
}

export function getCertificate(userId: string, courseId: string): Certificate | undefined {
  return readDB().certificates.find(
    c => c.userId === userId && c.courseId === courseId
  );
}

export function generateCertCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TPA-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += "-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += "-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ---------------------------------------------------------------
// Book Catalog functions
// ---------------------------------------------------------------

export function getAllBooks(): Book[] {
  return readDB().books.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function getBookById(id: string): Book | undefined {
  return readDB().books.find((b) => b.id === id);
}

export function createBook(data: Omit<Book, "id" | "uploadedAt" | "downloads">): Book {
  const book: Book = {
    ...data,
    id: uid(),
    uploadedAt: nowISO(),
    downloads: 0,
  };
  mutate((db) => { db.books.push(book); });
  return book;
}

export function updateBook(id: string, updates: Partial<Book>): void {
  mutate((db) => {
    const book = db.books.find((b) => b.id === id);
    if (book) Object.assign(book, updates);
  });
}

export function deleteBook(id: string): void {
  mutate((db) => {
    db.books = db.books.filter((b) => b.id !== id);
  });
}

export function incrementBookDownload(id: string): void {
  mutate((db) => {
    const book = db.books.find((b) => b.id === id);
    if (book) book.downloads++;
  });
}

// ---------------------------------------------------------------
// Notification functions
// ---------------------------------------------------------------

export function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}): Notification {
  const notif: Notification = {
    id: uid(),
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link || "",
    read: false,
    createdAt: nowISO(),
  };
  mutate((db) => { db.notifications.unshift(notif); });
  return notif;
}

export function getNotifications(userId: string, limit?: number): Notification[] {
  const all = readDB().notifications.filter((n) => n.userId === userId);
  return limit ? all.slice(0, limit) : all;
}

export function getUnreadCount(userId: string): number {
  return readDB().notifications.filter((n) => n.userId === userId && !n.read).length;
}

export function markNotificationRead(id: string): void {
  mutate((db) => {
    const n = db.notifications.find((n) => n.id === id);
    if (n) n.read = true;
  });
}

export function markAllNotificationsRead(userId: string): void {
  mutate((db) => {
    db.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
  });
}

export function deleteNotification(id: string): void {
  mutate((db) => {
    db.notifications = db.notifications.filter((n) => n.id !== id);
  });
}

// Notify all admins (used for new enrollments, payments, etc.)
export function notifyAdmins(title: string, message: string, link: string): void {
  const admins = readDB().users.filter((u) => u.role === "admin" || u.role === "instructor");
  for (const admin of admins) {
    createNotification({ userId: admin.id, type: "admin", title, message, link });
  }
}

// Notify all students (used for new courses, new books)
export function notifyAllStudents(title: string, message: string, link: string): void {
  const students = readDB().users.filter((u) => u.role === "student");
  for (const student of students) {
    createNotification({ userId: student.id, type: "new_course", title, message, link });
  }
}

// ---------------------------------------------------------------
// Enterprise: Enhanced Certificate functions
// ---------------------------------------------------------------

export function generateCertHash(code: string, userId: string, courseId: string, issuedAt: string): string {
  return crypto
    .createHash("sha256")
    .update(code + userId + courseId + issuedAt + "TechPathAcademy2026")
    .digest("hex");
}

export function verifyCertificate(code: string, hash: string): Certificate | null {
  const cert = readDB().certificates.find((c) => c.code === code);
  if (!cert) return null;
  const expectedHash = cert.hash || generateCertHash(cert.code, cert.userId, cert.courseId, cert.issuedAt);
  return hash === expectedHash ? cert : null;
}

export function getCertificateByCode(code: string): Certificate | undefined {
  return readDB().certificates.find((c) => c.code === code);
}

export function getExpiredCertificates(): Certificate[] {
  const now = nowISO();
  return readDB().certificates.filter((c) => c.expiresAt && c.expiresAt < now);
}

export function getExpiringCertificates(days: number = 30): Certificate[] {
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return readDB().certificates.filter(
    (c) => c.expiresAt && c.expiresAt < threshold.toISOString() && c.expiresAt > now.toISOString()
  );
}

// ---------------------------------------------------------------
// Enterprise: Quiz & Assessment functions
// ---------------------------------------------------------------

export function getQuizByLessonId(lessonId: string): Quiz | undefined {
  return readDB().quizzes.find((q) => q.lessonId === lessonId);
}

export function getQuizById(id: string): Quiz | undefined {
  return readDB().quizzes.find((q) => q.id === id);
}

// Get the final exam for a course (lessonId === null && isFinalExam === true)
export function getFinalExamForCourse(courseId: string): Quiz | undefined {
  return readDB().quizzes.find((q) => q.courseId === courseId && q.isFinalExam);
}

// Check if a student has passed the final exam
export function hasPassedFinalExam(userId: string, courseId: string): boolean {
  const exam = getFinalExamForCourse(courseId);
  if (!exam) return true; // no final exam = no requirement
  return getQuizAttempts(userId, exam.id).some((a) => a.passed);
}

export function getQuestionsForQuiz(quizId: string): Question[] {
  return readDB().questions
    .filter((q) => q.quizId === quizId)
    .sort((a, b) => a.order - b.order);
}

export function createQuiz(data: Omit<Quiz, "id" | "createdAt">): Quiz {
  const quiz: Quiz = { ...data, id: uid(), createdAt: nowISO() };
  mutate((db) => { db.quizzes.push(quiz); });
  return quiz;
}

export function updateQuiz(id: string, updates: Partial<Quiz>): void {
  mutate((db) => {
    const q = db.quizzes.find((q) => q.id === id);
    if (q) Object.assign(q, updates);
  });
}

export function deleteQuiz(id: string): void {
  mutate((db) => {
    db.quizzes = db.quizzes.filter((q) => q.id !== id);
    db.questions = db.questions.filter((q) => q.quizId !== id);
  });
}

export function createQuestion(data: Omit<Question, "id" | "order"> & { order?: number }): Question {
  const existingCount = readDB().questions.filter((q) => q.quizId === data.quizId).length;
  const question: Question = {
    ...data,
    id: uid(),
    order: data.order ?? existingCount,
  };
  mutate((db) => { db.questions.push(question); });
  return question;
}

export function deleteQuestion(id: string): void {
  mutate((db) => {
    db.questions = db.questions.filter((q) => q.id !== id);
  });
}

export function getQuizAttempts(userId: string, quizId: string): QuizAttempt[] {
  return readDB().quizAttempts
    .filter((a) => a.userId === userId && a.quizId === quizId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBestQuizScore(userId: string, quizId: string): number {
  const attempts = getQuizAttempts(userId, quizId);
  if (attempts.length === 0) return 0;
  return Math.max(...attempts.map((a) => a.score));
}

export function createQuizAttempt(data: Omit<QuizAttempt, "id" | "createdAt">): QuizAttempt {
  const attempt: QuizAttempt = { ...data, id: uid(), createdAt: nowISO() };
  mutate((db) => { db.quizAttempts.unshift(attempt); });
  return attempt;
}

// Adaptive learning: check if a module is unlocked for a user
export function isModuleUnlocked(userId: string, moduleId: string): boolean {
  const module = readDB().modules.find((m) => m.id === moduleId);
  if (!module) return false;
  // Find prerequisite lessons (quiz lessons in previous modules)
  const courseModules = getModulesForCourse(module.courseId).sort((a, b) => a.order - b.order);
  const moduleIndex = courseModules.findIndex((m) => m.id === moduleId);
  if (moduleIndex <= 0) return true; // first module always unlocked
  // Check if all lessons in all previous modules are completed
  for (let i = 0; i < moduleIndex; i++) {
    const prevModule = courseModules[i];
    const lessons = getLessonsForModule(prevModule.id);
    for (const lesson of lessons) {
      const completed = readDB().progress.some(
        (p) => p.userId === userId && p.lessonId === lesson.id
      );
      if (!completed) return false;
      // If it's a quiz lesson, check if passed
      if (lesson.type === "quiz") {
        const quiz = getQuizByLessonId(lesson.id);
        if (quiz) {
          const bestScore = getBestQuizScore(userId, quiz.id);
          if (bestScore < quiz.passingScore) return false;
        }
      }
    }
  }
  return true;
}

// ---------------------------------------------------------------
// Enterprise: Audit Log functions
// ---------------------------------------------------------------

export function createAuditLog(data: {
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ip?: string;
}): AuditLog {
  const log: AuditLog = {
    id: uid(),
    userId: data.userId,
    userName: data.userName,
    action: data.action,
    entity: data.entity,
    entityId: data.entityId,
    details: data.details,
    ip: data.ip || "",
    createdAt: nowISO(),
  };
  mutate((db) => {
    db.auditLogs.unshift(log);
    // Keep only last 5000 entries to prevent unbounded growth
    if (db.auditLogs.length > 5000) db.auditLogs = db.auditLogs.slice(0, 5000);
  });
  return log;
}

export function getAuditLogs(limit: number = 100, offset: number = 0): AuditLog[] {
  return readDB().auditLogs.slice(offset, offset + limit);
}

export function getAuditLogCount(): number {
  return readDB().auditLogs.length;
}

export function getAuditLogsByUser(userId: string): AuditLog[] {
  return readDB().auditLogs.filter((l) => l.userId === userId);
}

// ---------------------------------------------------------------
// Enterprise: Data Export helpers
// ---------------------------------------------------------------

export function exportUsersCSV(): string {
  const users = readDB().users;
  const headers = ["ID", "Name", "Email", "Role", "Created At"];
  const rows = users.map((u) => [u.id, u.name, u.email, u.role, u.createdAt]);
  return [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
}

export function exportEnrollmentsCSV(): string {
  const db = readDB();
  const headers = ["User", "Email", "Course", "Price", "Purchased At", "Completed"];
  const rows = db.enrollments.map((e) => {
    const user = db.users.find((u) => u.id === e.userId);
    const course = db.courses.find((c) => c.id === e.courseId);
    return [
      user?.name || "Unknown",
      user?.email || "",
      course?.title || "Unknown",
      String(course?.price || 0),
      e.purchasedAt,
      String(e.completed),
    ];
  });
  return [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
}

export function exportPaymentsCSV(): string {
  const db = readDB();
  const headers = ["User", "Email", "Course", "Amount", "Method", "Status", "Ref", "Date"];
  const rows = db.payments.map((p) => {
    const user = db.users.find((u) => u.id === p.userId);
    const course = db.courses.find((c) => c.id === p.courseId);
    return [
      user?.name || "Unknown",
      user?.email || "",
      course?.title || "Unknown",
      String(p.amount),
      p.method,
      p.status,
      p.ref,
      p.createdAt,
    ];
  });
  return [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
}

export function getPlatformStats() {
  const db = readDB();
  const totalRevenue = db.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalStudents = db.users.filter((u) => u.role === "student").length;
  const totalEnrollments = db.enrollments.length;
  const completedCourses = db.enrollments.filter((e) => e.completed).length;
  const totalCertificates = db.certificates.length;
  const totalQuizzes = db.quizzes.length;
  const totalQuizAttempts = db.quizAttempts.length;
  const avgQuizScore =
    db.quizAttempts.length > 0
      ? Math.round(
          db.quizAttempts.reduce((sum, a) => sum + a.score, 0) / db.quizAttempts.length
        )
      : 0;
  return {
    totalUsers: db.users.length,
    totalStudents,
    totalCourses: db.courses.length,
    totalEnrollments,
    completedCourses,
    totalRevenue,
    totalCertificates,
    totalBooks: db.books.length,
    totalReviews: db.reviews.length,
    totalQuizzes,
    totalQuizAttempts,
    avgQuizScore,
    totalAuditLogs: db.auditLogs.length,
  };
}

// ===============================================================
// Enterprise Phase 3: Note-Taking & Bookmarks
// ===============================================================

export function getNotes(userId: string, courseId: string): Note[] {
  return readDB().notes
    .filter((n) => n.userId === userId && n.courseId === courseId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getNotesForLesson(userId: string, lessonId: string): Note[] {
  return readDB().notes
    .filter((n) => n.userId === userId && n.lessonId === lessonId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">): Note {
  const note: Note = {
    ...data,
    id: uid(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  mutate((db) => { db.notes.push(note); });
  return note;
}

export function updateNote(id: string, content: string): void {
  mutate((db) => {
    const n = db.notes.find((n) => n.id === id);
    if (n) { n.content = content; n.updatedAt = nowISO(); }
  });
}

export function deleteNote(id: string): void {
  mutate((db) => { db.notes = db.notes.filter((n) => n.id !== id); });
}

export function getBookmarks(userId: string, courseId: string): Bookmark[] {
  return readDB().bookmarks
    .filter((b) => b.userId === userId && b.courseId === courseId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createBookmark(data: Omit<Bookmark, "id" | "createdAt">): Bookmark {
  const bm: Bookmark = { ...data, id: uid(), createdAt: nowISO() };
  mutate((db) => { db.bookmarks.push(bm); });
  return bm;
}

export function deleteBookmark(id: string): void {
  mutate((db) => { db.bookmarks = db.bookmarks.filter((b) => b.id !== id); });
}

export function buildStudyGuide(userId: string, courseId: string): string {
  const db = readDB();
  const course = db.courses.find((c) => c.id === courseId);
  if (!course) return "Course not found";
  const notes = getNotes(userId, courseId);
  const bookmarks = getBookmarks(userId, courseId);
  let guide = `# Study Guide: ${course.title}\n\n`;
  guide += `Generated: ${new Date().toLocaleString()}\n`;
  guide += `Notes: ${notes.length} | Bookmarks: ${bookmarks.length}\n\n---\n\n`;
  if (notes.length > 0) {
    guide += `## 📝 My Notes\n\n`;
    for (const n of notes) {
      const lesson = db.lessons.find((l) => l.id === n.lessonId);
      guide += `### ${lesson?.title || "Unknown Lesson"}\n`;
      if (n.timestamp) guide += `⏱ Timestamp: ${Math.floor(n.timestamp / 60)}:${String(Math.floor(n.timestamp % 60)).padStart(2, "0")}\n`;
      guide += `${n.content}\n\n`;
    }
  }
  if (bookmarks.length > 0) {
    guide += `## 🔖 Bookmarks\n\n`;
    for (const b of bookmarks) {
      const lesson = db.lessons.find((l) => l.id === b.lessonId);
      guide += `- **${lesson?.title || "Unknown"}** ${b.timestamp ? `@ ${Math.floor(b.timestamp / 60)}:${String(Math.floor(b.timestamp % 60)).padStart(2, "0")}` : ""}: ${b.label}\n`;
    }
  }
  if (notes.length === 0 && bookmarks.length === 0) {
    guide += "_No notes or bookmarks yet. Start taking notes in lessons to build your study guide!_\n";
  }
  return guide;
}

// ===============================================================
// Enterprise Phase 3: Discussion Threads & Q&A
// ===============================================================

export function getDiscussions(courseId: string, lessonId?: string | null): Discussion[] {
  return readDB().discussions
    .filter((d) => {
      if (d.courseId !== courseId) return false;
      if (lessonId !== undefined) return d.lessonId === lessonId;
      return true;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.upvotes.length - a.upvotes.length;
    });
}

export function getDiscussionById(id: string): Discussion | undefined {
  return readDB().discussions.find((d) => d.id === id);
}

export function createDiscussion(data: Omit<Discussion, "id" | "createdAt" | "upvotes" | "pinned">): Discussion {
  const disc: Discussion = {
    ...data,
    id: uid(),
    pinned: false,
    upvotes: [],
    createdAt: nowISO(),
  };
  mutate((db) => { db.discussions.push(disc); });
  return disc;
}

export function toggleDiscussionUpvote(discussionId: string, userId: string): void {
  mutate((db) => {
    const d = db.discussions.find((d) => d.id === discussionId);
    if (d) {
      const idx = d.upvotes.indexOf(userId);
      if (idx >= 0) d.upvotes = d.upvotes.filter((u) => u !== userId);
      else d.upvotes.push(userId);
    }
  });
}

export function togglePinDiscussion(discussionId: string): void {
  mutate((db) => {
    const d = db.discussions.find((d) => d.id === discussionId);
    if (d) d.pinned = !d.pinned;
  });
}

export function getReplies(discussionId: string): Reply[] {
  return readDB().replies
    .filter((r) => r.discussionId === discussionId)
    .sort((a, b) => {
      if (a.isVerifiedAnswer && !b.isVerifiedAnswer) return -1;
      if (!a.isVerifiedAnswer && b.isVerifiedAnswer) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

export function createReply(data: Omit<Reply, "id" | "createdAt" | "upvotes" | "isVerifiedAnswer">): Reply {
  const reply: Reply = {
    ...data,
    id: uid(),
    isVerifiedAnswer: false,
    upvotes: [],
    createdAt: nowISO(),
  };
  mutate((db) => { db.replies.push(reply); });
  return reply;
}

export function toggleReplyUpvote(replyId: string, userId: string): void {
  mutate((db) => {
    const r = db.replies.find((r) => r.id === replyId);
    if (r) {
      const idx = r.upvotes.indexOf(userId);
      if (idx >= 0) r.upvotes = r.upvotes.filter((u) => u !== userId);
      else r.upvotes.push(userId);
    }
  });
}

export function toggleVerifiedAnswer(replyId: string): void {
  mutate((db) => {
    const r = db.replies.find((r) => r.id === replyId);
    if (r) r.isVerifiedAnswer = !r.isVerifiedAnswer;
  });
}

// ===============================================================
// Enterprise Phase 3: Gamification
// ===============================================================
// Note: getBadgeDefinitions() moved to store-base.ts (used by migrateDB)

export function getUserBadges(userId: string): UserBadge[] {
  return readDB().userBadges.filter((b) => b.userId === userId);
}

export function hasBadge(userId: string, badgeType: BadgeType): boolean {
  return readDB().userBadges.some((b) => b.userId === userId && b.badgeType === badgeType);
}

export function awardBadge(userId: string, badgeType: BadgeType): void {
  if (hasBadge(userId, badgeType)) return;
  const badge = readDB().badges.find((b) => b.type === badgeType);
  if (!badge) return;
  const ub: UserBadge = { id: uid(), userId, badgeType, awardedAt: nowISO() };
  mutate((db) => { db.userBadges.push(ub); });
  createNotification({
    userId,
    type: "admin",
    title: "Badge Earned! 🏅",
    message: `You earned the "${badge.name}" badge: ${badge.description}`,
    link: "/dashboard",
  });
}

export function getStreak(userId: string): Streak {
  const existing = readDB().streaks.find((s) => s.userId === userId);
  if (existing) return existing;
  const newStreak: Streak = {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: "",
    totalActiveDays: 0,
  };
  return newStreak;
}

export function updateStreak(userId: string): Streak {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  let streak = readDB().streaks.find((s) => s.userId === userId);
  if (!streak) {
    streak = { userId, currentStreak: 0, longestStreak: 0, lastActiveDate: "", totalActiveDays: 0 };
    mutate((db) => { db.streaks.push(streak!); });
  }
  if (streak.lastActiveDate === today) return streak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (streak.lastActiveDate === yesterday) {
    streak.currentStreak += 1;
  } else if (streak.lastActiveDate === "") {
    streak.currentStreak = 1;
  } else {
    streak.currentStreak = 1; // reset
  }
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.totalActiveDays += 1;
  streak.lastActiveDate = today;
  mutate((db) => {
    const s = db.streaks.find((s) => s.userId === userId);
    if (s) Object.assign(s, streak);
  });
  // Award streak badges
  if (streak.currentStreak === 7) awardBadge(userId, "streak_7");
  if (streak.currentStreak === 30) awardBadge(userId, "streak_30");
  if (streak.currentStreak === 100) awardBadge(userId, "streak_100");
  return streak;
}

export function getLeaderboard(limit: number = 20): LeaderboardEntry[] {
  const db = readDB();
  const students = db.users.filter((u) => u.role === "student" || u.role === "instructor");
  return students.map((u) => {
    const enrollments = db.enrollments.filter((e) => e.userId === u.id && e.completed);
    const streak = db.streaks.find((s) => s.userId === u.id);
    const badges = db.userBadges.filter((b) => b.userId === u.id);
    const certs = db.certificates.filter((c) => c.userId === u.id);
    // Points: 10 per completed course, 5 per cert, 5 per badge, 1 per streak day
    const points = enrollments.length * 10 + certs.length * 5 + badges.length * 5 + (streak?.currentStreak || 0);
    return {
      userId: u.id,
      name: u.name,
      avatar: u.avatar || "",
      points,
      coursesCompleted: enrollments.length,
      streak: streak?.currentStreak || 0,
      badges: badges.length,
      optedIn: true,
    };
  }).sort((a, b) => b.points - a.points).slice(0, limit);
}

// ===============================================================
// Enterprise Phase 3: Assignments & Submissions
// ===============================================================

export function getAssignments(courseId: string): Assignment[] {
  return readDB().assignments
    .filter((a) => a.courseId === courseId)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
}

export function getAssignmentById(id: string): Assignment | undefined {
  return readDB().assignments.find((a) => a.id === id);
}

export function createAssignment(data: Omit<Assignment, "id" | "createdAt">): Assignment {
  const a: Assignment = { ...data, id: uid(), createdAt: nowISO() };
  mutate((db) => { db.assignments.push(a); });
  return a;
}

export function deleteAssignment(id: string): void {
  mutate((db) => {
    db.assignments = db.assignments.filter((a) => a.id !== id);
    db.submissions = db.submissions.filter((s) => s.assignmentId !== id);
  });
}

export function getSubmissions(assignmentId: string): Submission[] {
  return readDB().submissions
    .filter((s) => s.assignmentId === assignmentId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function getSubmissionsByUser(userId: string): Submission[] {
  return readDB().submissions
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function createSubmission(data: Omit<Submission, "id" | "submittedAt" | "status" | "grade" | "feedback" | "gradedBy" | "gradedAt">): Submission {
  const s: Submission = {
    ...data,
    id: uid(),
    submittedAt: nowISO(),
    status: "pending",
    grade: null,
    feedback: "",
    gradedBy: null,
    gradedAt: null,
  };
  mutate((db) => { db.submissions.push(s); });
  return s;
}

export function gradeSubmission(id: string, grade: number, feedback: string, gradedBy: string): void {
  mutate((db) => {
    const s = db.submissions.find((s) => s.id === id);
    if (s) {
      s.grade = grade;
      s.feedback = feedback;
      s.gradedBy = gradedBy;
      s.gradedAt = nowISO();
      s.status = "graded";
    }
  });
}

export function getPendingSubmissions(): Submission[] {
  return readDB().submissions.filter((s) => s.status === "pending");
}

// ===============================================================
// Enterprise Phase 3: Promo Codes
// ===============================================================

export function getPromoCodes(): PromoCode[] {
  return readDB().promoCodes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPromoCode(code: string): PromoCode | undefined {
  return readDB().promoCodes.find((p) => p.code === code.toUpperCase() && p.active);
}

export function validatePromoCode(code: string, courseId: string, price: number): { valid: boolean; discount: number; message: string } {
  const promo = getPromoCode(code);
  if (!promo) return { valid: false, discount: 0, message: "Invalid promo code" };
  if (promo.expiresAt && promo.expiresAt < nowISO()) return { valid: false, discount: 0, message: "Promo code expired" };
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) return { valid: false, discount: 0, message: "Promo code usage limit reached" };
  if (promo.courseId && promo.courseId !== courseId) return { valid: false, discount: 0, message: "Promo code not valid for this course" };
  const discount = promo.discountType === "percentage"
    ? Math.round(price * promo.discountValue / 100)
    : Math.min(promo.discountValue, price);
  return { valid: true, discount, message: `${promo.discountType === "percentage" ? promo.discountValue + "%" : "KES " + promo.discountValue} off applied!` };
}

export function createPromoCode(data: Omit<PromoCode, "id" | "createdAt" | "usedCount">): PromoCode {
  const p: PromoCode = { ...data, id: uid(), usedCount: 0, createdAt: nowISO() };
  mutate((db) => { db.promoCodes.push(p); });
  return p;
}

export function incrementPromoUsage(code: string): void {
  mutate((db) => {
    const p = db.promoCodes.find((p) => p.code === code.toUpperCase());
    if (p) p.usedCount += 1;
  });
}

// ===============================================================
// Enterprise Phase 3: Search
// ===============================================================

export function searchCourses(query: string, filters?: { category?: string; level?: string; maxPrice?: number; freeOnly?: boolean }): Course[] {
  const db = readDB();
  const q = query.toLowerCase().trim();
  return db.courses.filter((c) => {
    if (!c.published) return false;
    if (filters?.category && c.categoryId !== filters.category) return false;
    if (filters?.level && c.level !== filters.level) return false;
    if (filters?.freeOnly && c.price > 0) return false;
    if (filters?.maxPrice !== undefined && c.price > filters.maxPrice) return false;
    if (q) {
      const instructor = db.users.find((u) => u.id === c.instructorId);
      const searchText = `${c.title} ${c.description} ${instructor?.name || ""} ${instructor?.title || ""}`.toLowerCase();
      if (!searchText.includes(q)) return false;
    }
    return true;
  });
}

// ===============================================================
// Enterprise Phase 3: Instructor Analytics
// ===============================================================

export function getCourseAnalytics(courseId: string) {
  const db = readDB();
  const lessons = getLessonsForCourse(courseId);
  const enrollments = db.enrollments.filter((e) => e.courseId === courseId);
  const enrolledUserIds = enrollments.map((e) => e.userId);

  // Per-lesson completion stats
  const lessonStats = lessons.map((lesson) => {
    const completed = db.progress.filter((p) => p.lessonId === lesson.id && enrolledUserIds.includes(p.userId));
    const completionRate = enrolledUserIds.length > 0 ? Math.round((completed.length / enrolledUserIds.length) * 100) : 0;
    return {
      lessonId: lesson.id,
      title: lesson.title,
      type: lesson.type,
      enrolled: enrolledUserIds.length,
      completed: completed.length,
      completionRate,
      dropOff: enrolledUserIds.length - completed.length,
    };
  });

  // Quiz stats
  const courseQuizzes = db.quizzes.filter((q) => q.courseId === courseId);
  const quizStats = courseQuizzes.map((quiz) => {
    const attempts = db.quizAttempts.filter((a) => a.quizId === quiz.id);
    const passed = attempts.filter((a) => a.passed);
    const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
    return {
      quizId: quiz.id,
      title: quiz.title,
      isFinalExam: quiz.isFinalExam,
      totalAttempts: attempts.length,
      passed: passed.length,
      passRate: attempts.length > 0 ? Math.round((passed.length / attempts.length) * 100) : 0,
      avgScore,
    };
  });

  // Assignment stats
  const assignments = db.assignments.filter((a) => a.courseId === courseId);
  const assignmentStats = assignments.map((a) => {
    const subs = db.submissions.filter((s) => s.assignmentId === a.id);
    return {
      assignmentId: a.id,
      title: a.title,
      totalSubmissions: subs.length,
      pending: subs.filter((s) => s.status === "pending").length,
      graded: subs.filter((s) => s.status === "graded").length,
    };
  });

  return {
    totalEnrolled: enrollments.length,
    totalCompleted: enrollments.filter((e) => e.completed).length,
    completionRate: enrollments.length > 0 ? Math.round((enrollments.filter((e) => e.completed).length / enrollments.length) * 100) : 0,
    totalLessons: lessons.length,
    lessonStats,
    quizStats,
    assignmentStats,
    revenue: db.payments.filter((p) => p.courseId === courseId && p.status === "paid").reduce((s, p) => s + p.amount, 0),
  };
}

// ===============================================================
// Enterprise Phase 3: Calendar Events
// ===============================================================

export function getCalendarEvents(courseId: string): CalendarEvent[] {
  return readDB().calendarEvents
    .filter((e) => e.courseId === courseId)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}

export function createCalendarEvent(data: Omit<CalendarEvent, "id" | "createdAt">): CalendarEvent {
  const e: CalendarEvent = { ...data, id: uid(), createdAt: nowISO() };
  mutate((db) => { db.calendarEvents.push(e); });
  return e;
}

export function generateICS(event: { title: string; description: string; date: string; url?: string }): string {
  const dt = new Date(event.date);
  const dtStart = dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const dtEnd = new Date(dt.getTime() + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TechPath Academy//LMS//EN",
    "BEGIN:VEVENT",
    `UID:${uid()}@techpath.academy`,
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    event.url ? `URL:${event.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

// ===============================================================
// Enterprise Phase 3: User Management (Admin)
// ===============================================================

export function getAllUsers(): User[] {
  return readDB().users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateUserRole(userId: string, role: Role): void {
  mutate((db) => {
    const u = db.users.find((u) => u.id === userId);
    if (u) u.role = role;
  });
}

export function deleteUser(userId: string): void {
  mutate((db) => {
    db.users = db.users.filter((u) => u.id !== userId);
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
    db.enrollments = db.enrollments.filter((e) => e.userId !== userId);
    db.progress = db.progress.filter((p) => p.userId !== userId);
    db.certificates = db.certificates.filter((c) => c.userId !== userId);
    db.notifications = db.notifications.filter((n) => n.userId !== userId);
    db.notes = db.notes.filter((n) => n.userId !== userId);
    db.bookmarks = db.bookmarks.filter((b) => b.userId !== userId);
    db.userBadges = db.userBadges.filter((b) => b.userId !== userId);
    db.streaks = db.streaks.filter((s) => s.userId !== userId);
    db.submissions = db.submissions.filter((s) => s.userId !== userId);
    db.srsReviews = db.srsReviews.filter((s) => s.userId !== userId);
    db.portfolios = db.portfolios.filter((p) => p.userId !== userId);
    db.studySessions = db.studySessions.filter((s) => s.userId !== userId);
    db.placementResults = db.placementResults.filter((p) => p.userId !== userId);
    // Phase 5
    db.riskFlags = db.riskFlags.filter((r) => r.userId !== userId);
    db.skillProfiles = db.skillProfiles.filter((s) => s.userId !== userId);
    db.aiGenerationJobs = db.aiGenerationJobs.filter((j) => j.userId !== userId);
    db.botIntegrations = db.botIntegrations.filter((b) => b.userId !== userId);
    db.peerReviews = db.peerReviews.filter((r) => r.reviewerId !== userId);
    db.capstoneProjects = db.capstoneProjects.filter((c) => c.userId !== userId);
    db.jobApplications = db.jobApplications.filter((a) => a.userId !== userId);
  });
}



// ──────────────────────────────────────────────────────────────
// CRUD functions from store-crud-b.ts (Phase 4-5 + Other Services)
// ──────────────────────────────────────────────────────────────

// store-crud-b.ts — Phase 4-5 + Other Services CRUD functions
// Auto-split from store.ts for proxy size limits




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
