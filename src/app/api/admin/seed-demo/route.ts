import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mutate, readDB, generateCertCode, generateCertHash, uid } from "@/lib/store";
import { hashSync } from "bcryptjs";

const now = () => new Date().toISOString();

// POST /api/admin/seed-demo — seed demo students, enrollments, quiz attempts, certificates
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDB();
  const courses = db.courses.filter((c) => c.published);
  if (courses.length === 0) {
    return NextResponse.json({ error: "No courses available to seed." }, { status: 400 });
  }

  // Demo student accounts
  const demoStudents = [
    { id: "demo-sara", name: "Sara Mengistu", email: "sara.mengistu@example.com" },
    { id: "demo-david", name: "David Kebede", email: "david.kebede@example.com" },
    { id: "demo-elena", name: "Elena Tadesse", email: "elena.tadesse@example.com" },
    { id: "demo-james", name: "James Wolde", email: "james.wolde@example.com" },
    { id: "demo-maria", name: "Maria Hailu", email: "maria.hailu@example.com" },
  ];

  const demoPassword = hashSync("demo1234", 10);
  const course1 = courses[0];

  // Add students if they don't exist
  for (const s of demoStudents) {
    if (!db.users.find((u) => u.id === s.id)) {
      db.users.push({
        id: s.id,
        name: s.name,
        email: s.email,
        passwordHash: demoPassword,
        role: "student",
        bio: "",
        avatar: "",
        title: "",
        createdAt: now(),
        securityQuestion: "",
        securityAnswerHash: "",
        mfaEnabled: false,
        mfaSecret: "",
      });
    }
  }

  // Create enrollments
  for (const s of demoStudents) {
    const exists = db.enrollments.find((e) => e.userId === s.id && e.courseId === course1.id);
    if (!exists) {
      db.enrollments.push({
        id: uid(),
        userId: s.id,
        courseId: course1.id,
        purchasedAt: now(),
        paymentRef: "",
        completed: false,
        completedAt: null,
      });
    }
  }

  // Create some quiz attempts
  for (let i = 0; i < 3; i++) {
    const score = Math.floor(Math.random() * 40) + 60;
    db.quizAttempts.push({
      id: uid(),
      quizId: `quiz-${course1.id}-${i}`,
      userId: demoStudents[i].id,
      answers: [],
      score,
      passed: score >= 70,
      timeTakenSec: Math.floor(Math.random() * 300) + 60,
      violations: 0,
      createdAt: now(),
    });
  }

  // Create some certificates
  for (let i = 0; i < 3; i++) {
    const certExists = db.certificates.find((c) => c.userId === demoStudents[i].id && c.courseId === course1.id);
    if (!certExists) {
      const code = generateCertCode();
      const hash = generateCertHash(code, demoStudents[i].id, course1.id, now());
      db.certificates.push({
        id: uid(),
        userId: demoStudents[i].id,
        courseId: course1.id,
        code,
        hash,
        skills: ["IT Fundamentals", "Troubleshooting"],
        issuedAt: now(),
        expiresAt: null,
      });
    }
  }

  // Add some reviews
  for (let i = 0; i < 2; i++) {
    const reviewId = `review-${demoStudents[i].id}-${course1.id}`;
    if (!db.reviews.find((r) => r.id === reviewId)) {
      db.reviews.push({
        id: reviewId,
        courseId: course1.id,
        userId: demoStudents[i].id,
        rating: Math.floor(Math.random() * 2) + 4,
        comment: ["Great course! Highly recommended.", "Very practical and well-structured."][i],
        createdAt: now(),
      });
    }
  }

  // Persist
  mutate((d) => {
    d.users = db.users;
    d.enrollments = db.enrollments;
    d.quizAttempts = db.quizAttempts;
    d.certificates = db.certificates;
    d.reviews = db.reviews;
  });

  return NextResponse.json({
    success: true,
    seededStudents: demoStudents.length,
    message: "Demo data seeded successfully!",
  });
}
