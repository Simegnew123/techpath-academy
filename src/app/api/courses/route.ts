import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCourse, createModule, addLesson, createCTFChallenge, createLabConfig } from "@/lib/courses";
import { getCategoryByName } from "@/lib/categories";
import { notifyAllStudents } from "@/lib/store";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor")
    return NextResponse.json({ error: "Admin or instructor only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const title = String(body?.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  // Resolve categoryId from category name or id
  let categoryId = String(body?.categoryId || body?.category || "");
  if (!categoryId || categoryId.length < 10) {
    // It's a category name, resolve to id
    const cat = getCategoryByName(categoryId) || getCategoryByName("IT Support");
    categoryId = cat?.id || "cat-it-support";
  }

  const course = createCourse({
    title,
    categoryId,
    description: String(body?.description || ""),
    coverImage: String(body?.coverImage || ""),
    price: Number(body?.price) || 0,
    slug: String(body?.slug || ""),
    published: Boolean(body?.published),
    instructorId: user.id,
    level: String(body?.level || "Beginner") as "Beginner" | "Intermediate" | "Advanced",
    language: String(body?.language || "English"),
  });

  // Handle modules with nested lessons (new format)
  const modules = Array.isArray(body?.modules) ? body.modules : [];

  // Fallback: if no modules but lessons exist (old format), put all in one module
  const oldLessons = Array.isArray(body?.lessons) ? body.lessons : [];
  if (modules.length === 0 && oldLessons.length > 0) {
    modules.push({ title: "Course Content", lessons: oldLessons });
  }

  for (const mod of modules) {
    if (!String(mod?.title || "").trim()) continue;
    const moduleRecord = createModule(course.id, String(mod.title).trim());
    const modLessons = Array.isArray(mod.lessons) ? mod.lessons : [];
    modLessons
      .filter((l: Record<string, unknown>) => l && String(l.title || "").trim())
      .forEach((l: Record<string, unknown>) => {
        const lesson = addLesson({
          moduleId: moduleRecord.id,
          courseId: course.id,
          title: String(l.title).trim(),
          type: String(l.type || "text") as "video" | "text" | "quiz" | "pdf" | "ctf" | "lab",
          videoUrl: String(l.videoUrl || ""),
          content: String(l.content || ""),
          duration: Number(l.duration) || 0,
          preview: Boolean(l.preview),
        });

        // Create CTF challenge if this is a CTF lesson
        if (lesson.type === "ctf" && String(l.ctfFlag || "").trim()) {
          createCTFChallenge({
            lessonId: lesson.id,
            courseId: course.id,
            title: lesson.title,
            description: String(l.ctfDescription || ""),
            category: String(l.ctfCategory || "misc") as "crypto" | "forensics" | "network" | "web" | "linux" | "reverse" | "misc",
            difficulty: String(l.ctfDifficulty || "easy") as "easy" | "medium" | "hard" | "expert",
            flag: String(l.ctfFlag),
            points: Number(l.ctfPoints) || 50,
            hint: String(l.ctfHint || ""),
            maxAttempts: Number(l.ctfMaxAttempts) || 0,
          });
        }

        // Create Lab config if this is a Lab lesson
        if (lesson.type === "lab") {
          createLabConfig({
            lessonId: lesson.id,
            courseId: course.id,
            title: lesson.title,
            description: String(l.content || "").substring(0, 200),
            type: String(l.labType || "terminal") as "terminal" | "network_sim" | "packet_capture" | "firewall_config" | "cli_challenge",
            environment: String(l.labEnvironment || "Linux Terminal"),
            timeLimit: Number(l.labTimeLimit) || 0,
            steps: Array.isArray(l.labSteps) ? l.labSteps : [],
            commands: Array.isArray(l.labCommands) ? l.labCommands : [],
          });
        }
      });
  }

  // Notify all students about the new course (only if published)
  if (course.published) {
    const priceText = course.price === 0 ? "FREE" : `${course.price.toLocaleString()}`;
    notifyAllStudents(
      "📖 New course available",
      `"${course.title}" is now available — ${priceText}. Check it out!`,
      `/courses/${course.slug}`
    );
  }

  return NextResponse.json({ course: { id: course.id, slug: course.slug } });
}
