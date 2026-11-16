import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAuditLogs, getAuditLogCount } from "@/lib/store";

// GET /api/audit-logs?limit=100&offset=0 — admin/auditor only
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "auditor") {
    return NextResponse.json({ error: "Forbidden — admin or auditor role required" }, { status: 403 });
  }

  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

  const logs = getAuditLogs(limit, offset);
  const total = getAuditLogCount();

  return NextResponse.json({ logs, total, limit, offset });
}
