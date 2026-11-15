import CourseCard from "@/components/CourseCard";
import { getCourses } from "@/lib/courses";
import { CATEGORIES } from "@/lib/categories";
import { buildCourseCardData } from "@/lib/courseData";

export const revalidate = 60;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const all = getCourses().filter((c) => c.published);
  const allCardData = all.map(buildCourseCardData);

  // category param can be a category slug or category name
  let filtered = allCardData;
  if (category === "Free") {
    filtered = allCardData.filter((c) => c.price === 0);
  } else if (category) {
    // Match by slug or name
    const matchCat = CATEGORIES.find(
      (c) => c.slug === category || c.name === category
    );
    if (matchCat) {
      filtered = allCardData.filter((c) => c.categoryName === matchCat.name);
    } else {
      // Fall back to direct name match
      filtered = allCardData.filter((c) => c.categoryName === category);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">All Courses</h1>
      <p className="mt-2 text-slate-500">
        Browse our catalog — free tutorials and premium courses.
      </p>

      {/* Filter pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href="/courses"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            !category
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          All
        </a>
        <a
          href="/courses?category=Free"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            category === "Free"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          ✅ Free
        </a>
        {CATEGORIES.filter((c) => c.slug !== "other").map((cat) => (
          <a
            key={cat.id}
            href={`/courses?category=${encodeURIComponent(cat.slug)}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              category === cat.slug || category === cat.name
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat.icon} {cat.name}
          </a>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 text-center">
          <div className="text-5xl">📭</div>
          <p className="mt-4 text-slate-400">
            No courses in this category yet — check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
