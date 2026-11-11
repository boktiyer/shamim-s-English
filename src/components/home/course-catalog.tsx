import { getPublishedCourses } from "@/lib/catalog";
import { catalogToCourse, courses as sampleCourses } from "@/data/courses";
import { CourseCategories } from "./course-categories";
import { PopularCourses } from "./popular-courses";

/**
 * Homepage course sections. Shows the courses published in the Admin Panel;
 * until at least one is published, the sample courses are shown instead.
 */
export async function CourseCatalog() {
  const published = (await getPublishedCourses()).map(catalogToCourse);
  const courses = published.length ? published : sampleCourses;
  return (
    <>
      <CourseCategories courses={courses} />
      <PopularCourses courses={courses} />
    </>
  );
}
