import { getPublishedCourses, getStudentStats } from "@/lib/catalog";
import { catalogToCourse, courses as sampleCourses } from "@/data/courses";
import { studentBase } from "@/data/home";
import { CourseCategories } from "./course-categories";
import { PopularCourses } from "./popular-courses";

/**
 * Homepage course sections. Shows the courses published in the Admin Panel;
 * until at least one is published, the sample courses are shown instead.
 * Student numbers = the starting number below + active enrollments.
 */
export async function CourseCatalog() {
  const [catalog, stats] = await Promise.all([getPublishedCourses(), getStudentStats()]);
  // Starting numbers, by slug (a database course with the same slug keeps it).
  const base = new Map(sampleCourses.map((c) => [c.id, c.students ?? 0]));
  const published = catalog.map((c) => ({
    ...catalogToCourse(c),
    students: (base.get(c.slug) ?? 0) + (stats.bySlug[c.slug] ?? 0) || undefined,
  }));
  const courses = published.length
    ? published
    : sampleCourses.map((c) => ({ ...c, students: (c.students ?? 0) + (stats.bySlug[c.id] ?? 0) || undefined }));
  return (
    <>
      <CourseCategories courses={courses} />
      <PopularCourses courses={courses} totalStudents={studentBase + stats.total} />
    </>
  );
}
