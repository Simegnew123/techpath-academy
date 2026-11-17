import {
  readDB, mutate, writeDB, uid, nowISO,
  type Course, type Module, type Lesson, type Review, type Certificate, type Enrollment,
  getLessonsForCourse, getModulesForCourse, getEnrollment,
  generateCertCode, getCertificate, getCompletionPercent, generateCertHash,
} from "./store";
import { CATEGORIES, getCategoryByName } from "./categories";

export { CATEGORIES, getCategoryByName };
export { getLessonsForCourse, getModulesForCourse, getEnrollment, getCompletionPercent, getCertificate, generateCertCode };

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function uniqueSlug(base: string, excludeId?: string): string {
  const db = readDB();
  let slug = slugify(base) || "course";
  let candidate = slug;
  let n = 2;
  while (db.courses.some((c) => c.slug === candidate && c.id !== excludeId)) {
    candidate = `${slug}-${n++}`;
  }
  return candidate;
}

// ---------------- Courses ----------------

export function getCourses(): Course[] {
  return readDB().courses;
}

export function getCourseBySlug(slug: string): Course | undefined {
  return readDB().courses.find((c) => c.slug === slug);
}

export function getCourseById(id: string): Course | undefined {
  return readDB().courses.find((c) => c.id === id);
}

export function createCourse(data: {
  title: string;
  categoryId: string;
  description: string;
  coverImage: string;
  price: number;
  slug?: string;
  published?: boolean;
  instructorId?: string;
  level?: Course["level"];
  language?: string;
}): Course {
  const course: Course = {
    id: uid(),
    slug: uniqueSlug(data.slug && data.slug.trim() ? data.slug : data.title),
    title: data.title,
    categoryId: data.categoryId,
    description: data.description,
    coverImage: data.coverImage,
    price: Number(data.price) || 0,
    published: data.published ?? false,
    instructorId: data.instructorId || "",
    level: data.level || "Beginner",
    language: data.language || "English",
    createdAt: nowISO(),
    prerequisiteCourseIds: [],
  };
  mutate((db) => {
    db.courses.push(course);
  });
  return course;
}

export function updateCourse(
  id: string,
  data: Partial<Course>
): Course | undefined {
  const db = readDB();
  const course = db.courses.find((c) => c.id === id);
  if (!course) return undefined;
  if (data.title !== undefined) course.title = data.title;
  if (data.slug !== undefined) course.slug = uniqueSlug(data.slug, id);
  if (data.categoryId !== undefined) course.categoryId = data.categoryId;
  if (data.description !== undefined) course.description = data.description;
  if (data.coverImage !== undefined) course.coverImage = data.coverImage;
  if (data.price !== undefined) course.price = Number(data.price) || 0;
  if (data.published !== undefined) course.published = data.published;
  if (data.instructorId !== undefined) course.instructorId = data.instructorId;
  if (data.level !== undefined) course.level = data.level;
  if (data.language !== undefined) course.language = data.language;
  writeDB(db);
  return course;
}

export function deleteCourse(id: string): void {
  mutate((db) => {
    db.courses = db.courses.filter((c) => c.id !== id);
    db.modules = db.modules.filter((m) => m.courseId !== id);
    db.lessons = db.lessons.filter((l) => l.courseId !== id);
    db.enrollments = db.enrollments.filter((e) => e.courseId !== id);
    db.reviews = db.reviews.filter((r) => r.courseId !== id);
    db.certificates = db.certificates.filter((c) => c.courseId !== id);
  });
}

// ---------------- Modules ----------------

export function createModule(courseId: string, title: string, order?: number): Module {
  const modules = getModulesForCourse(courseId);
  const mod: Module = {
    id: uid(),
    courseId,
    title,
    order: order ?? modules.length + 1,
  };
  mutate((db) => { db.modules.push(mod); });
  return mod;
}

export function updateModule(id: string, data: Partial<Module>): Module | undefined {
  const db = readDB();
  const mod = db.modules.find((m) => m.id === id);
  if (!mod) return undefined;
  if (data.title !== undefined) mod.title = data.title;
  if (data.order !== undefined) mod.order = data.order;
  writeDB(db);
  return mod;
}

