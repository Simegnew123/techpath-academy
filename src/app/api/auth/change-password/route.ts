import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB, mutate } from "@/lib/store";
import { verifyPassword, hashPassword } from "@/lib/auth";

// POST /api/auth/change-password — change password while logged in
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPassword = String(body?.currentPassword || "");
  const newPassword = String(body?.newPassword || "");

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new passwords are required." }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const db = readDB();
  const fullUser = db.users.find((u) => u.id === user.id);
  if (!fullUser) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (!verifyPassword(currentPassword, fullUser.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  mutate((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (u) u.passwordHash = newHash;
  });

  return NextResponse.json({ success: true });
}
