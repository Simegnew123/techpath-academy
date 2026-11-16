import { NextRequest, NextResponse } from "next/server";
import { markNotificationRead, deleteNotification } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

// PATCH /api/notifications/[id] — mark a notification as read
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  markNotificationRead(id);
  return NextResponse.json({ ok: true });
}

// DELETE /api/notifications/[id] — delete a notification
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  deleteNotification(id);
  return NextResponse.json({ ok: true });
}
