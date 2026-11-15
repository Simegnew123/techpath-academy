import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCourseById } from "@/lib/courses";
import { getModulesForCourse, getLessonsForModule } from "@/lib/store";
import AdminCourseForm from "@/components/AdminCourseForm";
import { CATEGORIES } from "@/lib/categories";

export const revalidate = 0;

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "instructor") redirect("/");

  const course = getCourseById(id);
  if (!course) notFound();

  // Instructors can only edit their own courses
  if (user.role === "instructor" && course.instructorId !== user.id) {
    redirect("/admin");
  }

  const cats = CATEGORIES.filter((c) => c.slug !== "other").map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
  }));

  const modules = getModulesForCourse(course.id);
  const moduleData = modules.map((m) => ({
    id: m.id,
    title: m.title,
    lessons: getLessonsForModule(m.id).map((l) => ({
      id: l.id,
      title: l.title,
      videoUrl: l.videoUrl,
      content: l.content,
      type: l.type,
      duration: l.duration,
      preview: l.preview,
    })),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Edit Course</h1>
      <p className="mt-1 text-slate-500">
        Make changes below and click Save. Modules and lessons will be updated.
      </p>
      <div className="mt-6">
        <AdminCourseForm
          categories={cats}
          instructorId={course.instructorId || user.id}
          initial={{
            id: course.id,
            title: course.title,
            slug: course.slug,
            categoryId: course.categoryId,
            description: course.description,
            coverImage: course.coverImage,
            price: course.price,
            published: course.published,
            level: course.level,
            language: course.language,
            modules: moduleData,
          }}
        />
      </div>
    </div>
  );
}
