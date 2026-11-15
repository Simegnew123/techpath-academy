import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  updateCourse, deleteCourse,
  getLessons, updateLesson, deleteLesson, addLesson,
  createModule, deleteModule, getModulesForCourse,
} from "@/lib/courses";
import { getCategoryByName } from "@/lib/categories";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor")
    return NextResponse.json({ error: "Admin or instructor only." }, { status: 403 });

  const body = await req.json().catch(() => null);

  // Resolve category
  let categoryId: string | undefined = undefined;
  if (body?.categoryId !== undefined || body?.category !== undefined) {
    const catInput = String(body?.categoryId || body?.category || "");
    if (catInput.length > 10) {
      categoryId = catInput;
    } else {
      const cat = getCategoryByName(catInput) || getCategoryByName("IT Support");
      categoryId = cat?.id;
    }
  }

  const course = updateCourse(id, {
    title: body?.title !== undefined ? String(body.title) : undefined,
    slug: body?.slug !== undefined ? String(body.slug) : undefined,
    categoryId,
    description: body?.description !== undefined ? String(body.description) : undefined,
    coverImage: body?.coverImage !== undefined ? String(body.coverImage) : undefined,
    price: body?.price !== undefined ? Number(body.price) : undefined,
    published: body?.published !== undefined ? Boolean(body.published) : undefined,
    level: body?.level !== undefined ? String(body.level) as "Beginner" | "Intermediate" | "Advanced" : undefined,
    language: body?.language !== undefined ? String(body.language) : undefined,
  });

  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });

  // Handle modules + lessons if provided
  if (Array.isArray(body?.modules)) {
    // Delete all existing modules and lessons, then recreate
    const existingMods = getModulesForCourse(id);
    existingMods.forEach((m) => deleteModule(m.id));

    for (const mod of body.modules) {
      if (!String(mod?.title || "").trim()) continue;
      const moduleRecord = createModule(id, String(mod.title).trim());
      const modLessons = Array.isArray(mod.lessons) ? mod.lessons : [];
      modLessons
        .filter((l: Record<string, unknown>) => l && String(l.title || "").trim())
        .forEach((l: Record<string, unknown>) => {
          addLesson({
            moduleId: moduleRecord.id,
            courseId: id,
            title: String(l.title).trim(),
            type: (String(l.type || "text") as "video" | "text" | "quiz" | "pdf"),
            videoUrl: String(l.videoUrl || ""),
            content: String(l.content || ""),
            duration: Number(l.duration) || 0,
            preview: Boolean(l.preview),
          });
        });
    }
  } else if (Array.isArray(body?.lessons)) {
    // Legacy: flat lessons, no modules — create one default module
    const existingMods = getModulesForCourse(id);
    if (existingMods.length === 0) {
      const mod = createModule(id, "Course Content");
      body.lessons
        .filter((l: Record<string, unknown>) => l && String(l.title || "").trim())
        .forEach((l: Record<string, unknown>) => {
          addLesson({
            moduleId: mod.id,
            courseId: id,
            title: String(l.title).trim(),
            videoUrl: String(l.videoUrl || ""),
            content: String(l.content || ""),
          });
        });
    } else {
      // Update lessons in first module
      const mod = existingMods[0];
      const incoming = body.lessons.filter(
        (l: Record<string, unknown>) => l && String(l.title || "").trim()
      );
      const existing = getLessons(id);
      const incomingIds = incoming.map((l: Record<string, unknown>) => l.id).filter(Boolean);

      existing
        .filter((l) => !incomingIds.includes(l.id))
        .forEach((l) => deleteLesson(l.id));

      incoming.forEach((l: Record<string, unknown>, idx: number) => {
        const patch = {
          order: idx + 1,
          title: String(l.title).trim(),
          videoUrl: String(l.videoUrl || ""),
          content: String(l.content || ""),
        };
        if (l.id) {
          updateLesson(String(l.id), patch);
        } else {
          addLesson({ moduleId: mod.id, courseId: id, ...patch });
        }
      });
    }
  }

  return NextResponse.json({ course: { id: course.id, slug: course.slug } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor")
    return NextResponse.json({ error: "Admin or instructor only." }, { status: 403 });

  deleteCourse(id);
  return NextResponse.json({ ok: true });
}
