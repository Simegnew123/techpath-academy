import { NextRequest, NextResponse } from "next/server";
import { getLesson, hasAccess, markLessonCompleted, getLessonsForCourse, getCompletionPercent } from "@/lib/courses";
import { readDB, writeDB, getCourseById, createNotification, generateCertCode, generateCertHash, notifyAdmins, uid, nowISO, getFinalExamForCourse } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { sendCourseCompletionEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const body = await req.json().catch(() => null);
  const completed = body?.completed !== false;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const lesson = getLesson(lessonId);
  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const course = getCourseById(lesson.courseId);
  if (!course || !hasAccess(user.id, course)) {
    return NextResponse.json({ error: "No access to this course." }, { status: 403 });
  }

  if (completed) {
    markLessonCompleted(user.id, lessonId);
  } else {
    const db = readDB();
    db.progress = db.progress.filter(
      (p) => !(p.userId === user.id && p.lessonId === lessonId)
    );
    // Also un-complete the enrollment
    const enr = db.enrollments.find(
      (e) => e.userId === user.id && e.courseId === lesson.courseId
    );
    if (enr) {
      enr.completed = false;
      enr.completedAt = null;
    }
    writeDB(db);
  }

  const totalLessons = getLessonsForCourse(lesson.courseId).length;
  const completion = getCompletionPercent(user.id, lesson.courseId);

  // Lesson complete notification
  if (completed) {
    createNotification({
      userId: user.id,
      type: "lesson_complete",
      title: `✅ Lesson completed: ${lesson.title}`,
      message: `Great progress! You're ${completion}% through "${course.title}".`,
      link: `/courses/${course.slug}/chapters`,
    });
  }

  // Certificate generation on 100% completion
  // BUT if a final exam exists, certificate is issued only after exam pass (not here)
  if (completion === 100 && completed) {
    const finalExam = getFinalExamForCourse(course.id);
    const db = readDB();
    const existingCert = db.certificates.find(
      (c) => c.userId === user.id && c.courseId === course.id
    );

    if (!existingCert && !finalExam) {
      // No final exam → auto-issue certificate on 100% lesson completion
      // Create enhanced certificate with hash + skills
      const certCode = generateCertCode();
      const issuedAt = new Date().toISOString();
      const certHash = generateCertHash(certCode, user.id, course.id, issuedAt);
      // Derive skills from course category + level
      const categoryMap: Record<string, string[]> = {
        "cat-it-support": ["Hardware Troubleshooting", "Operating Systems", "Customer Service"],
        "cat-networking": ["Network Configuration", "Routing & Switching", "TCP/IP"],
        "cat-database": ["SQL", "Database Design", "Data Management"],
        "cat-cyber-security": ["Security Fundamentals", "Threat Analysis", "Risk Management"],
        "cat-ethical-hacking": ["Penetration Testing", "Vulnerability Assessment", "Network Security"],
        "cat-ai": ["Machine Learning", "AI Fundamentals", "Data Analysis"],
      };
      const skills = categoryMap[course.categoryId] || [course.level, "Professional Skills"];

      const cert = {
        id: uid(),
        userId: user.id,
        courseId: course.id,
        code: certCode,
        hash: certHash,
        skills,
        issuedAt,
        expiresAt: null, // No expiry by default
      };
      writeDB({
        ...db,
        certificates: [...db.certificates, cert],
      });

      // Mark enrollment as completed
      const enr = readDB().enrollments.find(
        (e) => e.userId === user.id && e.courseId === course.id
      );
      if (enr) {
        const db2 = readDB();
        db2.enrollments = db2.enrollments.map((e) =>
          e.id === enr.id
            ? { ...e, completed: true, completedAt: new Date().toISOString() }
            : e
        );
        writeDB(db2);
      }

      // Certificate notification
      createNotification({
        userId: user.id,
        type: "certificate",
        title: `🏅 Certificate earned!`,
        message: `Congratulations! You completed "${course.title}". Your certificate is ready to view and download.`,
        link: `/certificates/${cert.code}`,
      });

      // Notify admins
      notifyAdmins(
        "Certificate issued",
        `${user.name} completed "${course.title}" and earned a certificate (Code: ${cert.code}).`,
        `/certificates/${cert.code}`
      );

      // Send course completion email (non-blocking)
      sendCourseCompletionEmail(user.name, user.email, course.title, course.slug, cert.code).catch(() => {});
    } else if (!existingCert && finalExam) {
      // 100% lessons done but final exam required → notify student
      createNotification({
        userId: user.id,
        type: "lesson_complete",
        title: "📋 Final Exam Required",
        message: `You've completed all lessons in "${course.title}"! Take the final exam to earn your certificate.`,
        link: `/courses/${course.slug}/exam`,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    completed,
    completionPercent: completion,
    totalLessons,
    courseCompleted: completion === 100,
  });
}
