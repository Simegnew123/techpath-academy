import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exportUsersCSV, exportEnrollmentsCSV, exportPaymentsCSV, createAuditLog } from "@/lib/store";

// GET /api/export?type=users|enrollments|payments — admin only
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin role required" }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type") || "users";
  let csv = "";
  let filename = "";

  switch (type) {
    case "users":
      csv = exportUsersCSV();
      filename = "users.csv";
      break;
    case "enrollments":
      csv = exportEnrollmentsCSV();
      filename = "enrollments.csv";
      break;
    case "payments":
      csv = exportPaymentsCSV();
      filename = "payments.csv";
      break;
    default:
      return NextResponse.json({ error: "Invalid type. Use: users, enrollments, payments" }, { status: 400 });
  }

  createAuditLog({
    userId: user.id,
    userName: user.name,
    action: "EXPORT_DATA",
    entity: "export",
    entityId: type,
    details: `Exported ${type} data as CSV`,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
