import fs from "fs";
import path from "path";

// ---------------------------------------------------------------
// Simple JSON file database — data lives in ./data/db.json
// Perfect for a small business. Can be swapped for a real DB later.
// Schema based on LMS Database Schema ERD.
// ---------------------------------------------------------------

export type Role = "student" | "instructor" | "admin";

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
  issuedAt: string;
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
