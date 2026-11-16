import { NextRequest, NextResponse } from "next/server";
import { markAllNotificationsRead } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

// POST /api/notifications/read-all — mark all as read for current user
export async function POST(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  markAllNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
}
