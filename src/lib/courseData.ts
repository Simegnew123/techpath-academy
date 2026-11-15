import { readDB, getCategoryById, getInstructor, getAverageRating, getReviewsForCourse, getLessonsForCourse, type Course } from "./store";
import { getCategoryByName } from "./categories";
import type { CourseCardData } from "@/components/CourseCard";

export function buildCourseCardData(course: Course): CourseCardData {
  const db = readDB();
  // Resolve category
  let categoryName = "Other";
  let categoryIcon = "📚";
  const cat = getCategoryById(course.categoryId) || getCategoryByName(course.categoryId);
  if (cat) {
    categoryName = cat.name;
    categoryIcon = cat.icon;
  } else {
    // Try old-style category field
    const oldCat = (course as Record<string, unknown>).category as string;
    if (oldCat) {
      const found = getCategoryByName(oldCat);
      if (found) {
        categoryName = found.name;
        categoryIcon = found.icon;
      } else {
        categoryName = oldCat;
      }
    }
  }

  // Instructor
  const instructor = course.instructorId ? getInstructor(course.instructorId) : undefined;

  // Rating
  const reviews = getReviewsForCourse(course.id);
  const rating = getAverageRating(course.id);

  // Lessons
  const lessons = getLessonsForCourse(course.id);
  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    coverImage: course.coverImage,
    price: course.price,
    published: course.published,
    level: (course as Record<string, unknown>).level as string || "Beginner",
    categoryName,
    categoryIcon,
    rating,
    reviewCount: reviews.length,
    lessonCount: lessons.length,
    totalDuration,
    instructorName: instructor?.name || "",
  };
}
