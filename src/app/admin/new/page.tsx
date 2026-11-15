import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminCourseForm from "@/components/AdminCourseForm";
import { CATEGORIES } from "@/lib/categories";

export const revalidate = 0;

export default async function NewCoursePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "instructor") redirect("/");

  const cats = CATEGORIES.filter((c) => c.slug !== "other").map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Create a New Course</h1>
      <p className="mt-1 text-slate-500">
        Fill in the details below. You can add modules, lessons, and edit anytime.
      </p>
      <div className="mt-6">
        <AdminCourseForm categories={cats} instructorId={user.id} />
      </div>
    </div>
  );
}
