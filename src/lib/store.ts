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

export function getBadgeDefinitions(): Badge[] {
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
  });
}
