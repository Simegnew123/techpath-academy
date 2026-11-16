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
  lessonId: string;            // FK -> lessons.id (quiz-type lesson)
  courseId: string;            // denormalized
  title: string;
  description: string;
  passingScore: number;        // percentage 0-100
  maxAttempts: number;         // 0 = unlimited
  shuffleQuestions: boolean;
  timeLimit: number;           // minutes, 0 = no limit
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
