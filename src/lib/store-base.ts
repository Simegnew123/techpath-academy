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
};

export type Module = {
  id: string;
  courseId: string;
  title: string;
  order: number;
};

export type LessonType = "video" | "text" | "quiz" | "pdf";

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
