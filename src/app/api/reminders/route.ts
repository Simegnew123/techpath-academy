import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getExpiringCertificates,
  getExpiredCertificates,
  readDB,
  createNotification,
  createAuditLog,
} from "@/lib/store";
import { getCourseById } from "@/lib/courses";

// POST /api/reminders/check — Admin/cron trigger to send recertification reminders
// This endpoint checks for certificates expiring within 30 days and sends notifications
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const db = readDB();
  let notified = 0;

  // 1. Certificates expiring within 30 days
  const expiring = getExpiringCertificates(30);
  for (const cert of expiring) {
    const certUser = db.users.find((u) => u.id === cert.userId);
    const course = getCourseById(cert.courseId);
    if (!certUser || !course) continue;

    // Check if we already sent a reminder (look for existing notification)
    const existingNotif = db.notifications.find(
      (n) =>
        n.userId === cert.userId &&
        n.type === "recertification" &&
        n.link === `/courses/${course.slug}` &&
        new Date(n.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 // within last 7 days
    );
    if (existingNotif) continue; // Don't spam

    const expiryDate = new Date(cert.expiresAt!).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    createNotification({
      userId: cert.userId,
      type: "recertification",
      title: "⏰ Certificate expiring soon!",
      message: `Your certificate for "${course.title}" expires on ${expiryDate}. Re-enroll to renew your certification.`,
      link: `/courses/${course.slug}`,
    });
    notified++;
  }

  // 2. Already expired certificates
  const expired = getExpiredCertificates();
  for (const cert of expired) {
    const certUser = db.users.find((u) => u.id === cert.userId);
    const course = getCourseById(cert.courseId);
    if (!certUser || !course) continue;

    const existingNotif = db.notifications.find(
      (n) =>
        n.userId === cert.userId &&
        n.type === "recertification" &&
        n.title.includes("expired") &&
        new Date(n.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    );
    if (existingNotif) continue;

    createNotification({
      userId: cert.userId,
      type: "recertification",
      title: "🔴 Certificate expired",
      message: `Your certificate for "${course.title}" has expired. Please re-enroll and complete the course to renew your certification.`,
      link: `/courses/${course.slug}`,
    });
    notified++;
  }

  createAuditLog({
    userId: user.id,
    userName: user.name,
    action: "RECERTIFICATION_CHECK",
    entity: "certificate",
    entityId: "batch",
    details: `Recertification check: ${expiring.length} expiring, ${expired.length} expired, ${notified} notifications sent`,
  });

  return NextResponse.json({
    success: true,
    expiringCount: expiring.length,
    expiredCount: expired.length,
    notificationsSent: notified,
  });
}

// GET /api/reminders/status — Check recertification status for current user
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = readDB();
  const userCerts = db.certificates.filter((c) => c.userId === user.id);
  const now = new Date();

  const expiringCerts = userCerts
    .filter((c) => {
      if (!c.expiresAt) return false;
      const expiry = new Date(c.expiresAt);
      const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return expiry < threshold && expiry > now;
    })
    .map((c) => {
      const course = getCourseById(c.courseId);
      return {
        code: c.code,
        courseTitle: course?.title || "Unknown",
        expiresAt: c.expiresAt,
        daysLeft: Math.ceil((new Date(c.expiresAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      };
    });

  const expiredCerts = userCerts
    .filter((c) => c.expiresAt && new Date(c.expiresAt) < now)
    .map((c) => {
      const course = getCourseById(c.courseId);
      return {
        code: c.code,
        courseTitle: course?.title || "Unknown",
        expiredAt: c.expiresAt,
      };
    });

  return NextResponse.json({ expiring: expiringCerts, expired: expiredCerts });
}
