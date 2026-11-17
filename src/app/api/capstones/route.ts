import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCapstoneProjects, getUserCapstoneProjects, createCapstoneProject, updateCapstoneProject } from "@/lib/store";

// GET /api/capstones — list published capstones (Hall of Fame) or user's own
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";

  if (mine) {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ projects: getUserCapstoneProjects(user.id) });
  }

  const projects = getCapstoneProjects();
  return NextResponse.json({ projects, count: projects.length });
}

// POST /api/capstones — submit a capstone project
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title || !body.courseId) {
    return NextResponse.json({ error: "title and courseId required" }, { status: 400 });
  }

  const project = createCapstoneProject({
    userId: user.id,
    courseId: body.courseId,
    title: body.title,
    description: body.description || "",
    repositoryUrl: body.repositoryUrl || "",
    demoUrl: body.demoUrl || "",
    screenshot: body.screenshot || "",
    isPublished: body.isPublished ?? false,
  });
  return NextResponse.json({ project }, { status: 201 });
}

// PATCH /api/capstones — update capstone project
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  updateCapstoneProject(id, updates);
  return NextResponse.json({ success: true });
}
