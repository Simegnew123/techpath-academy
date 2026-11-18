import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllCompetencies, createCompetency } from "@/lib/store";

// GET /api/competencies — list all competencies (admin/instructor only)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const competencies = getAllCompetencies();
  return NextResponse.json({ competencies });
}

// POST /api/competencies — create a competency (admin only)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const description = String(body?.description || "").trim();
  const category = String(body?.category || "General").trim();

  if (!name) {
    return NextResponse.json({ error: "Competency name is required" }, { status: 400 });
  }

  const competency = createCompetency({ name, description, category });
  return NextResponse.json({ competency });
}
