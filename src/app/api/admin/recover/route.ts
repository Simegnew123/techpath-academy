import { NextRequest, NextResponse } from "next/server";
import { readDB, mutate, uid, nowISO } from "@/lib/store";
import bcrypt from "bcryptjs";

/**
 * Admin Recovery Endpoint
 *
 * POST /api/admin/recover
 * Body: { email, securityAnswer, newPassword? }
 *
 * If the email matches the platform owner (ademezerihun2013@gmail.com)
 * and the security answer matches "techpath", the account is:
 *   - Created if it doesn't exist (with the provided newPassword or "admin123")
 *   - Promoted to admin role
 *   - Password reset if newPassword is provided
 *
 * This is a recovery mechanism for when the admin account is missing
 * or has the wrong role on a fresh deployment.
 */

const OWNER_EMAIL = "ademezerihun2013@gmail.com";
const OWNER_SECURITY_ANSWER = "techpath";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const securityAnswer = String(body?.securityAnswer || "").trim().toLowerCase();
  const newPassword = String(body?.password || "").trim();

  if (!email || !securityAnswer) {
    return NextResponse.json(
      { error: "Email and security answer are required." },
      { status: 400 }
    );
  }

  // Only the platform owner email can be recovered this way
  if (email !== OWNER_EMAIL) {
    return NextResponse.json(
      { error: "This recovery endpoint only works for the platform owner account." },
      { status: 403 }
    );
  }

  // Verify the security answer
  if (securityAnswer !== OWNER_SECURITY_ANSWER) {
    return NextResponse.json(
      { error: "Incorrect security answer." },
      { status: 401 }
    );
  }

  const db = readDB();
  const existing = db.users.find((u) => u.email === email);

  if (existing) {
    // Promote to admin + optionally reset password
    mutate((d) => {
      const u = d.users.find((u) => u.email === email);
      if (u) {
        u.role = "admin" as const;
        if (newPassword && newPassword.length >= 6) {
          u.passwordHash = bcrypt.hashSync(newPassword, 10);
        }
      }
    });
    return NextResponse.json({
      success: true,
      message: `Account ${email} has been promoted to admin${newPassword ? " and password updated" : ""}. You can now log in.`,
    });
  } else {
    // Create the admin account from scratch
    const admin = {
      id: uid(),
      name: "Simegnew Ademe",
      email: OWNER_EMAIL,
      passwordHash: bcrypt.hashSync(newPassword || "admin123", 10),
      role: "admin" as const,
      bio: "IT educator and founder of TechPath Academy.",
      avatar: "",
      title: "Founder & Lead Instructor",
      createdAt: nowISO(),
      securityQuestion: "What was the name of your first pet?",
      securityAnswerHash: bcrypt.hashSync(OWNER_SECURITY_ANSWER, 10),
    };
    mutate((d) => { d.users.push(admin); });
    return NextResponse.json({
      success: true,
      message: `Admin account created for ${email}. You can now log in with your new password.`,
    });
  }
}