export function deleteModule(id: string): void {
  mutate((db) => {
    db.modules = db.modules.filter((m) => m.id !== id);
    db.lessons = db.lessons.filter((l) => l.moduleId !== id);
  });
}

// ---------------- Lessons ----------------

export function getLessons(courseId: string): Lesson[] {
  return getLessonsForCourse(courseId);
}

export function getLesson(id: string): Lesson | undefined {
  return readDB().lessons.find((l) => l.id === id);
}

export function addLesson(data: {
  moduleId: string;
  courseId: string;
  title: string;
  type?: Lesson["type"];
  videoUrl: string;
  content: string;
  duration?: number;
  preview?: boolean;
}): Lesson {
  const db = readDB();
  const order = db.lessons.filter((l) => l.moduleId === data.moduleId).length + 1;
  const lesson: Lesson = {
    id: uid(),
    moduleId: data.moduleId,
    courseId: data.courseId,
    order,
    title: data.title,
    type: data.type || "text",
    videoUrl: data.videoUrl,
    content: data.content,
    duration: data.duration || 0,
    preview: data.preview ?? false,
  };
  mutate((db) => { db.lessons.push(lesson); });
  return lesson;
}

// ---- CTF Challenge helper ----
export function createCTFChallenge(data: {
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  category: "crypto" | "forensics" | "network" | "web" | "linux" | "reverse" | "misc";
  difficulty: "easy" | "medium" | "hard" | "expert";
  flag: string;            // plain-text flag — hashed before storage
  points: number;
  hint: string;
  maxAttempts: number;
}): void {
  const crypto = require("crypto");
  const flagHash = crypto.createHash("sha256").update(data.flag.trim().toLowerCase()).digest("hex");
  mutate((db) => {
    db.ctfChallenges.push({
      id: uid(),
      lessonId: data.lessonId,
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
      flagHash,
      points: data.points,
      hint: data.hint,
      maxAttempts: data.maxAttempts,
      solveCount: 0,
      createdAt: nowISO(),
    });
  });
}

// ---- Lab Config helper ----
export function createLabConfig(data: {
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  type: "terminal" | "network_sim" | "packet_capture" | "firewall_config" | "cli_challenge";
  environment: string;
  timeLimit: number;
  steps: { instruction: string; expectedCommand: string; hint: string }[];
  commands: { command: string; output: string; success?: boolean }[];
}): void {
  mutate((db) => {
    db.labConfigs.push({
      id: uid(),
      lessonId: data.lessonId,
      courseId: data.courseId,
      type: data.type,
      title: data.title,
      description: data.description,
      commands: data.commands.map((c) => ({ command: c.command, output: c.output, success: c.success ?? true })),
      steps: data.steps.map((s) => ({ instruction: s.instruction, expectedCommand: s.expectedCommand, hint: s.hint, completed: false })),
      environment: data.environment,
      timeLimit: data.timeLimit,
      createdAt: nowISO(),
    });
  });
}

export function updateLesson(id: string, data: Partial<Lesson>): Lesson | undefined {
  const db = readDB();
  const lesson = db.lessons.find((l) => l.id === id);
  if (!lesson) return undefined;
  Object.assign(lesson, data);
  writeDB(db);
  return lesson;
}

export function deleteLesson(id: string): void {
  mutate((db) => {
    db.lessons = db.lessons.filter((l) => l.id !== id);
  });
}

// ---------------- Enrollment / Progress ----------------

export function hasAccess(userId: string, course: Course): boolean {
  if (course.price === 0) return true;
  return readDB().enrollments.some(
    (e) => e.userId === userId && e.courseId === course.id
  );
}

export function enroll(userId: string, courseId: string, paymentRef: string): Enrollment {
  const db = readDB();
  const existing = db.enrollments.find(
    (e) => e.userId === userId && e.courseId === courseId
  );
  if (existing) return existing;
  const enr: Enrollment = {
    id: uid(),
    userId,
    courseId,
    purchasedAt: nowISO(),
    paymentRef,
    completed: false,
    completedAt: null,
  };
  db.enrollments.push(enr);
  writeDB(db);
  return enr;
}

