import { NextRequest, NextResponse } from "next/server";
import { getNotifications, getUnreadCount, createNotification } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

// GET /api/notifications — list current user's notifications
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "0");
  const notifications = limit > 0 ? getNotifications(user.id, limit) : getNotifications(user.id);
  const unread = getUnreadCount(user.id);

  return NextResponse.json({ notifications, unread });
}

// POST /api/notifications — create a notification (internal use)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.title) {
    return NextResponse.json({ error: "userId and title are required." }, { status: 400 });
  }

  const notif = createNotification({
    userId: String(body.userId),
    type: String(body.type || "admin"),
    title: String(body.title),
    message: String(body.message || ""),
    link: String(body.link || ""),
  });

  return NextResponse.json({ notification: notif }, { status: 201 });
}
