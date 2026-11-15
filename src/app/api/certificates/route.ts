import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB, getCertificate, getCourseById } from "@/lib/store";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const courseId = url.searchParams.get("courseId");

  // Verify by certificate code (public verification)
  if (code) {
    const db = readDB();
    const cert = db.certificates.find((c) => c.code === code.toUpperCase());
    if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    const student = db.users.find((u) => u.id === cert.userId);
    const course = getCourseById(cert.courseId);
    return NextResponse.json({
      valid: true,
      certificate: {
        code: cert.code,
        issuedAt: cert.issuedAt,
        studentName: student?.name || "",
        courseTitle: course?.title || "",
      },
    });
  }

  // Get certificate for current user + course
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const cert = getCertificate(user.id, courseId);
  if (!cert) return NextResponse.json({ error: "No certificate" }, { status: 404 });

  const course = getCourseById(courseId);
  return NextResponse.json({
    certificate: {
      id: cert.id,
      code: cert.code,
      issuedAt: cert.issuedAt,
      courseTitle: course?.title || "",
      studentName: user.name,
    },
  });
}