export function getEnrollments(userId: string) {
  return readDB().enrollments.filter((e) => e.userId === userId);
}

export function isLessonCompleted(userId: string, lessonId: string): boolean {
  return readDB().progress.some(
    (p) => p.userId === userId && p.lessonId === lessonId
  );
}

export function markLessonCompleted(userId: string, lessonId: string): void {
  const db = readDB();
  if (!db.progress.some((p) => p.userId === userId && p.lessonId === lessonId)) {
    db.progress.push({ userId, lessonId, completedAt: nowISO() });
    // Check if course is now complete
    const lesson = db.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      const allLessons = getLessonsForCourse(lesson.courseId);
      const completed = db.progress.filter(
        (p) => p.userId === userId && allLessons.some((l) => l.id === p.lessonId)
      );
      if (completed.length >= allLessons.length && allLessons.length > 0) {
        const enr = db.enrollments.find(
          (e) => e.userId === userId && e.courseId === lesson.courseId
        );
        if (enr && !enr.completed) {
          enr.completed = true;
          enr.completedAt = nowISO();
        }
        // Auto-generate certificate
        const existingCert = getCertificate(userId, lesson.courseId);
        if (!existingCert) {
          const certCode = generateCertCode();
          const issuedAt = nowISO();
          db.certificates.push({
            id: uid(),
            userId,
            courseId: lesson.courseId,
            code: certCode,
            hash: generateCertHash(certCode, userId, lesson.courseId, issuedAt),
            skills: [],
            issuedAt,
            expiresAt: null,
          });
        }
      }
    }
    writeDB(db);
  }
}

export function countCompleted(userId: string, courseId: string): number {
  const lessons = getLessonsForCourse(courseId);
  const lessonIds = new Set(lessons.map((l) => l.id));
  return readDB().progress.filter(
    (p) => p.userId === userId && lessonIds.has(p.lessonId)
  ).length;
}

// ---------------- Reviews ----------------

export function addReview(data: {
  courseId: string;
  userId: string;
  rating: number;
  comment: string;
}): Review {
  const review: Review = {
    id: uid(),
    courseId: data.courseId,
    userId: data.userId,
    rating: Math.max(1, Math.min(5, data.rating)),
    comment: data.comment,
    createdAt: nowISO(),
  };
  mutate((db) => { db.reviews.push(review); });
  return review;
}

export function hasReviewed(userId: string, courseId: string): boolean {
  return readDB().reviews.some(
    (r) => r.userId === userId && r.courseId === courseId
  );
}

// ---------------- Certificates ----------------

export function issueCertificate(userId: string, courseId: string): Certificate | undefined {
  const existing = getCertificate(userId, courseId);
  if (existing) return existing;
  const pct = getCompletionPercent(userId, courseId);
  if (pct < 100) return undefined;
  const certCode = generateCertCode();
  const issuedAt = nowISO();
  const cert: Certificate = {
    id: uid(),
    userId,
    courseId,
    code: certCode,
    hash: generateCertHash(certCode, userId, courseId, issuedAt),
    skills: [],
    issuedAt,
    expiresAt: null,
  };
  mutate((db) => { db.certificates.push(cert); });
  return cert;
}

// ---------------- Helpers ----------------

export function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `KSh ${price.toLocaleString()}`;
}

export function formatDuration(minutes: number): string {
  if (minutes === 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getTotalDuration(courseId: string): number {
  return getLessonsForCourse(courseId).reduce((sum, l) => sum + (l.duration || 0), 0);
}

export function getLessonCount(courseId: string): number {
  return getLessonsForCourse(courseId).length;
}

export function getRelatedCourses(
  courseId: string,
  categoryId: string,
  limit = 3
): Course[] {
  return readDB()
    .courses.filter(
      (c) =>
        c.id !== courseId &&
        c.published &&
        c.categoryId === categoryId
    )
    .slice(0, limit);
}
