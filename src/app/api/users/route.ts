import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllUsers, updateUserRole, deleteUser, readDB, createAuditLog, mutate } from "@/lib/store";
import { hashPassword } from "@/lib/auth";

// GET /api/users — list all users (admin only)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const users = getAllUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    title: u.title || "",
    createdAt: u.createdAt,
    enrollments: readDB().enrollments.filter((e) => e.userId === u.id).length,
    certificates: readDB().certificates.filter((c) => c.userId === u.id).length,
  }));
  return NextResponse.json({ users });
}

// POST /api/users — update role or delete (admin only)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { userId, action, role } = await req.json();

  if (action === "delete" && userId) {
    if (userId === user.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    deleteUser(userId);
    createAuditLog({ userId: user.id, userName: user.name, action: "DELETE_USER", entity: "user", entityId: userId, details: "Deleted user account" });
    return NextResponse.json({ success: true });
  }

  if (action === "role" && userId && role) {
    updateUserRole(userId, role);
    createAuditLog({ userId: user.id, userName: user.name, action: "ROLE_CHANGE", entity: "user", entityId: userId, details: `Changed role to ${role}` });
    return NextResponse.json({ success: true });
  }

  if (action === "reset_password" && userId) {
    const { newPassword } = await req.json();
    const pw = String(newPassword || "");
    if (pw.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    const newHash = await hashPassword(pw);
    mutate((d) => {
      const u = d.users.find((x) => x.id === userId);
      if (u) u.passwordHash = newHash;
    });
    createAuditLog({ userId: user.id, userName: user.name, action: "RESET_PASSWORD", entity: "user", entityId: userId, details: "Admin reset user password" });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
