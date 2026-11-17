import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCourseById, formatPrice } from "@/lib/courses";
import { getCurrentUser } from "@/lib/auth";
import { getCategoryById, getLessonsForCourse } from "@/lib/store";
import CheckoutForm from "@/components/CheckoutForm";
import CurrencyDisplay from "@/components/CurrencyDisplay";

export const revalidate = 0;

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = getCourseById(courseId);
  if (!course) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (course.price === 0) redirect(`/courses/${course.slug}`);

  const demoMode = (process.env.PAYMENT_MODE || "demo") !== "live";
  const category = getCategoryById(course.categoryId);
  const lessonCount = getLessonsForCourse(course.id).length;

  return (
    <div className="mx-auto max-w-lg px-4 py-14">
      <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
      <p className="mt-1 text-slate-500">Complete your purchase to unlock this course.</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              {category?.icon} {category?.name || "Other"} · {lessonCount} lessons · {course.level}
            </div>
            <div className="font-semibold text-slate-900">{course.title}</div>
          </div>
          <div className="text-xl font-bold"><CurrencyDisplay priceKES={course.price} /></div>
        </div>

        <div className="pt-5">
          <CheckoutForm
            courseId={course.id}
            price={course.price}
            demoMode={demoMode}
          />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-400">
        Questions? Reach out to us before purchasing — happy to help.
      </p>
      <p className="mt-2 text-center">
        <Link href={`/courses/${course.slug}`} className="text-sm text-indigo-600 hover:underline">
          ← Back to course
        </Link>
      </p>
    </div>
  );
}
