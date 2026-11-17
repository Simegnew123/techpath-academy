import Link from "next/link";
import CurrencyDisplay from "./CurrencyDisplay";

export type CourseCardData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  price: number;
  published: boolean;
  level: string;
  categoryName: string;
  categoryIcon: string;
  rating: number;
  reviewCount: number;
  lessonCount: number;
  totalDuration: number;
  instructorName: string;
};

export function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `KSh ${price.toLocaleString()}`;
}

export function formatDuration(minutes: number): string {
  if (minutes === 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Cover image */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-200">
        {course.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.coverImage}
            alt={course.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-4xl">
            {course.categoryIcon || "🎬"}
          </div>
        )}
        {/* Level badge */}
        <span className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          {course.level}
        </span>
        {/* Price badge */}
        <span className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur"
          style={{
            backgroundColor: course.price === 0 ? "rgba(16,185,129,0.9)" : "rgba(255,255,255,0.95)",
            color: course.price === 0 ? "white" : "#1e293b",
          }}
        >
          <CurrencyDisplay priceKES={course.price} showSelector={false} />
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          {course.categoryIcon} {course.categoryName}
        </span>
        <h3 className="mt-1 font-bold text-slate-900 group-hover:text-indigo-700">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-500">
          {course.description}
        </p>

        {/* Meta: rating + lessons + duration */}
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          {course.rating > 0 && (
            <span className="flex items-center gap-0.5 font-medium text-amber-500">
              ⭐ {course.rating.toFixed(1)}
              <span className="text-slate-400">({course.reviewCount})</span>
            </span>
          )}
          <span>📚 {course.lessonCount} lessons</span>
          {course.totalDuration > 0 && (
            <span>⏱ {formatDuration(course.totalDuration)}</span>
          )}
        </div>

        {/* Instructor */}
        {course.instructorName && (
          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {course.instructorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-600">{course.instructorName}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
